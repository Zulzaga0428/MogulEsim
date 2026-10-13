import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  packageId: text("package_id").notNull(),
  countrySlug: text("country_slug").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("pending"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MNT"),
  qpayInvoiceId: text("qpay_invoice_id"),
  qpayQrImage: text("qpay_qr_image"),
  qpayDeepLinks: text("qpay_deep_links"),
  esimIccid: text("esim_iccid"),
  esimQrCode: text("esim_qr_code"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
