import { Router } from "express";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";

const router = Router();

// GET /api/service-pricing
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT plan, mrp, offer FROM service_settings`);
    // Return as { elevation: { mrp, offer }, ... }
    const result = {};
    for (const row of rows) {
      result[row.plan] = { mrp: Number(row.mrp), offer: Number(row.offer) };
    }
    logger.info("✅ Service pricing fetched");
    res.json(result);
  } catch (err) {
    logger.error("GET /service-pricing failed", { error: err.message });
    res.status(500).json({ error: "Failed to fetch service pricing" });
  }
});

// PUT /api/service-pricing
// Body: { elevation: { mrp, offer }, floorplan: { mrp, offer }, interior: { mrp, offer } }
router.put("/", async (req, res) => {
  const plans = ["elevation", "floorplan", "interior"];
  const body = req.body;

  for (const plan of plans) {
    if (!body[plan]) return res.status(400).json({ error: `Missing plan: ${plan}` });
    const { mrp, offer } = body[plan];
    if (!mrp || !offer || mrp <= 0 || offer <= 0)
      return res.status(400).json({ error: `${plan}: prices must be > 0` });
    if (offer > mrp)
      return res.status(400).json({ error: `${plan}: offer cannot exceed MRP` });
  }

  try {
    for (const plan of plans) {
      const { mrp, offer } = body[plan];
      await db.query(
        `UPDATE service_settings SET mrp = ?, offer = ? WHERE plan = ?`,
        [mrp, offer, plan]
      );
    }
    logger.info("✅ Service pricing updated");
    res.json({ message: "Service pricing updated" });
  } catch (err) {
    logger.error("PUT /service-pricing failed", { error: err.message });
    res.status(500).json({ error: "Failed to update service pricing" });
  }
});

export default router;