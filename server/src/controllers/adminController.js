import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Listing } from "../models/Listing.js";
import { Order } from "../models/Order.js";
import { AppError } from "../middleware/error.js";

/**
 * Admin: paginated list of users with optional role + search filters.
 */
export async function listUsers(req, res, next) {
  try {
    const { role, q, page = "1", limit = "20" } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: toggle a user's verified flag (and their farmer plan perks).
 */
export async function verifyUser(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError("Invalid user id", 400);
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found", 404);

    user.verified = !user.verified;
    user.verifiedAt = user.verified ? new Date() : null;
    user.verifiedBy = user.verified ? req.user._id : null;
    await user.save();

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: toggle a user's suspended flag.
 */
export async function suspendUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin" && req.user._id.equals(user._id)) {
      throw new AppError("You cannot suspend yourself", 400);
    }
    user.suspended = !user.suspended;
    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: paginated list of all listings (any status).
 */
export async function listAllListings(req, res, next) {
  try {
    const { status, verified, page = "1", limit = "20" } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (verified === "true") filter.verified = true;
    if (verified === "false") filter.verified = false;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate("farmer", "name region verified")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found", 404);
    listing.verified = !listing.verified;
    listing.verifiedAt = listing.verified ? new Date() : null;
    await listing.save();
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: paginated list of all orders.
 */
export async function listAllOrders(req, res, next) {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate("buyer", "name")
        .populate("farmer", "name")
        .populate("listing", "title crop")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}
