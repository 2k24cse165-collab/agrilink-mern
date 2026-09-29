import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { getPlan } from "../config/plans.js";
import { AppError } from "../middleware/error.js";

/**
 * Buyer creates an order request for qty units of a listing.
 * Stock is NOT reserved at request time — the farmer decides to accept.
 * On accept, stock is reduced atomically (findOneAndUpdate with $inc + condition).
 */
export async function createOrder(req, res, next) {
  try {
    const { listingId, quantity, note } = req.body;
    if (!listingId || !quantity) throw new AppError("listingId and quantity are required", 400);
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) throw new AppError("quantity must be a positive integer", 400);

    const listing = await Listing.findById(listingId);
    if (!listing) throw new AppError("Listing not found", 404);
    if (listing.status !== "active") throw new AppError("Listing not available", 400);
    if (listing.farmer.equals(req.user._id)) throw new AppError("You can't order from your own listing", 400);

    const farmer = await User.findById(listing.farmer);
    if (!farmer) throw new AppError("Seller no longer exists", 400);

    const order = await Order.create({
      buyer: req.user._id,
      farmer: listing.farmer,
      listing: listing._id,
      snapshot: {
        title: listing.title,
        crop: listing.crop,
        pricePerUnit: listing.pricePerUnit,
        unit: listing.unit,
        imageUrl: listing.imageUrl,
      },
      quantity: qty,
      subtotal: Number((qty * listing.pricePerUnit).toFixed(2)),
      note: note || "",
      status: "requested",
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

/**
 * Farmer accepts an order. Atomic stock decrement + commission record.
 * 409 if stock insufficient.
 */
export async function acceptOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found", 404);
    if (!order.farmer.equals(req.user._id)) throw new AppError("Not your order", 403);
    if (order.status !== "requested") throw new AppError(`Order is already ${order.status}`, 409);

    const listing = await Listing.findById(order.listing);
    if (!listing) throw new AppError("Listing no longer exists", 400);

    // Atomic check-and-decrement so concurrent accepts are safe
    const updated = await Listing.findOneAndUpdate(
      { _id: listing._id, stock: { $gte: order.quantity } },
      { $inc: { stock: -order.quantity } },
      { new: true }
    );
    if (!updated) throw new AppError("Insufficient stock to accept this order", 409);

    if (updated.stock === 0) {
      updated.status = "sold_out";
      await updated.save();
    }

    const farmer = await User.findById(req.user._id);
    const plan = getPlan(farmer.plan?.id || "free");

    order.status = "accepted";
    order.acceptedAt = new Date();
    order.commission = {
      rate: plan.commissionRate,
      amount: Number((order.subtotal * plan.commissionRate).toFixed(2)),
    };

    await order.save();
    res.json({ order, listing: updated });
  } catch (err) {
    next(err);
  }
}

export async function declineOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found", 404);
    if (!order.farmer.equals(req.user._id)) throw new AppError("Not your order", 403);
    if (order.status !== "requested") throw new AppError(`Order is already ${order.status}`, 409);

    order.status = "declined";
    order.declinedAt = new Date();
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function deliverOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found", 404);
    if (!order.farmer.equals(req.user._id)) throw new AppError("Not your order", 403);
    if (order.status !== "accepted") throw new AppError(`Order must be accepted first (currently ${order.status})`, 409);

    order.status = "delivered";
    order.deliveredAt = new Date();
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

/**
 * Farmer view: orders on my listings, optionally filtered by status.
 */
export async function farmerOrders(req, res, next) {
  try {
    const filter = { farmer: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const items = await Order.find(filter)
      .populate("buyer", "name region phone")
      .populate("listing", "title crop imageUrl")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/**
 * Buyer view: my order requests.
 */
export async function buyerOrders(req, res, next) {
  try {
    const items = await Order.find({ buyer: req.user._id })
      .populate("farmer", "name region verified")
      .populate("listing", "title crop imageUrl pricePerUnit unit stock status")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}
