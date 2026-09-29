import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SubscriptionPlans() {
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [sub, setSub] = useState(null);
  const [busyPlan, setBusyPlan] = useState(null);

  const load = () => {
    api.get("/subscriptions/plans").then((r) => setPlans(r.data.plans));
    api.get("/subscriptions/me")
      .then((r) => {
        setCurrent(r.data.plan);
        setSub(r.data.subscription);
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const subscribe = async (plan) => {
    if (plan.id === "free") {
      try {
        await api.post("/subscriptions/cancel");
        toast.success("Switched to the free plan");
        refreshUser();
        load();
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not change plan"));
      }
      return;
    }

    if (!confirm(`Subscribe to "${plan.name}" for $${plan.price}/${plan.interval}? This is a mock checkout — no real payment will be processed.`)) return;

    setBusyPlan(plan.id);
    try {
      // Mock payment method id — in production this would come from Stripe.js after card entry
      const res = await api.post("/subscriptions/subscribe", {
        planId: plan.id,
        paymentMethodId: `pm_mock_${Date.now()}`,
      });
      toast.success(`Subscribed to ${plan.name}!`);
      await refreshUser();
      setCurrent(res.data.plan);
      setSub(res.data.subscription);
    } catch (err) {
      toast.error(getErrorMessage(err, "Subscription failed"));
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-900">Choose your plan</h1>
        <p className="mt-2 text-brand-600">
          Lower commission, more listings and priority placement as you scale your farm store.
        </p>
        {current && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800">
            Your current plan: <b className="capitalize">{current.id}</b>
            {current.price > 0 && <span className="text-xs">· ${current.price}/{current.interval}</span>}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = (user?.plan?.id || "free") === p.id;
          const isFeatured = p.id === "pro";
          return (
            <div
              key={p.id}
              className={`card relative flex flex-col p-5 ${isFeatured ? "ring-2 ring-brand-500" : ""}`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge bg-brand-600 text-white">Most popular</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-brand-900">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-brand-900">${p.price}</span>
                <span className="text-sm text-brand-500">/{p.interval}</span>
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-brand-700">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
                <div>Max listings: <b>{p.maxListings}</b></div>
                <div>Commission: <b>{(p.commissionRate * 100).toFixed(0)}%</b></div>
                <div>Priority placement: <b>{p.priorityBoost ? "Yes" : "No"}</b></div>
              </div>

              <button
                className={`mt-4 w-full ${isCurrent ? "btn-outline" : p.id === "free" ? "btn-outline" : "btn-primary"}`}
                disabled={isCurrent || busyPlan === p.id}
                onClick={() => subscribe(p)}
              >
                {isCurrent ? "Current plan" : busyPlan === p.id ? "Processing…" : p.id === "free" ? "Switch to free" : `Subscribe to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 p-4 text-center text-xs text-brand-500">
        <p>This is a mock checkout flow. To enable real payments, wire the <code>subscribe</code> controller to Stripe Checkout — the Subscription model already mirrors Stripe's data shape.</p>
      </div>
    </div>
  );
}
