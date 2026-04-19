import { Router } from "express";
import Razorpay from "razorpay";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";
import { sendEbookEmail } from "../utils/mailer.js";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

const getRazorpay = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

// POST /api/orders/create
router.post("/create", async (req, res) => {
  const { fullName, email, mobile } = req.body;

  if (!fullName || !email || !mobile) {
    return res.status(400).json({ error: "fullName, email, and mobile are required" });
  }

  try {
    const [pricing] = await db.query("SELECT discount_price FROM settings WHERE id = 1");
    if (!pricing.length) return res.status(500).json({ error: "Pricing not configured" });

    const amount = pricing[0].discount_price * 100;

    const rzpOrder = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { name: fullName, email, mobile },
    });

    logger.info("Razorpay order created", { orderId: rzpOrder.id, email });

    const [custResult] = await db.query(
      `INSERT INTO customers (full_name, email, mobile, amount, status, email_sent, order_id)
       VALUES (?, ?, ?, ?, 'Pending', 0, ?)`,
      [fullName, email, mobile, pricing[0].discount_price, rzpOrder.id]
    );

    await db.query(
      `INSERT INTO razorpay_orders (order_id, payment_id, customer_name, email, amount, status, method, customer_id)
       VALUES (?, '', ?, ?, ?, 'Pending', '', ?)`,
      [rzpOrder.id, fullName, email, pricing[0].discount_price, custResult.insertId]
    );

    res.json({
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error("POST /orders/create failed", { error: err.message });
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ─── Shared helper: update DB status + fire email ─────────────────────────
const finalizeOrder = async (orderId, paymentId, status, method, customerName, email) => {
  await db.query(
    `UPDATE razorpay_orders SET payment_id = ?, status = ?, method = ? WHERE order_id = ?`,
    [paymentId || "", status, method || "UPI", orderId]
  );
  await db.query(
    `UPDATE customers SET status = ? WHERE order_id = ?`,
    [status, orderId]
  );

  // Fire email async — don't await, don't block response
  if (status === "Success") {
    sendEbookEmail({ to: email, name: customerName, orderId })
      .then(() => {
        db.query(`UPDATE customers SET email_sent = 1 WHERE order_id = ?`, [orderId]);
      })
      .catch((err) => {
        logger.error(`Failed to send email for order ${orderId}`, { error: err.message });
      });
  }
};

// POST /api/orders/verify  — DEV only
router.post("/verify", async (req, res) => {
  if (isProd) {
    return res.status(403).json({ error: "Use webhook in production" });
  }

  const { razorpay_order_id, razorpay_payment_id, status, method } = req.body;

  if (!razorpay_order_id) {
    return res.status(400).json({ error: "razorpay_order_id is required" });
  }

  try {
    // Get customer name + email for the email
    const [rows] = await db.query(
      `SELECT full_name, email FROM customers WHERE order_id = ?`,
      [razorpay_order_id]
    );
    const customer = rows[0];
    const finalStatus = status === "Failed" ? "Failed" : "Success";

    await finalizeOrder(
      razorpay_order_id,
      razorpay_payment_id,
      finalStatus,
      method,
      customer?.full_name,
      customer?.email
    );

    logger.info(`DEV: Order ${finalStatus}`, { orderId: razorpay_order_id });
    res.json({ message: `Order marked as ${finalStatus}`, orderId: razorpay_order_id });
  } catch (err) {
    logger.error("POST /orders/verify failed", { error: err.message });
    res.status(500).json({ error: "Failed to verify order" });
  }
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT order_id AS orderId, payment_id AS paymentId, customer_name AS customerName,
              email, amount, status, method, created_at AS date
       FROM razorpay_orders
       ORDER BY created_at DESC`
    );
    logger.info(`Fetched ${rows.length} orders`);
    res.json(rows);
  } catch (err) {
    logger.error("GET /orders failed", { error: err.message });
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;