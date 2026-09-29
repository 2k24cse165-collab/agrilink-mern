import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

function Stat({ label, value, hint }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-brand-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-brand-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-brand-500">{hint}</div>}
    </div>
  );
}

export default function FarmerAnalytics() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/analytics/farmer")
      .then((r) => setStats(r.data))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load analytics")));
  }, [toast]);

  if (!stats) return <div className="card p-10 text-center text-brand-600">Loading analytics…</div>;

  const maxRevenue = Math.max(1, ...stats.topCrops.map((c) => c.revenue));

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Analytics</h1>
      <p className="text-sm text-brand-600">Revenue, commission and top crops for your farm store.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Gross revenue" value={`$${Number(stats.revenue).toFixed(2)}`} hint="Accepted + delivered" />
        <Stat label="Commission" value={`$${Number(stats.commission).toFixed(2)}`} hint="To platform" />
        <Stat label="Net revenue" value={`$${Number(stats.netRevenue).toFixed(2)}`} hint="After commission" />
        <Stat label="Orders" value={stats.orderCount} hint="Accepted + delivered" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Top crops by revenue</h3>
          {stats.topCrops.length === 0 ? (
            <p className="mt-4 text-sm text-brand-600">No accepted orders yet — once you accept one, your top crops will appear here.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.topCrops.map((c) => (
                <div key={c.crop}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-brand-800">{c.crop}</span>
                    <span className="text-brand-700">
                      ${Number(c.revenue).toFixed(2)} · {c.qty} units · {c.orders} order{c.orders === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
                    <div className="h-full bg-brand-600" style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Order status breakdown</h3>
          <div className="mt-3 space-y-1 text-sm text-brand-700">
            {["requested", "accepted", "declined", "delivered"].map((s) => (
              <div key={s} className="flex justify-between">
                <span className="capitalize">{s}</span>
                <span className="font-semibold">{stats.statusCounts?.[s] ?? 0}</span>
              </div>
            ))}
          </div>
          <h3 className="mt-5 font-semibold text-brand-900">Listing status</h3>
          <div className="mt-2 space-y-1 text-sm text-brand-700">
            {Object.entries(stats.listingStatus || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <span>{v.count} listings · {v.totalStock} units stock</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
