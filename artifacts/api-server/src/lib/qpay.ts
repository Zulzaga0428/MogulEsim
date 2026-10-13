import { BRAND } from "../brand.js";
interface QPayToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_deeplink: Array<{ name: string; description: string; logo: string; link: string }>;
  urls?: Array<{ name: string; description: string; logo: string; link: string }>;
}

interface QPayCheckResponse {
  count: number;
  paid_amount: number;
  rows: Array<{ payment_status: string; payment_id: string }>;
}

let cachedToken: QPayToken | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 55 * 60 * 1000;

const BASE_URL = process.env.QPAY_BASE_URL || "https://merchant.qpay.mn/v2";

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now - tokenFetchedAt < TOKEN_TTL_MS) {
    return cachedToken.access_token;
  }

  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;

  if (!username || !password) {
    throw new Error("QPAY_USERNAME and QPAY_PASSWORD environment variables are required");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    cachedToken = null;
    throw new Error(`QPay auth failed (${response.status}): ${text}`);
  }

  cachedToken = (await response.json()) as QPayToken;
  tokenFetchedAt = now;
  console.log("[QPay] Access token refreshed");
  return cachedToken.access_token;
}

export async function createInvoice(
  amount: number,
  senderInvoiceNo: string,
  description: string,
  callbackUrl: string
): Promise<QPayInvoiceResponse> {
  const token = await getAccessToken();
  const invoiceCode = process.env.QPAY_INVOICE_CODE;

  if (!invoiceCode) {
    throw new Error("QPAY_INVOICE_CODE environment variable is required");
  }

  const body = {
    invoice_code: invoiceCode,
    sender_invoice_no: senderInvoiceNo,
    invoice_receiver_code: "terminal",
    invoice_description: description,
    sender_branch_code: BRAND.qpayBranchCode,
    amount,
    callback_url: callbackUrl,
  };

  const response = await fetch(`${BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QPay invoice create failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<QPayInvoiceResponse>;
}

export async function checkPayment(invoiceId: string): Promise<{ paid: boolean; count: number }> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`QPay payment check failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as QPayCheckResponse;
  const paid = data.count > 0 && data.rows.some((r) => r.payment_status === "PAID");
  return { paid, count: data.count };
}
