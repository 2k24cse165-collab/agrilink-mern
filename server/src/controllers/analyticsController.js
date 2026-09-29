import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { AppError } from "../middleware/error.js";

/**
 * Farmer dashboard analytics — for the logged-in farmer only.
 *  - revenue: sum of subtotals for accepted+delivered orders
 *  - commission: sum of commission amounts (what the platform earned)
 *  - netRevenue: revenue - commission
 *  - topCrops: grouping by snapshot.crop, sorted by revenue
 *  - statusCounts: count of orders per status
 */
export async function farmerAnalytics(req, res, next) {
  try {
    const farmerId = req.user._id;

    const [agg, statusAgg, listingAgg] = await Promise.all([
      Order.aggregate([
        { $match: { farmer: farmerId, status: { $in: ["accepted", "delivered"] } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$subtotal" },
            commission: { $sum: "$commission.amount" },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { farmer: farmerId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Listing.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalStock: { $sum: "$stock" },
          },
        },
      ]),
    ]);

    const revenue = agg[0]?.revenue || 0;
    const commission = agg[0]?.commission || 0;
    const orderCount = agg[0]?.orderCount || 0;

    const topCrops = await Order.aggregate([
      { $match: { farmer: farmerId, status: { $in: ["accepted", "delivered"] } } },
      {
        $group: {
          _id: "$snapshot.crop",
          revenue: { $sum: "$subtotal" },
          qty: { $sum: "$quantity" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, crop: "$_id", revenue: 1, qty: 1, orders: 1 } },
    ]);

    const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
    const listingStatus = Object.fromEntries(
      listingAgg.map((l) => [l._id, { count: l.count, totalStock: l.totalStock }])
    );

    res.json({
      revenue: Number(revenue.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      netRevenue: Number((revenue - commission).toFixed(2)),
      orderCount,
      statusCounts,
      topCrops,
      listingStatus,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin dashboard analytics — platform-wide.
 *  - users: total + by role + verified
 *  - sales: gross GMV (sum of subtotals on accepted+delivered)
 *  - commission: platform revenue
 *  - listings: total + verified + by status
 *  - topFarmers: top 5 by GMV
 */
export async function adminAnalytics(req, res, next) {
  try {
    const [usersByRole, usersVerified, salesAgg, listingsAgg, listingsVerified, topFarmers, recentOrders] =
      await Promise.all([
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: "$verified", count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { status: { $in: ["accepted", "delivered"] } } },
          {
            $group: {
              _id: null,
              grossGMV: { $sum: "$subtotal" },
              commission: { $sum: "$commission.amount" },
              orderCount: { $sum: 1 },
            },
          },
        ]),
        Listing.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, stock: { $sum: "$stock" } } }]),
        Listing.aggregate([{ $group: { _id: "$verified", count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { status: { $in: ["accepted", "delivered"] } } },
          {
            $group: {
              _id: "$farmer",
              grossGMV: { $sum: "$subtotal" },
              commission: { $sum: "$commission.amount" },
              orders: { $sum: 1 },
            },
          },
          { $sort: { grossGMV: -1 } },
          { $limit: 5 },
          {
            $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "farmer" },
          },
          { $unwind: { path: "$farmer", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              farmerId: "$_id",
              name: "$farmer.name",
              region: "$farmer.region",
              verified: "$farmer.verified",
              grossGMV: 1,
              commission: 1,
              orders: 1,
            },
          },
        ]),
        Order.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("buyer", "name")
          .populate("farmer", "name")
          .populate("listing", "title crop")
          .lean(),
      ]);

    const usersBy = Object.fromEntries(usersByRole.map((u) => [u._id, u.count]));
    const verifiedBy = Object.fromEntries(usersVerified.map((u) => [u._id, u.count]));
    const listingsBy = Object.fromEntries(
      listingsAgg.map((l) => [l._id, { count: l.count, stock: l.stock }])
    );
    const verifiedListingsBy = Object.fromEntries(listingsVerified.map((l) => [l._id, l.count]));

    res.json({
      users: {
        total: (usersBy.farmer || 0) + (usersBy.buyer || 0) + (usersBy.admin || 0),
        byRole: usersBy,
        verified: verifiedBy.true || 0,
        unverified: verifiedBy.false || 0,
      },
      sales: {
        grossGMV: Number((salesAgg[0]?.grossGMV || 0).toFixed(2)),
        commission: Number((salesAgg[0]?.commission || 0).toFixed(2)),
        netToFarmers: Number(((salesAgg[0]?.grossGMV || 0) - (salesAgg[0]?.commission || 0)).toFixed(2)),
        orderCount: salesAgg[0]?.orderCount || 0,
      },
      listings: {
        total: (listingsBy.active || { count: 0 }).count + (listingsBy.sold_out || { count: 0 }).count + (listingsBy.paused || { count: 0 }).count,
        byStatus: listingsBy,
        verified: verifiedListingsBy.true || 0,
        unverified: verifiedListingsBy.false || 0,
      },
      topFarmers,
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
}
