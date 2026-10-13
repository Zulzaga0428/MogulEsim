import type { Request, Response } from "express";

// Admin endpoints are disabled entirely unless ADMIN_SECRET is configured —
// there is deliberately no default key.
export function requireAdmin(req: Request, res: Response): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(503).json({ error: "admin_disabled", message: "ADMIN_SECRET is not configured on the server" });
    return false;
  }
  if (req.headers["x-admin-key"] !== secret) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
