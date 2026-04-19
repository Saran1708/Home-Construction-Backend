
import mysql from "mysql2/promise";
import { logger } from "./logger.js";

let pool;

export const db = {
  query: (...args) => {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: "+05:30",
      });
      logger.info(`DB pool created for user: ${process.env.DB_USER}`);
    }
    const sql = typeof args[0] === "string" ? args[0] : args[0]?.sql;
    if (process.env.NODE_ENV !== "production") {
      logger.debug(`[SQL] ${sql?.replace(/\s+/g, " ").trim()}`);
    }
    return pool.query(...args);
  },
};