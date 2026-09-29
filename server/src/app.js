import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import orderRoutes from "./routes/orders.js";
import analyticsRoutes from "./routes/analytics.js";
import adminRoutes from "./routes/admin.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { configureCloudinary } from "./config/cloudinary.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(","),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // Light rate-limit on auth to slow brute force
  app.use(
    "/api/auth",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false })
  );

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

  // API
  app.use("/api/auth", authRoutes);
  app.use("/api/listings", listingRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  configureCloudinary();
  return app;
}
