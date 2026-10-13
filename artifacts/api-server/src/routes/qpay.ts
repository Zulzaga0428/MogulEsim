import { BRAND } from "../brand.js";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, ordersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createInvoice, checkPayment } from "../lib/qpay";
import { findAiraloPackage, getSimTopups } from "../lib/airalo";
import { runFulfillment, type FulfillableOrder } from "../lib/fulfillment.js";
import { findLocalPackage, overriddenPrice, priceFromUsd, slugForCountryCode } from "./countries";
import { verifyUserToken } from "../lib/user-auth.js";

const router: IRouter = Router();

// Where QPay should send its payment callback. Railway sets
// RAILWAY_PUBLIC_DOMAIN itself; PUBLIC_API_URL overrides it for a custom domain.
function getCallbackBase(): string {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

// Resolve the authoritative price for a package on the server. The client's
// priceInMnt is display-only and must never decide what the customer pays.
async function resolvePriceInMnt(packageId: string): Promise<number | null> {
  try {
    const found = await findAiraloPackage(packageId);
    if (found) {
      const slug = slugForCountryCode(found.countryCode);
      return overriddenPrice(slug, found.pkg.day, found.pkg.is_unlimited, found.pkg.net_price) ?? priceFromUsd(found.pkg.net_price);
    }
  } catch (err) {
    console.error(`[QPay] Airalo price lookup failed for ${packageId}, trying local catalog:`, err);
  }
  // Local catalog prices already have overrides/formula applied at load time.
  const localPkg = findLocalPackage(packageId);
  if (localPkg) return localPkg.priceInMnt;
  return null;
}

// Atomically move a pending order to paid; returns true only for the caller
// that won the transition, so eSIM fulfillment can never run twice.
async function claimPendingOrder(orderId: number): Promise<boolean> {
  const updated = await db.update(ordersTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "pending")))
    .returning({ id: ordersTable.id });
  return updated.length > 0;
}

// Payment handlers fire this and return immediately — the customer is waiting
// on a payment response, not on Airalo. runFulfillment puts a failed order back
// to `paid`, where the retry sweeper picks it up within a minute.
function fulfillInBackground(order: FulfillableOrder): void {
  runFulfillment(order).catch((err) => {
    console.error(`[Airalo] Fulfillment failed for order #${order.id}, leaving it for the sweeper:`, err);
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildCustomerEmail(customerEmail?: string, customerPhone?: string): string {
  if (customerEmail && isValidEmail(customerEmail)) {
    return customerEmail;
  }
  if (customerPhone) {
    const phone = customerPhone.replace(/@.*$/, "").trim();
    return `${phone}@phone.avaesim.store`;
  }
  return `unknown@phone.avaesim.store`;
}

router.post("/qpay/create", async (req: Request, res: Response) => {
  try {
    const { packageId, customerName, customerPhone, customerEmail, priceInMnt: clientPrice, packageName, countrySlug } = req.body;

    if (!packageId || !customerName) {
      res.status(400).json({ error: "bad_request", message: "packageId and customerName are required" });
      return;
    }

    const priceInMnt = await resolvePriceInMnt(packageId);
    if (!priceInMnt || priceInMnt <= 0) {
      res.status(400).json({ error: "bad_request", message: `Unknown package: ${packageId}` });
      return;
    }
    if (clientPrice && Number(clientPrice) !== priceInMnt) {
      console.warn(`[QPay] Client price mismatch for ${packageId}: client sent ${clientPrice}, server computed ${priceInMnt}`);
    }

    if (!customerPhone && !customerEmail) {
      res.status(400).json({ error: "bad_request", message: "customerPhone or customerEmail is required" });
      return;
    }

    const resolvedEmail = buildCustomerEmail(customerEmail, customerPhone);

    if (!isValidEmail(resolvedEmail)) {
      res.status(400).json({ error: "bad_request", message: `Invalid customer email: ${resolvedEmail}` });
      return;
    }

    console.log(`[QPay] Creating order — email: ${resolvedEmail}, phone: ${customerPhone}`);

    const [order] = await db.insert(ordersTable).values({
      packageId,
      countrySlug: countrySlug || packageId,
      customerEmail: resolvedEmail,
      customerName,
      status: "pending",
      totalPrice: String(priceInMnt),
      currency: "MNT",
      quantity: 1,
    }).returning();

    const callbackUrl = `${getCallbackBase()}/api/qpay/callback?orderId=${order.id}`;
    const senderInvoiceNo = `${BRAND.invoicePrefix}-${order.id}-${Date.now()}`.slice(0, 24);
    const description = packageName ? `${BRAND.name} - ${packageName}` : `${BRAND.name} - Order #${order.id}`;

    const invoice = await createInvoice(priceInMnt, senderInvoiceNo, description, callbackUrl);
    const deepLinks = invoice.qPay_deeplink || invoice.urls || [];

    await db.update(ordersTable)
      .set({
        qpayInvoiceId: invoice.invoice_id,
        qpayQrImage: invoice.qr_image,
        qpayDeepLinks: JSON.stringify(deepLinks),
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, order.id));

    console.log(`[QPay] Invoice created for order #${order.id}: ${invoice.invoice_id}`);

    res.status(201).json({
      orderId: String(order.id),
      amount: priceInMnt,
      invoiceId: invoice.invoice_id,
      qrImage: invoice.qr_image,
      qrText: invoice.qr_text,
      deepLinks,
    });
  } catch (err) {
    console.error("[QPay] create error:", err);
    res.status(500).json({ error: "server_error", message: String(err) });
  }
});

// List Airalo topups available for a completed order's eSIM, with retail prices.
router.get("/qpay/topups/:orderId", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.orderId);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid order id" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    const user = await verifyUserToken(req.headers.authorization);
    if (!user?.email || user.email !== order.customerEmail) {
      res.status(401).json({ error: "unauthorized", message: "Not allowed" });
      return;
    }
    if (order.status !== "completed" || !order.esimIccid) {
      res.status(400).json({ error: "bad_request", message: "Order has no active eSIM to top up" });
      return;
    }

    const topups = await getSimTopups(order.esimIccid);
    const priced = topups
      .map((t) => ({
        packageId: t.package_id,
        title: t.title,
        data: t.data,
        validity: t.day,
        isUnlimited: t.is_unlimited,
        priceInMnt: overriddenPrice(order.countrySlug, t.day, t.is_unlimited, t.net_price) ?? priceFromUsd(t.net_price),
      }))
      .filter((t) => t.priceInMnt > 0)
      .sort((a, b) => a.validity - b.validity || a.priceInMnt - b.priceInMnt);

    res.json({ topups: priced });
  } catch (err) {
    console.error(`[Topup] List failed for order #${req.params.orderId}:`, err);
    res.status(502).json({ error: "topup_list_failed", message: "Could not fetch topups from Airalo" });
  }
});

// Create a QPay invoice for a topup. The topup is recorded as a new order row
// that carries the parent's ICCID, so payment polling and fulfillment reuse
// the normal flow.
router.post("/qpay/topup", async (req: Request, res: Response) => {
  try {
    const { orderId, packageId } = req.body;
    const id = Number(orderId);
    if (!Number.isInteger(id) || !packageId) {
      res.status(400).json({ error: "bad_request", message: "orderId and packageId are required" });
      return;
    }
    const [parent] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!parent) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    const user = await verifyUserToken(req.headers.authorization);
    if (!user?.email || user.email !== parent.customerEmail) {
      res.status(401).json({ error: "unauthorized", message: "Not allowed" });
      return;
    }
    if (parent.status !== "completed" || !parent.esimIccid) {
      res.status(400).json({ error: "bad_request", message: "Order has no active eSIM to top up" });
      return;
    }

    const topups = await getSimTopups(parent.esimIccid);
    const topup = topups.find((t) => t.package_id === packageId);
    if (!topup) {
      res.status(400).json({ error: "bad_request", message: `Topup not available for this eSIM: ${packageId}` });
      return;
    }
    const priceInMnt = overriddenPrice(parent.countrySlug, topup.day, topup.is_unlimited, topup.net_price) ?? priceFromUsd(topup.net_price);
    if (!priceInMnt || priceInMnt <= 0) {
      res.status(400).json({ error: "bad_request", message: "Could not price this topup" });
      return;
    }

    const [order] = await db.insert(ordersTable).values({
      packageId,
      countrySlug: parent.countrySlug,
      customerEmail: parent.customerEmail,
      customerName: parent.customerName,
      status: "pending",
      totalPrice: String(priceInMnt),
      currency: "MNT",
      quantity: 1,
      esimIccid: parent.esimIccid,
    }).returning();

    const callbackUrl = `${getCallbackBase()}/api/qpay/callback?orderId=${order.id}`;
    const senderInvoiceNo = `${BRAND.invoicePrefix}-${order.id}-${Date.now()}`.slice(0, 24);
    const invoice = await createInvoice(priceInMnt, senderInvoiceNo, `${BRAND.name} Topup - ${topup.title}`, callbackUrl);
    const deepLinks = invoice.qPay_deeplink || invoice.urls || [];

    await db.update(ordersTable)
      .set({
        qpayInvoiceId: invoice.invoice_id,
        qpayQrImage: invoice.qr_image,
        qpayDeepLinks: JSON.stringify(deepLinks),
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, order.id));

    console.log(`[Topup] Invoice created for topup order #${order.id} (parent #${parent.id}): ${invoice.invoice_id}`);

    res.status(201).json({
      orderId: String(order.id),
      amount: priceInMnt,
      invoiceId: invoice.invoice_id,
      qrImage: invoice.qr_image,
      qrText: invoice.qr_text,
      deepLinks,
    });
  } catch (err) {
    console.error("[Topup] create error:", err);
    res.status(500).json({ error: "server_error", message: String(err) });
  }
});

router.post("/qpay/check/:invoiceId", async (req: Request, res: Response) => {
  try {
    const invoiceId = String(req.params.invoiceId);
    const { orderId } = req.body;

    const result = await checkPayment(invoiceId);

    if (result.paid && orderId) {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, Number(orderId))).limit(1);

      if (order && order.qpayInvoiceId === invoiceId && await claimPendingOrder(order.id)) {
        console.log(`[QPay] Order #${orderId} marked as paid — triggering Airalo fulfillment`);
        fulfillInBackground(order);
      }
    }

    res.json({ paid: result.paid, count: result.count });
  } catch (err) {
    console.error("[QPay] check error:", err);
    res.status(500).json({ error: "server_error", message: String(err) });
  }
});

router.post("/qpay/callback", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query;
    console.log(`[QPay] Callback received for orderId=${orderId}`, req.body);

    if (orderId) {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, Number(orderId))).limit(1);
      if (order && order.qpayInvoiceId && order.status === "pending") {
        const result = await checkPayment(order.qpayInvoiceId);
        if (result.paid && await claimPendingOrder(order.id)) {
          console.log(`[QPay] Callback: Order #${orderId} paid — triggering Airalo fulfillment`);
          fulfillInBackground(order);
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[QPay] callback error:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
