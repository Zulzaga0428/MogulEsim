// Brand strings the API puts in front of customers and suppliers: QPay
// invoices (shown in the customer's bank app), Airalo order notes (how this
// shop's orders are told apart in a shared Airalo account) and the support
// chat. The values live in the repo-root brand.json, shared with the
// storefront; change them there, never here.
import brand from "../../../brand.json";

export const BRAND = {
  name: brand.name,
  invoicePrefix: brand.invoicePrefix,
  qpayBranchCode: brand.qpayBranchCode,
} as const;
