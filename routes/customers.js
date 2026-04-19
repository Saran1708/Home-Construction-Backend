import { Router } from "express";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";

const router = Router();

// GET /api/customers
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name AS fullName, email, mobile, amount,
              created_at AS date, status, email_sent AS emailSent, order_id AS orderId
       FROM customers
       ORDER BY created_at DESC`
    );
    logger.info(`Fetched ${rows.length} customers`);
    res.json(rows);
  } catch (err) {
    logger.error("GET /customers failed", { error: err.message });
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

export default router;