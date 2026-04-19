
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

// ─── Allowed Origins ─────────────────────────────────────────────
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
      // allow server-to-server / curl / postman
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      logger.warn(`Blocked CORS from origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-razorpay-signature",
    ],
  })
);

// Explicit preflight handling
app.options("*", cors());

// ─── Security ────────────────────────────────────────────────────
app.use(helmet());

// ─── Logging ─────────────────────────────────────────────────────
app.use(
  morgan("combined", {
    stream: {
      write: (msg) => logger.http(msg.trim()),
    },
  })
);

// ─── Webhook Raw Body (must come before express.json) ────────────
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
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    ts: new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use("/api/pricing", pricingRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/customers", customersRouter);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
  });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
  });

  res.status(500).json({
    error: "Internal server error",
  });
});

// ─── HTTP Server ────────────────────────────────────────────────
const server = createServer(app);

// ─── Startup ─────────────────────────────────────────────────────
async function start() {
  try {
    await db.query("SELECT 1");
    logger.info("✅ MySQL connected successfully");
  } catch (err) {
    logger.error("❌ MySQL connection failed", {
      error: err.message,
    });
  }

  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📡 Allowed origins: ${allowedOrigins.join(", ")}`);
    logger.info(`🔔 Webhooks: ${isProd ? "ENABLED" : "DEV MODE"}`);
  });
}

start();

