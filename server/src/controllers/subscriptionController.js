import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import { PLAN_LIST, PLANS, getPlan } from "../config/plans.js";
import { AppError } from "../middleware/error.js";

/**
 * Public: list the plan catalog.
 */
export async function getPlans(_req, res, next) {
  try {
    res.json({ plans: PLAN_LIST });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticated: current plan + active subscription record (if any).
 */
export async function currentSubscription(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate("plan.subscriptionId");
    const plan = getPlan(user.plan?.id || "free");
    const activeSub = await Subscription.findOne({
      user: user._id,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ plan, subscription: activeSub });
  } catch (err) {
    next(err);
  }
}

/**
 * Mock payment + subscription activation.
 *
 * Real Stripe implementation:
 *   - create a Checkout Session with plan.price as line item
 *   - redirect to session.url
 *   - webhook /webhooks/stripe listens for `checkout.session.completed`
 *     → create Subscription doc + set user.plan.id
 *
 * For this skeleton, we trust the client's paymentMethodId as a stand-in.
 */
export async function subscribe(req, res, next) {
  try {
    const { planId, paymentMethodId } = req.body;
    if (!planId) throw new AppError("planId is required", 400);
    const plan = PLANS[planId];
    if (!plan) throw new AppError(`Unknown plan: ${planId}`, 400);
    if (plan.id === "free") throw new AppError("Use /api/subscriptions/cancel to switch to the free plan", 400);

    if (!paymentMethodId) {
      throw new AppError("paymentMethodId is required (mock checkout)", 400);
    }

    // Cancel any current active sub first (mock)
    await Subscription.updateMany(
      { user: req.user._id, status: "active" },
      { $set: { status: "canceled", canceledAt: new Date() } }
    );

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + (plan.interval === "year" ? 365 : 30));

    const sub = await Subscription.create({
      user: req.user._id,
      planId: plan.id,
      status: "active",
      amount: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      paymentMethodId,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: "mock",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });

    const user = await User.findById(req.user._id);
    user.plan = {
      id: plan.id,
      startedAt: new Date(),
      subscriptionId: sub._id,
    };
    await user.save();

    res.status(201).json({
      subscription: sub,
      plan,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a paid plan → revert to free.
 */
export async function cancelSubscription(req, res, next) {
  try {
    await Subscription.updateMany(
      { user: req.user._id, status: "active" },
      { $set: { status: "canceled", canceledAt: new Date() } }
    );
    const user = await User.findById(req.user._id);
    user.plan = { id: "free", startedAt: new Date(), subscriptionId: null };
    await user.save();
    res.json({ plan: getPlan("free"), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}
