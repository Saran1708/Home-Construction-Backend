import { Router } from "express";
import crypto from "crypto";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";

const router = Router();

// In-memory token store: token -> { email, expiresAt }
const tokens = new Map();

// Clean up expired tokens every 15 min
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (data.expiresAt < now) tokens.delete(token);
  }
}, 15 * 60 * 1000);

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, email FROM admin_users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (!rows.length) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    tokens.set(token, { email: rows[0].email, expiresAt });

    logger.info(`Admin login: ${email}`);
    res.json({ token, expiresAt, email: rows[0].email });
  } catch (err) {
    logger.error("POST /auth/login failed", { error: err.message });
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/verify
router.post("/verify", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token required" });

  const data = tokens.get(token);
  if (!data) return res.status(401).json({ error: "Invalid token" });
  if (data.expiresAt < Date.now()) {
    tokens.delete(token);
    return res.status(401).json({ error: "Token expired" });
  }

  res.json({ valid: true, email: data.email, expiresAt: data.expiresAt });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const { token } = req.body;
  if (token) tokens.delete(token);
  res.json({ ok: true });
});

export { tokens }; // exported so middleware can use it
export default router;