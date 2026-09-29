import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * A listing is a quantity of a crop a farmer offers at a unit price.
 * Stock is reduced when an order on this listing is accepted by the farmer.
 */
const listingSchema = new Schema(
  {
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    crop: { type: String, required: [true, "Crop is required"], trim: true, index: true },
    variety: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: ["grain", "vegetable", "fruit", "tuber", "legume", "spice", "other"],
      default: "other",
      index: true,
    },
    pricePerUnit: { type: Number, required: [true, "Price per unit is required"], min: 0 },
    unit: { type: String, default: "kg", enum: ["kg", "lb", "ton", "crate", "bag", "each"] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    organic: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },

    region: { type: String, trim: true, default: "", index: true },
    harvestDate: { type: Date, default: null },

    // Verification (admin)
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },

    // Subscription effects
    featured: { type: Boolean, default: false },

    status: { type: String, enum: ["active", "paused", "sold_out"], default: "active", index: true },
  },
  { timestamps: true }
);

// Full-text search across title + description + crop
listingSchema.index({ title: "text", description: "text", crop: "text" });

// Compound for buyer browse: filter category + sort by createdAt/price
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ pricePerUnit: 1 });
listingSchema.index({ stock: 1 });

export const Listing = model("Listing", listingSchema);
