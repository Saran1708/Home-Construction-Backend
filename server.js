import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";

import { logger } from "./utils/logger.js";
import { db } from "./utils/db.js";

import pricingRouter from "./routes/pricing.js";
import ordersRouter from "./routes/orders.js";
import customersRouter from "./routes/customers.js";
import webhookRouter from "./routes/webhook.js";
import serviceOrdersRouter from "./routes/serviceOrders.js";
import servicePricingRouter from "./routes/servicePricing.js";
import authRouter from "./routes/auth.js";


const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "https://homeconstructionblueprint.com",
  "https://www.homeconstructionblueprint.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

// ─── CORS ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      logger.warn(`Blocked CORS from origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

app.options("*", cors());

// ─── Static Files (before helmet) ────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── Security ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ─── Logging ─────────────────────────────────────────────────────
// Only log errors and important requests (not every request)
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    // Only log errors (4xx, 5xx) and long-running requests
    if (res.statusCode >= 400 || duration > 1000) {
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ─── Webhook Raw Body (before express.json) ───────────────────────
app.use(
  "/api/webhook/razorpay",
  express.raw({ type: "application/json" }),
  webhookRouter
);

// ─── Body Parsers ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/pricing", pricingRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/service-orders", serviceOrdersRouter);
app.use("/api/service-pricing", servicePricingRouter);
app.use("/api/auth", authRouter);

// ─── 404 ─────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────
const server = createServer(app);

async function start() {
  try {
    await db.query("SELECT 1");
    logger.info("✅ MySQL connected successfully");
  } catch (err) {
    logger.error("❌ MySQL connection failed", { error: err.message });
  }

  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📡 Allowed origins: ${allowedOrigins.join(", ")}`);
    logger.info(`🔔 Webhooks: ${isProd ? "ENABLED" : "DEV MODE"}`);
  });
}

start();