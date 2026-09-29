import mongoose from "mongoose";
import { Listing } from "../models/Listing.js";
import { User } from "../models/User.js";
import { uploadBuffer, deleteImage } from "../config/cloudinary.js";
import { getPlan } from "../config/plans.js";
import { AppError } from "../middleware/error.js";

const DEFAULT_PAGE_SIZE = 12;

/**
 * Public browse — search, filter, sort, paginate active listings.
 *
 * Query params:
 *   q           text search against title / description / crop
 *   category    one of grain|vegetable|fruit|tuber|legume|spice|other
 *   crop        exact crop name
 *   region      case-insensitive contains
 *   organic     "true" → only organic listings
 *   minPrice    number
 *   maxPrice    number
 *   sort        newest | price_asc | price_desc | stock_desc   (default: newest)
 *   page        1-based
 *   limit       1..50 (default 12)
 */
export async function listListings(req, res, next) {
  try {
    const {
      q,
      category,
      crop,
      region,
      organic,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = String(DEFAULT_PAGE_SIZE),
    } = req.query;

    const filter = { status: "active" };

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }
    if (category) filter.category = category;
    if (crop) filter.crop = new RegExp(`^${crop}$`, "i");
    if (region) filter.region = new RegExp(region, "i");
    if (organic === "true") filter.organic = true;
    if (minPrice || maxPrice) {
      filter.pricePerUnit = {};
      if (minPrice) filter.pricePerUnit.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerUnit.$lte = Number(maxPrice);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { pricePerUnit: 1 },
      price_desc: { pricePerUnit: -1 },
      stock_desc: { stock: -1 },
      featured_first: { featured: -1, createdAt: -1 },
    };
    const sortSpec = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
    const skip = (pageNum - 1) * pageSize;

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate("farmer", "name region verified")
        .sort(sortSpec)
        .skip(skip)
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
      hasMore: pageNum * pageSize < total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getListing(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError("Invalid listing id", 400);
    const listing = await Listing.findById(req.params.id)
      .populate("farmer", "name region verified avatarUrl")
      .lean();
    if (!listing) throw new AppError("Listing not found", 404);
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

/**
 * Farmer-only: create a listing. Enforces plan limit (maxListings).
 */
export async function createListing(req, res, next) {
  try {
    const plan = getPlan(req.user.plan?.id || "free");

    const activeCount = await Listing.countDocuments({
      farmer: req.user._id,
      status: { $in: ["active", "paused"] },
    });
    if (activeCount >= plan.maxListings) {
      throw new AppError(
        `Your "${plan.name}" plan allows ${plan.maxListings} active listings. Upgrade to publish more.`,
        402
      );
    }

    const { title, description, crop, variety, category, pricePerUnit, unit, stock, organic, region, harvestDate } =
      req.body;

    if (!title || !crop || pricePerUnit == null || stock == null) {
      throw new AppError("title, crop, pricePerUnit and stock are required", 400);
    }

    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const up = await uploadBuffer(req.file.buffer);
      imageUrl = up.secure_url;
      imagePublicId = up.public_id;
    }

    const listing = await Listing.create({
      farmer: req.user._id,
      title,
      description,
      crop,
      variety,
      category: category || "other",
      pricePerUnit: Number(pricePerUnit),
      unit: unit || "kg",
      stock: Number(stock),
      organic: organic === "true" || organic === true,
      region: region || req.user.region || "",
      harvestDate: harvestDate || null,
      imageUrl,
      imagePublicId,
      featured: plan.priorityBoost === true,
    });

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found", 404);
    if (!listing.farmer.equals(req.user._id) && req.user.role !== "admin") {
      throw new AppError("Not your listing", 403);
    }

    const editable = [
      "title",
      "description",
      "crop",
      "variety",
      "category",
      "pricePerUnit",
      "unit",
      "stock",
      "organic",
      "region",
      "harvestDate",
      "status",
    ];
    for (const k of editable) {
      if (req.body[k] !== undefined) listing.set(k, req.body[k]);
    }

    if (Number(req.body.stock) === 0) {
      listing.status = "sold_out";
    } else if (listing.status === "sold_out" && Number(req.body.stock) > 0) {
      listing.status = "active";
    }

    if (req.file) {
      if (listing.imagePublicId) await deleteImage(listing.imagePublicId);
      const up = await uploadBuffer(req.file.buffer);
      listing.imageUrl = up.secure_url;
      listing.imagePublicId = up.public_id;
    }

    await listing.save();
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new AppError("Listing not found", 404);
    if (!listing.farmer.equals(req.user._id) && req.user.role !== "admin") {
      throw new AppError("Not your listing", 403);
    }
    if (listing.imagePublicId) await deleteImage(listing.imagePublicId);
    await listing.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Farmer-only: list own listings (any status, newest first).
 */
export async function myListings(req, res, next) {
  try {
    const items = await Listing.find({ farmer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (err) {
    next(err);
  }
}
