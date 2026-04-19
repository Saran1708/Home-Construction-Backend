

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { logger } from "./utils/logger.js";
import { db } from "./utils/db.js";
import pricingRouter from "./routes/pricing.js";
import ordersRouter from "./routes/orders.js";
import customersRouter from "./routes/customers.js";
import webhookRouter from "./routes/webhook.js";


const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://homeconstructionblueprint.com",
  "http://localhost:5173", // Vite dev default
  "http://localhost:8080",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow curl / server-to-server calls in dev
      if (!origin && !isProd) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      logger.warn(`Blocked CORS from origin: ${origin}`);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

// ─── SECURITY & PARSING ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Webhook route needs raw body for signature verification — must come BEFORE json()
app.use("/api/webhook/razorpay", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/pricing", pricingRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/customers", customersRouter);

// 404
app.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ───────────────────────────────────────────────────────────────────
const server = createServer(app);

async function start() {
  try {
    await db.query("SELECT 1");
    logger.info("✅ MySQL connected successfully");

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 Webhooks: ${isProd ? "ENABLED" : "DISABLED (dev mode)"}`);
      logger.info(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (err) {
    logger.error("❌ Failed to connect to MySQL", { error: err.message });
    process.exit(1);
  }
}

start();
