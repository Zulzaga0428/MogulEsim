import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/admin.js";
import {
  authConfigured, checkPassword, clientAddress, hashPassword, normalizePhone,
  phoneEmail, signUserToken, tooManyAttempts, verifyUserToken,
} from "../lib/user-auth.js";

const router: IRouter = Router();

const MIN_PASSWORD = 6;
const MAX_PASSWORD = 200;

function badPassword(pw: unknown): pw is never {
  return typeof pw !== "string" || pw.length < MIN_PASSWORD || pw.length > MAX_PASSWORD;
}

function disabled(res: Response): boolean {
  if (authConfigured()) return false;
  res.status(503).json({ error: "auth_disabled", message: "JWT_SECRET is not configured on the server" });
  return true;
}

/*
 * usersTable predates these routes: email holds the synthetic phone address,
 * password the scrypt hash, name the bare phone number.
 */
router.post("/auth/register", async (req: Request, res: Response) => {
  if (disabled(res)) return;
  const phone = normalizePhone(req.body?.phone);
  const password = req.body?.password;
  if (!phone) {
    res.status(400).json({ error: "bad_phone", message: "8 оронтой утасны дугаар оруулна уу" });
    return;
  }
  if (badPassword(password)) {
    res.status(400).json({ error: "bad_password", message: `Нууц үг ${MIN_PASSWORD}-аас дээш тэмдэгт байна` });
    return;
  }
  if (tooManyAttempts(`register:${clientAddress(req)}`, 10)) {
    res.status(429).json({ error: "too_many", message: "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу." });
    return;
  }

  const email = phoneEmail(phone);
  try {
    const [user] = await db.insert(usersTable)
      .values({ email, password: await hashPassword(password), name: phone })
      .onConflictDoNothing({ target: usersTable.email })
      .returning({ id: usersTable.id, email: usersTable.email });
    if (!user) {
      res.status(409).json({ error: "exists", message: "Энэ утасны дугаар аль хэдийн бүртгэлтэй" });
      return;
    }
    res.status(201).json({ token: signUserToken(user), user: { phone, email } });
  } catch (err) {
    console.error("[Auth] register failed:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  if (disabled(res)) return;
  const phone = normalizePhone(req.body?.phone);
  const password = req.body?.password;
  if (!phone || typeof password !== "string") {
    res.status(401).json({ error: "invalid_credentials", message: "Утас эсвэл нууц үг буруу байна" });
    return;
  }
  // Per address and per account, so neither one attacker nor a botnet can
  // grind through one customer's password.
  if (tooManyAttempts(`login-ip:${clientAddress(req)}`, 30) || tooManyAttempts(`login-phone:${phone}`, 10)) {
    res.status(429).json({ error: "too_many", message: "Хэт олон оролдлого. 15 минутын дараа дахин оролдоно уу." });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, phoneEmail(phone))).limit(1);
    if (!user || !(await checkPassword(password, user.password))) {
      res.status(401).json({ error: "invalid_credentials", message: "Утас эсвэл нууц үг буруу байна" });
      return;
    }
    res.json({ token: signUserToken(user), user: { phone, email: user.email } });
  } catch (err) {
    console.error("[Auth] login failed:", err);
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const user = await verifyUserToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({ email: user.email, phone: user.email.split("@")[0] });
});

/*
 * There is no email or SMS to reset a password with, so a customer who
 * forgets theirs asks us, and an admin sets a new one here.
 */
router.post("/admin/users/reset-password", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const phone = normalizePhone(req.body?.phone);
  const password = req.body?.password;
  if (!phone || badPassword(password)) {
    res.status(400).json({ error: "bad_request", message: `8 оронтой дугаар ба ${MIN_PASSWORD}+ тэмдэгттэй нууц үг хэрэгтэй` });
    return;
  }
  try {
    const updated = await db.update(usersTable)
      .set({ password: await hashPassword(password) })
      .where(eq(usersTable.email, phoneEmail(phone)))
      .returning({ id: usersTable.id });
    if (updated.length === 0) {
      res.status(404).json({ error: "not_found", message: "Ийм дугаартай бүртгэл алга" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[Auth] reset failed:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
