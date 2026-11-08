import QRCode from "qrcode";

/**
 * eSimerge — this shop's eSIM supplier (2026-11-08: Zulzaga chose it over
 * Airalo for every country). It sells unlimited plans of every length from
 * 1 to 30 days, and in China covers Unicom + Telecom, Hong Kong and Macau
 * with apps reachable without a VPN.
 *
 * Our package ids for its plans carry an "esm:" prefix so pricing and
 * fulfillment can tell the supplier from the id alone. Live plan ids are
 * UUIDs and sandbox ids look like "esm_plan_…", so neither can be used as a
 * marker by itself.
 *
 * The catalog is used only with a live key. The sandbox catalog is eight demo
 * plans (Saudi Arabia, Egypt) whose orders return fake eSIMs, so listing them
 * would sell a customer a QR code that installs nothing. Until the key is
 * live, countries keep the Airalo packages they had.
 */

const BASE_URL = "https://portal.esimerge.com/api/public/v1";
export const ESM_PREFIX = "esm:";

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

/** True when the key is a live one; the sandbox catalog must never be sold. */
export function esimergeLive(): boolean {
  const key = apiKey();
  return key !== null && !key.startsWith("esm_sk_test_");
}

// Whole catalog, country plans only, grouped by ISO code and cached like the
// Airalo index. About 15 pages of 1000 against a 100/min limit.
const CATALOG_TTL_MS = 2 * 60 * 60 * 1000;
interface Catalog { byCountry: Map<string, EsimergePlan[]>; byId: Map<string, EsimergePlan>; at: number }
let catalog: Catalog | null = null;
let inFlight: Promise<Catalog> | null = null;

async function fetchCatalog(): Promise<Catalog> {
  const all: EsimergePlan[] = [];
  for (let page = 1; page <= 40; page++) {
    const r = await call<{ data: EsimergePlan[]; meta?: { last_page?: number } }>(
      "GET",
      `/catalog?scope=country&page=${page}&per_page=1000`,
    );
    all.push(...(r.data || []));
    if (!r.meta?.last_page || page >= r.meta.last_page) break;
  }

  // Group by the country a plan is sold for. A destination such as
  // "China Alt" reports the same country_code as "China"; its plans compete
  // for the same slot below.
  const grouped = new Map<string, EsimergePlan[]>();
  for (const p of all) {
    if (p.scope !== "country" || !p.country_code || !(p.price_usd > 0)) continue;
    if (p.validity_days < 1 || p.validity_days > 30) continue;
    // A plan with a fair-usage cap is not what we sell as unlimited.
    if (p.type === "unlimited" && p.fair_usage) continue;
    if (p.type !== "unlimited" && !(p.data_mb && p.data_mb > 0)) continue;
    const list = grouped.get(p.country_code) ?? [];
    list.push(p);
    grouped.set(p.country_code, list);
  }

  // One plan per (length, data) slot: the main destination wins over
  // variants, the cheapest wins among equals.
  const byCountry = new Map<string, EsimergePlan[]>();
  const byId = new Map<string, EsimergePlan>();
  for (const [code, plans] of grouped) {
    const main = (x: EsimergePlan) => (x.destination_code ?? x.country_code) === code;
    const slots = new Map<string, EsimergePlan>();
    for (const p of plans) {
      const slot = `${p.validity_days}:${p.type === "unlimited" ? "u" : p.data_mb}`;
      const cur = slots.get(slot);
      if (!cur || (main(p) && !main(cur)) || (main(p) === main(cur) && p.price_usd < cur.price_usd)) {
        slots.set(slot, p);
      }
    }
    const chosen = [...slots.values()];
    byCountry.set(code, chosen);
    for (const p of chosen) byId.set(p.id, p);
  }
  return { byCountry, byId, at: Date.now() };
}

async function getCatalog(): Promise<Catalog> {
  if (catalog && Date.now() - catalog.at < CATALOG_TTL_MS) return catalog;
  if (!inFlight) {
    inFlight = fetchCatalog()
      .then((c) => (catalog = c))
      .finally(() => { inFlight = null; });
  }
  try {
    return await inFlight;
  } catch (err) {
    // Serve the last good catalog through an outage rather than going empty.
    if (catalog) return catalog;
    throw err;
  }
}

/** Plans eSimerge sells for an ISO country code; empty without a live key. */
/**
 * ISO code -> number of unlimited plans, for every country eSimerge covers.
 * Drives the destination list now that Airalo is gone; null without a live
 * key or when the catalog cannot be fetched.
 */
export async function getCoveredCountries(): Promise<Map<string, number> | null> {
  if (!esimergeLive()) return null;
  try {
    const { byCountry } = await getCatalog();
    const out = new Map<string, number>();
    for (const [code, plans] of byCountry) {
      const n = plans.filter((p) => p.type === "unlimited").length;
      if (n > 0) out.set(code, n);
    }
    return out;
  } catch (err) {
    console.error("[eSimerge] Catalog unavailable for the destination list:", err);
    return null;
  }
}

export async function getCountryPlans(countryCode: string): Promise<EsimergePlan[]> {
  if (!esimergeLive()) return [];
  return (await getCatalog()).byCountry.get(countryCode) ?? [];
}

/** The plan behind one of our "esm:" package ids, or null if it is not sold. */
export async function findEsimergePlan(packageId: string): Promise<EsimergePlan | null> {
  if (!isEsimergePackage(packageId) || !esimergeLive()) return null;
  return (await getCatalog()).byId.get(packageId.slice(ESM_PREFIX.length)) ?? null;
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
