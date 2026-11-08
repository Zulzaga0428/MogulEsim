import QRCode from "qrcode";

/**
 * eSimerge — second eSIM supplier, used for unlimited plans where it covers
 * more than Airalo does (China: Unicom + Telecom, Hong Kong and Macau, apps
 * reachable without a VPN).
 *
 * Our package ids for its plans carry an "esm:" prefix so pricing and
 * fulfillment can tell the supplier from the id alone. Live plan ids are
 * UUIDs and sandbox ids look like "esm_plan_…", so neither can be used as a
 * marker by itself.
 *
 * Nothing here runs unless ESIMERGE_API_KEY is set. The sandbox catalog holds
 * only demo plans (no China), so a sandbox key lists nothing and every
 * country keeps its Airalo packages.
 */

const BASE_URL = "https://portal.esimerge.com/api/public/v1";
export const ESM_PREFIX = "esm:";

// Countries whose unlimited packages come from eSimerge instead of Airalo:
// our country slug -> eSimerge country code.
export const ESIMERGE_UNLIMITED: Record<string, string> = {
  china: "CN",
};

export interface EsimergePlan {
  id: string;
  name: string;
  scope: string;
  type: string;
  country_code: string | null;
  destination_code?: string | null;
  data_mb: number | null;
  validity_days: number;
  price_usd: number;
  fair_usage: string | null;
  supports_topup?: boolean;
  networks?: string[];
}

export interface EsimergeEsim {
  id: string;
  iccid: string;
  qr_code: string;
  ios_install_url?: string;
  android_install_url?: string;
}

export function isEsimergePackage(packageId: string): boolean {
  return packageId.startsWith(ESM_PREFIX);
}

function apiKey(): string | null {
  return process.env.ESIMERGE_API_KEY?.trim() || null;
}

export function esimergeEnabled(): boolean {
  return apiKey() !== null;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("ESIMERGE_API_KEY is not set");
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, Accept: "application/json" };
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    // Required on every POST. A stable key per order means a retry after a
    // timeout recovers the first eSIM instead of buying a second one.
    headers["Idempotency-Key"] = idempotencyKey!;
  }
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`eSimerge ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

// Unlimited plans per eSimerge country code, cached like the Airalo index.
const CATALOG_TTL_MS = 2 * 60 * 60 * 1000;
const catalog = new Map<string, { plans: EsimergePlan[]; at: number }>();
const inFlight = new Map<string, Promise<EsimergePlan[]>>();

async function fetchUnlimited(countryCode: string): Promise<EsimergePlan[]> {
  const all: EsimergePlan[] = [];
  // Filters are sent but not trusted (the sandbox ignores them), so the result
  // is filtered again below and pagination is followed to the end.
  for (let page = 1; page <= 30; page++) {
    const r = await call<{ data: EsimergePlan[]; meta?: { last_page?: number } }>(
      "GET",
      `/catalog?scope=country&country=${countryCode}&type=unlimited&page=${page}&per_page=1000`,
    );
    all.push(...(r.data || []));
    if (!r.meta?.last_page || page >= r.meta.last_page) break;
  }

  const eligible = all.filter((p) =>
    p.scope === "country" &&
    p.type === "unlimited" &&
    (p.country_code === countryCode || p.destination_code === countryCode) &&
    // A plan with a fair-usage cap is not what we sell as unlimited.
    !p.fair_usage &&
    p.validity_days >= 1 && p.validity_days <= 30 &&
    p.price_usd > 0,
  );

  // One plan per length. The main destination (e.g. "CN") wins over variants
  // such as "China Alt"; among equals the cheapest wins.
  const byDays = new Map<number, EsimergePlan>();
  for (const p of eligible) {
    const cur = byDays.get(p.validity_days);
    const main = (x: EsimergePlan) => (x.destination_code ?? x.country_code) === countryCode;
    if (!cur || (main(p) && !main(cur)) || (main(p) === main(cur) && p.price_usd < cur.price_usd)) {
      byDays.set(p.validity_days, p);
    }
  }
  return [...byDays.values()].sort((a, b) => a.validity_days - b.validity_days);
}

export async function getUnlimitedPlans(countryCode: string): Promise<EsimergePlan[]> {
  if (!esimergeEnabled()) return [];
  const hit = catalog.get(countryCode);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) return hit.plans;
  let p = inFlight.get(countryCode);
  if (!p) {
    p = fetchUnlimited(countryCode)
      .then((plans) => {
        catalog.set(countryCode, { plans, at: Date.now() });
        return plans;
      })
      .finally(() => inFlight.delete(countryCode));
    inFlight.set(countryCode, p);
  }
  return p;
}

/** The plan behind one of our "esm:" package ids, or null if it is not sold. */
export async function findEsimergePlan(packageId: string): Promise<{ plan: EsimergePlan; slug: string } | null> {
  if (!isEsimergePackage(packageId)) return null;
  const planId = packageId.slice(ESM_PREFIX.length);
  for (const [slug, code] of Object.entries(ESIMERGE_UNLIMITED)) {
    const plan = (await getUnlimitedPlans(code)).find((p) => p.id === planId);
    if (plan) return { plan, slug };
  }
  return null;
}

/** Issue one eSIM. `idempotencyKey` must stay the same across retries of one order. */
export async function issueEsim(packageId: string, idempotencyKey: string, reference: string): Promise<EsimergeEsim> {
  const order = await call<{ id: string; status: string; esim?: EsimergeEsim }>(
    "POST",
    "/orders",
    { plan_id: packageId.slice(ESM_PREFIX.length), customer_reference: reference },
    idempotencyKey,
  );
  if (!order.esim?.iccid || !order.esim.qr_code) {
    throw new Error(`eSimerge order ${order.id} (${order.status}) returned no eSIM`);
  }
  return order.esim;
}

/**
 * eSimerge returns the activation string ("LPA:1$…"), not an image. Every page
 * shows esimQrCode with <img src>, so it is stored as a PNG data URL, rendered
 * here rather than by a third-party QR service that would see the code.
 */
export function qrDataUrl(lpa: string): Promise<string> {
  return QRCode.toDataURL(lpa, { errorCorrectionLevel: "M", margin: 2, width: 400 });
}
