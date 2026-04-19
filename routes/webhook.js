import { Router } from "express";
import crypto from "crypto";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";
import { sendEbookEmail } from "../utils/mailer.js";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

router.post("/", async (req, res) => {
  if (!isProd) {
    logger.warn("Webhook hit in non-production — ignoring");
    return res.status(200).json({ ignored: true });
  }

  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    logger.warn("Webhook: missing signature or secret");
    return res.status(400).json({ error: "Missing signature" });
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (expectedSig !== signature) {
    logger.warn("Webhook: signature mismatch");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  logger.info(`Webhook received: ${event.event}`);

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const method = payment.method || "UPI";

        await db.query(
          `UPDATE razorpay_orders SET payment_id = ?, status = 'Success', method = ? WHERE order_id = ?`,
          [paymentId, method, orderId]
        );
        await db.query(
          `UPDATE customers SET status = 'Success' WHERE order_id = ?`,
          [orderId]
        );

        // Get customer details for email
        const [rows] = await db.query(
          `SELECT full_name, email FROM customers WHERE order_id = ?`,
          [orderId]
        );
        const customer = rows[0];

        // Fire email async
        if (customer) {
          sendEbookEmail({ to: customer.email, name: customer.full_name, orderId })
            .then(() => {
              db.query(`UPDATE customers SET email_sent = 1 WHERE order_id = ?`, [orderId]);
            })
            .catch((err) => {
              logger.error(`Failed to send email for order ${orderId}`, { error: err.message });
            });
        }

        logger.info(`✅ Payment captured: ${paymentId} for order ${orderId}`);
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        await db.query(
          `UPDATE razorpay_orders SET status = 'Failed' WHERE order_id = ?`,
          [orderId]
        );
        await db.query(
          `UPDATE customers SET status = 'Failed' WHERE order_id = ?`,
          [orderId]
        );
        logger.warn(`❌ Payment failed for order ${orderId}`);
        break;
      }

      default:
        logger.info(`Webhook: unhandled event — ${event.event}`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook handler error", { error: err.message });
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;