import { BRAND } from "../brand.js";
import { db, ordersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createEsimOrder, createTopupOrder } from "./airalo.js";
import { isEsimergePackage, issueEsim, qrDataUrl } from "./esimerge.js";
import { ESA_TOPUP_PREFIX, esaTopup, findEsaPackage, parseEsaId, placeEsaOrder, waitForEsaEsim } from "./esimaccess.js";

// Kept in esimQrCode while an eSIM Access order is placed but its eSIM is not
// allocated yet, so a retry resumes that order instead of buying a second one.
const ESA_PENDING = "esa-order:";

/**
 * Held by whichever worker is currently buying from Airalo for an order.
 *
 * `status` is a plain text column with no constraint, so this needed no
 * migration. Nothing outside fulfillment branches on it: the customer's
 * checkout polls for a QR code rather than a status, and the admin panel
 * offers its provision button on `paid` only.
 */
export const FULFILLING = "fulfilling";

// Only the fields fulfillment needs, so both the QPay flow and the admin route
// can hand over a full order row unchanged.
export interface FulfillableOrder {
  id: number;
  packageId: string;
  esimIccid: string | null;
}

export interface FulfillResult {
  iccid: string | null;
  qrCodeUrl: string | null;
  /** True when this recharged an existing SIM rather than issuing a new one. */
  topup: boolean;
}

/**
 * Buys the order's package from Airalo and marks the order completed.
 *
 * An order that already carries an ICCID is a top-up for that SIM — issuing a
 * fresh eSIM for it would bill Airalo twice and hand the customer a QR for a
 * SIM they never asked for, while the one they installed stays empty.
 *
 * Throws on failure and leaves the order's status untouched, so each caller
 * decides what to do: the payment flow rolls it back to `paid` for a later
 * retry, the admin route reports the error to whoever pressed the button.
 */
export async function fulfillOrder(order: FulfillableOrder): Promise<FulfillResult> {
  if (order.esimIccid && order.packageId.startsWith(ESA_TOPUP_PREFIX)) {
    const code = order.packageId.slice(ESA_TOPUP_PREFIX.length);
    console.log(`[eSIM Access] Topping up ICCID ${order.esimIccid} for order #${order.id}, package: ${code}`);
    await esaTopup(order.esimIccid, code, `${BRAND.invoicePrefix}-order-${order.id}`);
    await db.update(ordersTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id));
    return { iccid: order.esimIccid, qrCodeUrl: null, topup: true };
  }

  if (order.esimIccid) {
    console.log(`[Airalo] Topping up ICCID ${order.esimIccid} for order #${order.id}, package: ${order.packageId}`);
    await createTopupOrder(order.packageId, order.esimIccid, `${BRAND.name} topup #${order.id}`);

    await db.update(ordersTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id));

    console.log(`[Airalo] Topup fulfilled for order #${order.id}`);
    // A top-up reuses the SIM the customer already installed, so there is no
    // new QR code to hand back.
    return { iccid: order.esimIccid, qrCodeUrl: null, topup: true };
  }

  const esa = parseEsaId(order.packageId);
  if (esa) {
    const [row] = await db.select({ esimQrCode: ordersTable.esimQrCode }).from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
    let orderNo = row?.esimQrCode?.startsWith(ESA_PENDING) ? row.esimQrCode.slice(ESA_PENDING.length) : null;
    if (!orderNo) {
      const pkg = await findEsaPackage(esa.code);
      if (!pkg) throw new Error(`eSIM Access package ${esa.code} not found`);
      console.log(`[eSIM Access] Ordering ${esa.code}${esa.days ? ` × ${esa.days} days` : ""} for order #${order.id}`);
      orderNo = await placeEsaOrder(pkg, esa.days, `${BRAND.invoicePrefix}-order-${order.id}`);
      // Record the order before waiting: a crash or timeout from here on must
      // resume this orderNo, never place a new one.
      await db.update(ordersTable)
        .set({ esimQrCode: ESA_PENDING + orderNo, updatedAt: new Date() })
        .where(eq(ordersTable.id, order.id));
    } else {
      console.log(`[eSIM Access] Resuming order ${orderNo} for order #${order.id}`);
    }

    const sim = await waitForEsaEsim(orderNo);
    const qrCodeUrl = sim.qrCodeUrl || (await qrDataUrl(sim.ac));
    await db.update(ordersTable)
      .set({ status: "completed", esimIccid: sim.iccid, esimQrCode: qrCodeUrl, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id));
    console.log(`[eSIM Access] eSIM fulfilled for order #${order.id} — ICCID: ${sim.iccid}`);
    return { iccid: sim.iccid, qrCodeUrl, topup: false };
  }

  if (isEsimergePackage(order.packageId)) {
    console.log(`[eSimerge] Fulfilling eSIM for order #${order.id}, package: ${order.packageId}`);
    // Same key on every attempt for this order: a retry after a timeout or a
    // crash gets back the eSIM already issued instead of a second one. The
    // "-order-" infix keeps it inside the 8–128 characters eSimerge accepts.
    const esim = await issueEsim(order.packageId, `${BRAND.invoicePrefix}-order-${order.id}`, `${BRAND.name} #${order.id}`);
    const qrCodeUrl = await qrDataUrl(esim.qr_code);

    await db.update(ordersTable)
      .set({ status: "completed", esimIccid: esim.iccid, esimQrCode: qrCodeUrl, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id));

    console.log(`[eSimerge] eSIM fulfilled for order #${order.id} — ICCID: ${esim.iccid}`);
    return { iccid: esim.iccid, qrCodeUrl, topup: false };
  }

  console.log(`[Airalo] Fulfilling eSIM for order #${order.id}, package: ${order.packageId}`);
  const airaloOrder = await createEsimOrder(order.packageId, 1, `${BRAND.name} #${order.id}`);

  const sim = airaloOrder.sims?.[0];
  if (!sim) throw new Error("No SIM returned from Airalo");

  const qrCodeUrl = sim.qrcode_url || sim.qrcode;

  await db.update(ordersTable)
    .set({
      status: "completed",
      esimIccid: sim.iccid,
      esimQrCode: qrCodeUrl,
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, order.id));

  console.log(`[Airalo] eSIM fulfilled for order #${order.id} — ICCID: ${sim.iccid}`);
  return { iccid: sim.iccid, qrCodeUrl, topup: false };
}

/**
 * Take exclusive ownership of a paid order. Returns false when someone else
 * already holds it, so the retry sweeper and the admin's provision button can
 * run at the same moment without both buying a SIM.
 *
 * claimPendingOrder() in the QPay routes guards `pending` -> `paid` the same
 * way; this is the matching guard one step later.
 */
export async function claimForFulfillment(orderId: number): Promise<boolean> {
  const claimed = await db.update(ordersTable)
    .set({ status: FULFILLING, updatedAt: new Date() })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "paid")))
    .returning({ id: ordersTable.id });
  return claimed.length > 0;
}

/** Hand a claimed order back so it can be attempted again. */
export async function releaseToPaid(orderId: number): Promise<void> {
  await db.update(ordersTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, FULFILLING)));
}

/**
 * Claim, fulfil, and release the claim if it fails.
 *
 * Returns null when the order was not claimable — either another worker has it
 * or it is no longer `paid`. Rethrows a fulfillment failure once the order is
 * back to `paid`, leaving the caller to decide how loudly to complain.
 */
export async function runFulfillment(order: FulfillableOrder): Promise<FulfillResult | null> {
  if (!(await claimForFulfillment(order.id))) return null;

  try {
    return await fulfillOrder(order);
  } catch (err) {
    try {
      await releaseToPaid(order.id);
    } catch (releaseErr) {
      // Leaving it in `fulfilling` is survivable: the sweeper reclaims a stale
      // claim once it is old enough.
      console.error(`[Airalo] Could not release order #${order.id} back to paid:`, releaseErr);
    }
    throw err;
  }
}
