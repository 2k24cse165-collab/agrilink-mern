import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { connectDB, closeDB } from "../config/db.js";

/**
 * Seed an admin user from SEED_ADMIN_* env vars.
 * Usage:
 *   npm run seed:admin
 * If the email already exists, it updates role to admin (idempotent).
 */
async function main() {
  await connectDB();

  const name = process.env.SEED_ADMIN_NAME || "Site Admin";
  const email = process.env.SEED_ADMIN_EMAIL || "admin@agrilink.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2025";

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.verified = true;
    user.verifiedAt = new Date();
    await user.save();
    console.log(`[seed:admin] Existing user promoted to admin → ${email}`);
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: "admin",
      verified: true,
    });
    console.log(`[seed:admin] Admin created → ${email} / password=${password}`);
  }

  await closeDB();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed:admin] failed:", err);
  process.exit(1);
});
