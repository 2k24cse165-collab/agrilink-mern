/**
 * Subscription plan catalog.
 * Free plan is always available; paid plans gate premium listing features
 * (priority placement + higher listing cap + lower commission).
 *
 * The client shows these in /pricing; the server enforces the limits
 * in `enforcePlanLimits` middleware.
 */
export const PLANS = {
  free: {
    id: "free",
    name: "Starter",
    price: 0,
    currency: "usd",
    interval: "month",
    maxListings: 5,
    priorityBoost: false,
    commissionRate: Number(process.env.COMMISSION_RATE || 0.05), // 5%
    features: ["Up to 5 active listings", "Standard placement", "5% platform commission"],
  },
  pro: {
    id: "pro",
    name: "Pro Farmer",
    price: 19,
    currency: "usd",
    interval: "month",
    maxListings: 50,
    priorityBoost: true,
    commissionRate: 0.03, // 3%
    features: ["Up to 50 active listings", "Priority placement in search", "Reduced 3% commission", "Revenue analytics"],
  },
  enterprise: {
    id: "enterprise",
    name: "Cooperative",
    price: 99,
    currency: "usd",
    interval: "month",
    maxListings: 500,
    priorityBoost: true,
    commissionRate: 0.02, // 2%
    features: ["Up to 500 active listings", "Top placement + featured badge", "Lowest 2% commission", "Bulk order tools", "Dedicated support"],
  },
};

export const PLAN_LIST = Object.values(PLANS);

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

/**
 * True if a plan is a paid plan (i.e. requires a successful payment to activate).
 */
export function isPaidPlan(planId) {
  return PLANS[planId] && PLANS[planId].price > 0;
}
