import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Razorpay from "razorpay";
import { db } from "../utils/db.js";
import { logger } from "../utils/logger.js";
import { sendServiceConfirmationEmail } from "../utils/serviceMailer.js";

const router = Router();

const getRazorpay = () =>
    new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

const upload = multer({
    dest: "uploads/tmp/",
    limits: { fileSize: 5 * 1024 * 1024, files: 3 },
    fileFilter: (_, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        cb(null, allowed.includes(file.mimetype));
    },
});

// POST /api/service-orders/create
router.post("/create", upload.array("photos", 3), async (req, res) => {
    const { fullName, email, mobile, plan } = req.body;
    const files = req.files || [];

    if (!fullName || !email || !mobile || !plan) {
        return res.status(400).json({ error: "fullName, email, mobile, plan required" });
    }

    const validPlans = ["elevation", "floorplan", "interior"];
    if (!validPlans.includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
    }

    try {
        // Fetch price from DB
        const [[planRow]] = await db.query(
            `SELECT offer FROM service_settings WHERE plan = ?`,
            [plan]
        );
        if (!planRow) return res.status(400).json({ error: "Plan pricing not configured" });
        const amount = Number(planRow.offer);

        const rzpOrder = await getRazorpay().orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `svc_${Date.now()}`,
            notes: { name: fullName, email, mobile, plan },
        });

        // To this:
        await db.query(
            `INSERT INTO service_orders (order_id, plan, full_name, email, mobile, amount, status, method)
   VALUES (?, ?, ?, ?, ?, ?, 'Pending', '')`,
            [rzpOrder.id, plan, fullName, email, mobile, amount]
        );

        if (files.length > 0) {
            const dir = `uploads/service-orders/${rzpOrder.id}`;
            fs.mkdirSync(dir, { recursive: true });

            for (const file of files) {
                const ext = path.extname(file.originalname) || ".jpg";
                const filename = `${file.filename}${ext}`;
                const dest = path.join(dir, filename);
                fs.renameSync(file.path, dest);

                await db.query(
                    `INSERT INTO service_order_photos (order_id, filename, original_name) VALUES (?, ?, ?)`,
                    [rzpOrder.id, filename, file.originalname]
                );
            }
        }

        logger.info("Service order created", { orderId: rzpOrder.id, plan, email });

        res.json({
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        for (const f of files) { try { fs.unlinkSync(f.path); } catch { } }
        logger.error("POST /service-orders/create failed", { error: err.message });
        res.status(500).json({ error: "Failed to create service order" });
    }
});

// POST /api/service-orders/verify (dev only)
router.post("/verify", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Use webhook in production" });
    }

    const { razorpay_order_id, razorpay_payment_id, status, method } = req.body;
    if (!razorpay_order_id) return res.status(400).json({ error: "razorpay_order_id required" });

    const finalStatus = status === "Failed" ? "Failed" : "Success";
    try {
        await db.query(
            `UPDATE service_orders SET payment_id = ?, status = ?, method = ? WHERE order_id = ?`,
            [razorpay_payment_id || "", finalStatus, method || "UPI", razorpay_order_id]
        );

        if (finalStatus === "Success") {
            const [[customer]] = await db.query(
                `SELECT full_name, email, plan FROM service_orders WHERE order_id = ?`,
                [razorpay_order_id]
            );
            if (customer) {
                sendServiceConfirmationEmail({
                    to: customer.email,
                    name: customer.full_name,
                    orderId: razorpay_order_id,
                    plan: customer.plan,
                }).catch((err) =>
                    logger.error(`Failed to send service email for ${razorpay_order_id}`, { error: err.message })
                );
            }
        }

        logger.info(`DEV: Service order ${finalStatus}`, { orderId: razorpay_order_id });
        res.json({ message: `Marked ${finalStatus}`, orderId: razorpay_order_id });
    } catch (err) {
        logger.error("POST /service-orders/verify failed", { error: err.message });
        res.status(500).json({ error: "Failed to verify" });
    }
});

// GET /api/service-orders
router.get("/", async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT order_id AS orderId, payment_id AS paymentId, plan, full_name AS fullName,
              email, mobile, amount, status, email_sent AS emailSent, created_at AS date
       FROM service_orders ORDER BY created_at DESC`
        );

        for (const o of orders) {
            const [photos] = await db.query(
                `SELECT filename FROM service_order_photos WHERE order_id = ?`,
                [o.orderId]
            );
            o.photos = photos.map((p) => `/uploads/service-orders/${o.orderId}/${p.filename}`);
            o.emailSent = !!o.emailSent;
        }

        res.json(orders);
    } catch (err) {
        logger.error("GET /service-orders failed", { error: err.message });
        res.status(500).json({ error: "Failed to fetch" });
    }
});

// PATCH /api/service-orders/:orderId/email-sent
router.patch("/:orderId/email-sent", async (req, res) => {
    const { orderId } = req.params;
    const { emailSent } = req.body;
    try {
        await db.query(
            `UPDATE service_orders SET email_sent = ? WHERE order_id = ?`,
            [emailSent ? 1 : 0, orderId]
        );
        res.json({ ok: true });
    } catch (err) {
        logger.error("PATCH /service-orders/email-sent failed", { error: err.message });
        res.status(500).json({ error: "Failed to update" });
    }
});

export default router;