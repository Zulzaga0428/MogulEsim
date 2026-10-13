import { BRAND } from "../brand.js";
interface AiraloToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AiraloPackage {
  package_id: string;
  net_price: number;
  amount: number;
  day: number;
  data: string;
  title: string;
  is_unlimited: boolean;
  voice: number;
  text: number;
  rechargeable: boolean;
}

// Global index: ISO country_code → flat list of packages, built once and cached 2h
let packagesIndex: Map<string, AiraloPackage[]> | null = null;
let indexFetchedAt = 0;
const INDEX_TTL_MS = 2 * 60 * 60 * 1000;

interface AiraloOrderResponse {
  data: {
    id: number;
    code: string;
    currency: string;
    quantity: number;
    type: string;
    description: string;
    esim_type: string;
    validity: number;
    package_id: string;
    slug: string;
    created_at: string;
    sims: Array<{
      id: number;
      created_at: string;
      iccid: string;
      qrcode: string;
      qrcode_url: string;
      direct_apple_installation_url: string | null;
    }>;
  };
}

const BASE_URL = "https://partners-api.airalo.com/v2";

let cachedToken: AiraloToken | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

// Airalo rate-limits /token hard. A cold landing page asks for six countries
// at once, and each used to fetch its own token and its own index, which got
// the shop a 429 that every later request then renewed. Concurrent callers
// now share one in-flight request, and a refusal is not retried for a minute.
let tokenInFlight: Promise<string> | null = null;
let tokenRetryAt = 0;
const TOKEN_COOLDOWN_MS = 60 * 1000;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) {
    return cachedToken.access_token;
  }
  if (Date.now() < tokenRetryAt) {
    throw new Error("Airalo auth cooling down after a refused token request");
  }
  tokenInFlight ??= fetchAccessToken().finally(() => { tokenInFlight = null; });
  return tokenInFlight;
}

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();

  const clientId = process.env.AIRALO_CLIENT_ID;
  const clientSecret = process.env.AIRALO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("AIRALO_CLIENT_ID and AIRALO_CLIENT_SECRET environment variables are required");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    cachedToken = null;
    tokenRetryAt = Date.now() + TOKEN_COOLDOWN_MS;
    throw new Error(`Airalo auth failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  cachedToken = json.data ?? json;
  tokenFetchedAt = now;
  console.log("[Airalo] Access token refreshed");
  return cachedToken!.access_token;
}

async function buildPackagesIndex(): Promise<Map<string, AiraloPackage[]>> {
  const index = new Map<string, AiraloPackage[]>();
  let page = 1;
  const maxPages = 6;

  while (page <= maxPages) {
    const token = await getAccessToken();
    const url = `${BASE_URL}/packages?filter[type]=local&limit=100&page=${page}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Airalo packages index failed (${response.status}): ${text}`);
    }

    const json = await response.json();
    const destinations: Array<{
      country_code: string;
      operators: Array<{
        rechargeability?: boolean;
        packages: Array<{
          id: string; title: string; data: string;
          day: number; net_price: number; is_unlimited: boolean; amount: number;
          voice?: number | null; text?: number | null;
        }>;
      }>;
    }> = (json as any).data || [];

    if (destinations.length === 0) break;

    for (const dest of destinations) {
      const cc = dest.country_code;
      if (!cc) continue;
      if (!index.has(cc)) index.set(cc, []);
      for (const op of dest.operators || []) {
        for (const pkg of op.packages || []) {
          index.get(cc)!.push({
            package_id: pkg.id,
            title: pkg.title,
            data: pkg.data || (pkg.is_unlimited ? "Unlimited" : `${Math.round(pkg.amount / 1024)} GB`),
            day: pkg.day,
            net_price: pkg.net_price,
            is_unlimited: pkg.is_unlimited || pkg.amount === 0,
            amount: pkg.amount,
            voice: pkg.voice ?? 0,
            text: pkg.text ?? 0,
            rechargeable: Boolean(op.rechargeability),
          });
        }
      }
    }

    console.log(`[Airalo] Indexed page ${page}: ${destinations.length} destinations`);
    if (destinations.length < 100) break;
    page++;
  }

  console.log(`[Airalo] Index built: ${index.size} countries, pages fetched: ${page}`);
  return index;
}

let indexInFlight: Promise<Map<string, AiraloPackage[]>> | null = null;

/** The whole cached index, building it if needed. Keys are Airalo country codes.
 *  Concurrent callers share one build rather than each paging through Airalo. */
export async function getPackagesIndex(): Promise<Map<string, AiraloPackage[]>> {
  if (packagesIndex && Date.now() - indexFetchedAt <= INDEX_TTL_MS) return packagesIndex;
  indexInFlight ??= buildPackagesIndex()
    .then((index) => {
      packagesIndex = index;
      indexFetchedAt = Date.now();
      return index;
    })
    .finally(() => { indexInFlight = null; });
  return indexInFlight;
}

export async function getPackagesByCountry(countryCode: string): Promise<AiraloPackage[]> {
  const index = await getPackagesIndex();
  return index.get(countryCode) || [];
}

export async function findAiraloPackage(packageId: string): Promise<{ pkg: AiraloPackage; countryCode: string } | null> {
  const index = await getPackagesIndex();
  for (const [countryCode, packages] of index) {
    const hit = packages.find((p) => p.package_id === packageId);
    if (hit) return { pkg: hit, countryCode };
  }
  return null;
}

export async function createEsimOrder(
  packageId: string,
  quantity = 1,
  description?: string
): Promise<AiraloOrderResponse["data"]> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      quantity,
      package_id: packageId,
      type: "sim",
      description: description ?? `${BRAND.name} order for ${packageId}`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airalo order failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  return json.data;
}

export interface AiraloTopup {
  package_id: string;
  title: string;
  data: string;
  day: number;
  net_price: number;
  is_unlimited: boolean;
  amount: number;
}

export async function getSimTopups(iccid: string): Promise<AiraloTopup[]> {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/sims/${iccid}/topups`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airalo topups list failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  const list: any[] = json.data || [];
  return list.map((t) => ({
    package_id: t.id,
    title: t.title,
    data: t.data || (t.is_unlimited ? "Unlimited" : `${Math.round((t.amount ?? 0) / 1024)} GB`),
    day: t.day,
    // Fall back to the retail price if net_price is absent — overpricing is
    // safe, underpricing is not.
    net_price: Number(t.net_price ?? t.price ?? 0),
    is_unlimited: Boolean(t.is_unlimited || t.amount === 0),
    amount: t.amount ?? 0,
  }));
}

export async function createTopupOrder(
  packageId: string,
  iccid: string,
  description?: string
): Promise<unknown> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/orders/topups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      package_id: packageId,
      iccid,
      description: description ?? `${BRAND.name} topup for ${iccid}`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airalo topup order failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  return json.data;
}

export interface SimUsage {
  status: string;
  remaining: number;
  total: number;
  expired_at: string | null;
  is_unlimited: boolean;
  remaining_voice: number;
  remaining_text: number;
}

// Airalo rate-limits the usage endpoint, so cache results per ICCID briefly.
const usageCache = new Map<string, { data: SimUsage; fetchedAt: number }>();
const USAGE_TTL_MS = 5 * 60 * 1000;

export async function getSimUsage(iccid: string): Promise<SimUsage> {
  const cached = usageCache.get(iccid);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < USAGE_TTL_MS) return cached.data;

  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/sims/${iccid}/usage`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airalo usage failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  const d = json.data ?? {};
  const usage: SimUsage = {
    status: d.status ?? "unknown",
    remaining: Number(d.remaining ?? 0),
    total: Number(d.total ?? 0),
    expired_at: d.expired_at ?? null,
    is_unlimited: Boolean(d.is_unlimited),
    remaining_voice: Number(d.remaining_voice ?? 0),
    remaining_text: Number(d.remaining_text ?? 0),
  };
  usageCache.set(iccid, { data: usage, fetchedAt: now });
  return usage;
}

export async function getSimDetails(iccid: string): Promise<{
  iccid: string;
  qrcode: string;
  qrcode_url: string;
  status: string;
}> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/sims/${iccid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airalo getSimDetails failed (${response.status}): ${text}`);
  }

  const json = await response.json() as any;
  return json.data;
}
