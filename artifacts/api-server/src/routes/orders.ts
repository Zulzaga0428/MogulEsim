import { Router, type IRouter, type Request, type Response } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getSimUsage } from "../lib/airalo";
import { runFulfillment } from "../lib/fulfillment.js";
import { requireAdmin } from "../lib/admin.js";
import { verifyUserToken } from "../lib/user-auth.js";

const router: IRouter = Router();

router.get("/admin/orders", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(o => ({
      id: String(o.id),
      packageId: o.packageId,
      countrySlug: o.countrySlug,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      status: o.status,
      totalPrice: Number(o.totalPrice),
      currency: o.currency,
      esimIccid: o.esimIccid,
      esimQrCode: o.esimQrCode,
      qpayInvoiceId: o.qpayInvoiceId,
      createdAt: o.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/orders", async (req: Request, res: Response) => {
  try {
    const user = await verifyUserToken(req.headers.authorization);
    if (!user?.email) {
      res.status(401).json({ error: "unauthorized", message: "Sign in required" });
      return;
    }
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.customerEmail, user.email))
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(o => ({
      id: String(o.id),
      packageId: o.packageId,
      countrySlug: o.countrySlug,
      customerName: o.customerName,
      status: o.status,
      totalPrice: Number(o.totalPrice),
      currency: o.currency,
      esimIccid: o.esimIccid,
      esimQrCode: o.esimQrCode,
      createdAt: o.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// Manual recovery for an order whose automatic fulfillment failed. It shares
// fulfillOrder() with the payment flow so a top-up stays a top-up: this route
// used to call createEsimOrder() unconditionally, which for a top-up order
// bought a second SIM and overwrote the ICCID of the one the customer had
// already installed.
router.post("/admin/orders/:id/provision", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid order id" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    // `completed` used to be allowed here, which let a second press buy another
    // eSIM and orphan the first. Only an order still awaiting fulfillment is
    // eligible; the admin UI already offers the button on exactly those.
    if (order.status !== "paid") {
      res.status(400).json({
        error: "bad_request",
        message: order.status === "completed"
          ? "Order is already fulfilled — re-provisioning would buy a second eSIM"
          : "Only a paid order can be provisioned",
      });
      return;
    }

    console.log(`[Admin] Manual fulfillment for order #${id}, package: ${order.packageId}`);
    const result = await runFulfillment(order);

    // The retry sweeper may have picked the order up between the read above and
    // the claim. Saying so beats reporting a failure for work that is underway.
    if (result === null) {
      res.status(409).json({
        error: "already_in_progress",
        message: "Автомат дахин оролдлого энэ захиалгыг аль хэдийн авсан байна — хэсэг хүлээгээд сэргээнэ үү",
      });
      return;
    }

    res.json({
      success: true,
      iccid: result.iccid,
      qrCodeUrl: result.qrCodeUrl,
      topup: result.topup,
    });
  } catch (err: any) {
    // fulfillOrder leaves the status alone on failure, so the order stays at
    // `paid` and the button remains available for another attempt.
    console.error(`[Admin] Provision failed for order #${req.params.id}:`, err);
    res.status(500).json({ error: "provision_failed", message: err.message || "Airalo provision failed" });
  }
});

router.delete("/admin/orders/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, Number(id))).limit(1);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    if (order.status !== "pending") {
      res.status(400).json({ error: "bad_request", message: "Only pending orders can be deleted" });
      return;
    }
    await db.delete(ordersTable).where(and(eq(ordersTable.id, Number(id)), eq(ordersTable.status, "pending")));
    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

router.get("/orders/:id/usage", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
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
    const authorized = Boolean(user?.email && user.email === order.customerEmail);
    if (!authorized) {
      res.status(401).json({ error: "unauthorized", message: "Not allowed to view this order" });
      return;
    }
    if (!order.esimIccid) {
      res.status(400).json({ error: "bad_request", message: "Order has no eSIM yet" });
      return;
    }

    const usage = await getSimUsage(order.esimIccid);
    res.json(usage);
  } catch (err) {
    console.error(`[Usage] Failed for order #${req.params.id}:`, err);
    res.status(502).json({ error: "usage_failed", message: "Could not fetch usage from Airalo" });
  }
});

router.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid order id" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }

    // Orders are only visible to whoever holds the QPay invoice id from
    // checkout, or the signed-in owner of the order.
    const invoiceToken = req.query.invoice as string | undefined;
    let authorized = Boolean(invoiceToken && order.qpayInvoiceId && invoiceToken === order.qpayInvoiceId);
    if (!authorized) {
      const user = await verifyUserToken(req.headers.authorization);
      authorized = Boolean(user?.email && user.email === order.customerEmail);
    }
    if (!authorized) {
      res.status(401).json({ error: "unauthorized", message: "Not allowed to view this order" });
      return;
    }

    res.json({
      id: String(order.id),
      packageId: order.packageId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      currency: order.currency,
      qpayInvoiceId: order.qpayInvoiceId,
      qpayQrImage: order.qpayQrImage,
      qpayDeepLinks: order.qpayDeepLinks ? JSON.parse(order.qpayDeepLinks) : [],
      esimIccid: order.esimIccid,
      esimQrCode: order.esimQrCode,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

export default router;
