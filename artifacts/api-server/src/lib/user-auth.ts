import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";

/*
 * Customer accounts live in our own database: phone number + password, no
 * Google, no SMS. Firebase was a Google service, blocked in China, and gave
 * us no way to reset a forgotten password — both matter for people who are
 * abroad when they need their QR code.
 *
 * The phone number is only a username. An account's identity everywhere
 * else (orders.customer_email) is the synthetic address phoneEmail() builds,
 * which is what the Firebase accounts used, so orders need no migration.
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LEN = 64;
const TOKEN_TTL = "90d";

export const PHONE_EMAIL_DOMAIN = "phone.avaesim.store";

/** "+976 9911-2233" -> "99112233"; null for anything but a Mongolian 8-digit number. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  return /^\d{8}$/.test(digits) ? digits : null;
}

export function phoneEmail(phone: string): string {
  return `${phone}@${PHONE_EMAIL_DOMAIN}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** No default: without JWT_SECRET nobody can sign in, rather than everyone sharing a guessable key. */
function secret(): string | null {
  const s = process.env.JWT_SECRET;
  return s && s.length >= 32 ? s : null;
}

export function authConfigured(): boolean {
  return secret() !== null;
}

export function signUserToken(user: { id: number; email: string }): string {
  const s = secret();
  if (!s) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ email: user.email }, s, { subject: String(user.id), expiresIn: TOKEN_TTL, algorithm: "HS256" });
}

export interface AuthUser {
  uid: string;
  email: string;
}

/** The signed-in customer behind an `Authorization: Bearer` header, or null. */
export async function verifyUserToken(authHeader: string | undefined): Promise<AuthUser | null> {
  const s = secret();
  if (!s || !authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(authHeader.slice(7), s, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { uid: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/*
 * Password guessing limits, in memory: per address and per phone number, so
 * neither one attacker nor many can hammer a single account. A restart
 * forgives everyone, which is acceptable for a brake on guessing.
 */
const WINDOW_MS = 15 * 60 * 1000;
const hits = new Map<string, number[]>();

export function tooManyAttempts(key: string, limit: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 50_000) hits.clear();
  return false;
}

export function clientAddress(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}
