import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * An order is a buyer's request for a quantity of a listing at a frozen unit price.
 * State machine: requested → accepted → delivered | declined
 *
 * When a farmer accepts:
 *   - listing.stock -= qty
 *   - commission = subtotal * plan.commissionRate
 *   - listing.status flips to "sold_out" if stock reaches 0
 */
const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },

    // Snapshot the listing details at request time so historical orders
    // remain accurate even if the farmer edits the listing later.
    snapshot: {
      title: { type: String, required: true },
      crop: { type: String, required: true },
      pricePerUnit: { type: Number, required: true },
      unit: { type: String, required: true },
      imageUrl: { type: String, default: "" },
    },

    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["requested", "accepted", "declined", "delivered"],
      default: "requested",
      index: true,
    },

    commission: {
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },

    note: { type: String, trim: true, default: "", maxlength: 500 },
    acceptedAt: { type: Date, default: null },
    declinedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, status: 1, createdAt: -1 });

export const Order = model("Order", orderSchema);
