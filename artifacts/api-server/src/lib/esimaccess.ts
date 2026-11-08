import crypto from "node:crypto";

/**
 * eSIM Access — supplier for fixed-GB plans and daily-limit plans
 * (2026-11-08: unlimited comes from eSimerge, everything with a data cap from
 * here). There is no sandbox: every order is real and paid from the prepaid
 * balance.
 *
 * Our package ids:
 *   esa:<packageCode>          fixed plan (e.g. China 5GB 30 days)
 *   esa:<packageCode>:<days>   daily plan bought for <days> days (periodNum)
 *   esa-topup:<packageCode>    top-up for an eSIM we already issued
 *
 * Orders are asynchronous: esim/order returns an orderNo, and the eSIM shows
 * up on esim/query within ~30 s.
 */

const BASE_URL = "https://api.esimaccess.com/api/v1/open/";
export const ESA_PREFIX = "esa:";
export const ESA_TOPUP_PREFIX = "esa-topup:";
const USD_TO_MNT = 3450;

// Daily plans are sold for these lengths.
export const DAILY_DAYS = [1, 3, 5, 7, 10, 15, 20, 30];

export interface EsaPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number; // USD × 10000; for a daily plan, the price of one day
  volume: number; // bytes (per day for a daily plan)
  dataType: number; // 1 fixed, 2 daily
  duration: number;
  durationUnit: string;
  location: string; // comma-separated ISO codes
  fupPolicy?: string;
  supportTopUpType?: number; // 1 = no top-up
  speed?: string;
}

export interface EsaEsim {
  iccid: string;
  qrCodeUrl: string;
  ac: string;
  esimTranNo?: string;
  totalVolume?: number;
  orderUsage?: number;
  expiredTime?: string | null;
  esimStatus?: string;
  smdpStatus?: string;
}

export function esaEnabled(): boolean {
  return Boolean(process.env.ESIMACCESS_ACCESS_CODE && process.env.ESIMACCESS_SECRET_KEY);
}

export function isEsaPackage(id: string): boolean {
  return id.startsWith(ESA_PREFIX) || id.startsWith(ESA_TOPUP_PREFIX);
}

/** "esa:CODE" → {code, days:null}; "esa:CODE:7" → {code, days:7}. */
export function parseEsaId(id: string): { code: string; days: number | null } | null {
  if (!id.startsWith(ESA_PREFIX)) return null;
  const [code, d] = id.slice(ESA_PREFIX.length).split(":");
  if (!code) return null;
  if (d === undefined) return { code, days: null };
  const days = Number(d);
  return Number.isInteger(days) && DAILY_DAYS.includes(days) ? { code, days } : null;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const accessCode = process.env.ESIMACCESS_ACCESS_CODE;
  const secret = process.env.ESIMACCESS_SECRET_KEY;
  if (!accessCode || !secret) throw new Error("ESIMACCESS_ACCESS_CODE / ESIMACCESS_SECRET_KEY are not set");
  const ts = String(Date.now());
  const rid = crypto.randomUUID();
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", secret).update(ts + rid + accessCode + raw).digest("hex");
  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "RT-AccessCode": accessCode,
      "RT-RequestID": rid,
      "RT-Timestamp": ts,
      "RT-Signature": sig,
    },
    body: raw,
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json()) as { success: boolean; errorCode?: string | null; errorMsg?: string | null; obj: T };
  if (!json.success) {
    const err = new Error(`eSIM Access ${path}: ${json.errorCode} ${json.errorMsg}`) as Error & { code?: string };
    err.code = json.errorCode ?? undefined;
    throw err;
  }
  return json.obj;
}

// ── Catalog ────────────────────────────────────────────────────────────────

const CATALOG_TTL_MS = 2 * 60 * 60 * 1000;
const byCountry = new Map<string, { fixed: EsaPackage[]; daily: EsaPackage[]; at: number }>();
const inFlight = new Map<string, Promise<{ fixed: EsaPackage[]; daily: EsaPackage[]; at: number }>>();
const byCode = new Map<string, EsaPackage>();

// A plan belongs on a country's page when it covers that country and at most
// two neighbours (e.g. China + Hong Kong + Macau). Regional and global plans
// cost several times more and would bury the country's own plans.
function coversCountry(p: EsaPackage, cc: string): boolean {
  const locs = p.location.split(",").map((s) => s.trim());
  return locs.includes(cc) && locs.length <= 3;
}

const GB = 1024 * 1024 * 1024;

/**
 * One plan per slot (same length and data). The catalog repeats a slot under
 * several names — "China 1GB 7Days", "China 1GB 7Days (nonhkip)", "China
 * (mainland HK Macao) 1GB 7Days" — and listing all of them buries the
 * choice. The country's own plan wins, then the one covering fewest places,
 * then the cheapest.
 */
function pickOnePerSlot(list: EsaPackage[], cc: string, slot: (p: EsaPackage) => string): EsaPackage[] {
  // "nonhkip" plans exit through a mainland IP: in China, Google, WhatsApp
  // and Instagram do not open on them. Take one only when nothing else fills
  // the slot.
  const rank = (p: EsaPackage) => [
    /nonhkip/i.test(p.name) ? 1 : 0,
    p.location.trim() === cc ? 0 : 1,
    p.location.split(",").length,
    p.price,
  ];
  const better = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  const best = new Map<string, EsaPackage>();
  for (const p of list) {
    const k = slot(p);
    const cur = best.get(k);
    if (!cur || better(rank(p), rank(cur))) best.set(k, p);
  }
  return [...best.values()];
}

async function fetchCountry(cc: string) {
  const [fixedRes, dailyRes] = await Promise.all([
    call<{ packageList: EsaPackage[] }>("package/list", { locationCode: cc, type: "", dataType: 1 }),
    call<{ packageList: EsaPackage[] }>("package/list", { locationCode: cc, type: "", dataType: 2 }),
  ]);
  const usable = (p: EsaPackage) =>
    coversCountry(p, cc) && p.price > 0 &&
    // Under 1 GB is not worth a trip; every such plan also lands on the
    // 5,000 minimum price, so they would all look the same.
    p.volume >= GB &&
    // "Unlimited" plans here are not what this shop sells as unlimited
    // (that comes from eSimerge); keep them off the fixed-data tab.
    !/unlimited/i.test(p.name);
  const fixed = pickOnePerSlot((fixedRes.packageList || []).filter(usable), cc, (p) => `${p.duration}:${p.volume}`);
  const daily = pickOnePerSlot((dailyRes.packageList || []).filter(usable), cc, (p) => `${p.volume}`);
  for (const p of [...fixed, ...daily]) byCode.set(p.packageCode, p);
  return { fixed, daily, at: Date.now() };
}

export async function getCountryEsaPackages(cc: string): Promise<{ fixed: EsaPackage[]; daily: EsaPackage[] }> {
  if (!esaEnabled()) return { fixed: [], daily: [] };
  const hit = byCountry.get(cc);
  if (hit && Date.now() - hit.at < CATALOG_TTL_MS) return hit;
  let p = inFlight.get(cc);
  if (!p) {
    p = fetchCountry(cc)
      .then((c) => {
        byCountry.set(cc, c);
        return c;
      })
      .finally(() => inFlight.delete(cc));
    inFlight.set(cc, p);
  }
  try {
    return await p;
  } catch (err) {
    if (hit) return hit; // serve stale through an outage
    throw err;
  }
}

/** Look a package up by code: from the cache, else straight from the API. */
export async function findEsaPackage(code: string): Promise<EsaPackage | null> {
  const cached = byCode.get(code);
  if (cached) return cached;
  const r = await call<{ packageList: EsaPackage[] }>("package/list", { locationCode: "", type: "", packageCode: code });
  const p = (r.packageList || []).find((x) => x.packageCode === code) ?? null;
  if (p) byCode.set(code, p);
  return p;
}

// ── Pricing ────────────────────────────────────────────────────────────────

// Fixed GB: 2× cost, never below 5,000 so the smallest plans still pay for the
// QPay fee and support. Daily: 1.6× cost — they sit between fixed and
// unlimited and must stay clearly cheaper than unlimited for the same length.
const FIXED_MARKUP = 2.0;
const DAILY_MARKUP = 1.6;
const MIN_PRICE = 5000;

const round500 = (n: number) => Math.round(n / 500) * 500;

/** Wholesale cost in USD for one purchase of this plan (days for a daily plan). */
export function esaCostUsd(p: EsaPackage, days: number | null): number {
  return (p.price / 10000) * (p.dataType === 2 ? days ?? 1 : 1);
}

export function esaPriceInMnt(p: EsaPackage, days: number | null): number {
  const markup = p.dataType === 2 ? DAILY_MARKUP : FIXED_MARKUP;
  return Math.max(MIN_PRICE, round500(esaCostUsd(p, days) * USD_TO_MNT * markup));
}

export function gbLabel(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  const gb = mb / 1024;
  return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
}

// ── Orders ─────────────────────────────────────────────────────────────────

/** Place the order; returns eSIM Access's orderNo. */
export async function placeEsaOrder(p: EsaPackage, days: number | null, transactionId: string): Promise<string> {
  const item: Record<string, unknown> = { packageCode: p.packageCode, count: 1, price: p.price };
  if (p.dataType === 2) item.periodNum = days ?? 1;
  const amount = p.price * (p.dataType === 2 ? days ?? 1 : 1);
  const obj = await call<{ orderNo: string }>("esim/order", { transactionId, amount, packageInfoList: [item] });
  if (!obj?.orderNo) throw new Error("eSIM Access returned no orderNo");
  return obj.orderNo;
}

/**
 * Wait for the eSIM of an order. Profiles are allocated asynchronously;
 * error 200010 means "not ready yet". Gives up after ~60 s and throws, and the
 * caller keeps the orderNo so the next attempt resumes instead of re-ordering.
 */
export async function waitForEsaEsim(orderNo: string, timeoutMs = 60_000): Promise<EsaEsim> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const obj = await call<{ esimList: EsaEsim[] }>("esim/query", { orderNo, iccid: "", pager: { pageNum: 1, pageSize: 10 } });
      const sim = obj?.esimList?.[0];
      if (sim?.iccid && (sim.qrCodeUrl || sim.ac)) return sim;
    } catch (err) {
      if ((err as { code?: string }).code !== "200010") throw err;
    }
    if (Date.now() > deadline) throw new Error(`eSIM Access order ${orderNo} not ready after ${timeoutMs / 1000}s`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export async function getEsaEsimByIccid(iccid: string): Promise<EsaEsim | null> {
  const obj = await call<{ esimList: EsaEsim[] }>("esim/query", { orderNo: "", iccid, pager: { pageNum: 1, pageSize: 10 } });
  return obj?.esimList?.[0] ?? null;
}

// ── Top-up ─────────────────────────────────────────────────────────────────

export async function getEsaTopups(iccid: string): Promise<EsaPackage[]> {
  const r = await call<{ packageList: EsaPackage[] }>("package/list", { locationCode: "", type: "TOPUP", iccid });
  const list = (r.packageList || []).filter((p) => p.price > 0);
  for (const p of list) byCode.set(p.packageCode, p);
  return list;
}

export async function esaTopup(iccid: string, packageCode: string, transactionId: string): Promise<void> {
  await call("esim/topup", { esimTranNo: "", iccid, packageCode, transactionId });
}
