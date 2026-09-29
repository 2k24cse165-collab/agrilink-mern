import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Records a subscription payment / activation.
 * The latest "active" doc for a user is the source of truth for which paid plan they're on.
 *
 * The mock "payment" flow:
 *   POST /api/subscriptions/subscribe  { planId: "pro", paymentMethodId: "pm_mock_xxx" }
 *   → creates a Subscription doc with status "active", sets user.plan.id = planId.
 *
 * To swap in Stripe later, replace `subscriptionController.subscribe` with a
 * Checkout Session + webhook handler that creates the same doc.
 */
const subscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing"],
      default: "active",
      index: true,
    },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd" },
    interval: { type: String, enum: ["month", "year"], default: "month" },

    // Mock payment fields — replace with real provider references later
    paymentMethodId: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    provider: { type: String, default: "mock" },

    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, default: null },

    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscriptionSchema);
