import { Router } from "express";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";

const router = Router();

// GET /api/pricing  — fetch current prices
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT original_price, discount_price, updated_at FROM settings WHERE id = 1");
    if (!rows.length) {
      logger.warn("No pricing row found in settings table");
      return res.status(404).json({ error: "Pricing not configured" });
    }
    logger.info("Pricing fetched", { data: rows[0] });
    res.json(rows[0]);
  } catch (err) {
    logger.error("GET /pricing failed", { error: err.message });
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
});

// PUT /api/pricing  — update prices (admin only)
router.put("/", async (req, res) => {
  const { original_price, discount_price } = req.body;

  if (!original_price || !discount_price) {
    return res.status(400).json({ error: "original_price and discount_price are required" });
  }
  if (original_price <= 0 || discount_price <= 0) {
    return res.status(400).json({ error: "Prices must be greater than 0" });
  }
  if (discount_price > original_price) {
    return res.status(400).json({ error: "Discount price cannot exceed original price" });
  }

  try {
    await db.query(
      `INSERT INTO settings (id, original_price, discount_price)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE original_price = VALUES(original_price), discount_price = VALUES(discount_price)`,
      [original_price, discount_price]
    );
    logger.info("Pricing updated", { original_price, discount_price });
    res.json({ message: "Pricing updated successfully", original_price, discount_price });
  } catch (err) {
    logger.error("PUT /pricing failed", { error: err.message });
    res.status(500).json({ error: "Failed to update pricing" });
  }
});

export default router;
