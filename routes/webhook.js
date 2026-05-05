import { Router } from "express";
import crypto from "crypto";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";
import { sendEbookEmail } from "../utils/mailer.js";
import { sendServiceConfirmationEmail } from "../utils/serviceMailer.js";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

router.post("/", async (req, res) => {
  const reqId = `wh_${Date.now()}`;
  logger.info(`Webhook [${reqId}] received`);

  try {
    // ── Signature check (prod only) ──────────────────────────
    if (isProd) {
      const signature = req.headers["x-razorpay-signature"];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!secret) {
        logger.error(`Webhook [${reqId}] RAZORPAY_WEBHOOK_SECRET not set`);
        return res.status(500).end();
      }

      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (expectedSig !== signature) {
        logger.warn(`Webhook [${reqId}] signature mismatch`);
        return res.status(400).json({ error: "Invalid signature" });
      }

      logger.info(`Webhook [${reqId}] signature verified`);
    } else {
      logger.warn(`Webhook [${reqId}] skipping signature check (dev mode)`);
    }

    // ── Parse event ──────────────────────────────────────────
    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    logger.info(`Webhook [${reqId}] event: ${event.event}`);

    // ── Handle events ────────────────────────────────────────
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        const method = payment.method || "UPI";

        logger.info(`Webhook [${reqId}] payment.captured | paymentId=${paymentId} | orderId=${orderId}`);

        const [[ebookOrder]] = await db.query(
          `SELECT customer_name, email FROM razorpay_orders WHERE order_id = ?`,
          [orderId]
        );
        const [[serviceOrder]] = await db.query(
          `SELECT full_name, email, plan FROM service_orders WHERE order_id = ?`,
          [orderId]
        );

        if (ebookOrder) {
          await db.query(
            `UPDATE razorpay_orders SET payment_id = ?, status = 'Success', method = ? WHERE order_id = ?`,
            [paymentId, method, orderId]
          );
          await db.query(
            `UPDATE customers SET status = 'Success' WHERE order_id = ?`,
            [orderId]
          );

          sendEbookEmail({ to: ebookOrder.email, name: ebookOrder.customer_name, orderId })
            .then(() => {
              db.query(`UPDATE customers SET email_sent = 1 WHERE order_id = ?`, [orderId]);
              logger.info(`Webhook [${reqId}] ebook email sent | orderId=${orderId}`);
            })
            .catch((err) => {
              logger.error(`Webhook [${reqId}] ebook email failed | orderId=${orderId} | ${err.message}`);
            });

          logger.info(`Webhook [${reqId}] ✅ ebook order updated | orderId=${orderId}`);
        } else if (serviceOrder) {
          await db.query(
            `UPDATE service_orders SET payment_id = ?, status = 'Success', method = ? WHERE order_id = ?`,
            [paymentId, method, orderId]
          );

          sendServiceConfirmationEmail({
            to: serviceOrder.email,
            name: serviceOrder.full_name,
            orderId,
            plan: serviceOrder.plan,
          }).catch((err) => {
            logger.error(`Webhook [${reqId}] service email failed | orderId=${orderId} | ${err.message}`);
          });

          logger.info(`Webhook [${reqId}] ✅ service order updated | orderId=${orderId} | plan=${serviceOrder.plan}`);
        } else {
          logger.warn(`Webhook [${reqId}] order not found in any table | orderId=${orderId}`);
        }

        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        await db.query(`UPDATE razorpay_orders SET status = 'Failed' WHERE order_id = ?`, [orderId]);
        await db.query(`UPDATE customers SET status = 'Failed' WHERE order_id = ?`, [orderId]);
        await db.query(`UPDATE service_orders SET status = 'Failed' WHERE order_id = ?`, [orderId]);

        logger.warn(`Webhook [${reqId}] ❌ payment failed | orderId=${orderId}`);
        break;
      }

      default:
        logger.info(`Webhook [${reqId}] unhandled event: ${event.event}`);
    }

    return res.status(200).json({ status: "ok" });

  } catch (err) {
    logger.error(`Webhook [${reqId}] unhandled error | ${err.message}`);
    return res.status(500).end();
  }
});

logger.info(`Webhook route registered (${isProd ? "production" : "dev"} mode)`);

export default router;