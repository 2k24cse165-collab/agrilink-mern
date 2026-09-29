import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

function Stat({ label, value, hint, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-brand-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent || "text-brand-900"}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-brand-500">{hint}</div>}
    </div>
  );
}

const STATUS_BADGE = {
  requested: "badge-pending",
  accepted: "badge-accepted",
  declined: "badge-declined",
  delivered: "badge-delivered",
};

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/analytics/admin")
      .then((r) => setStats(r.data))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load platform analytics")));
  }, [toast]);

  if (!stats) return <div className="card p-10 text-center text-brand-600">Loading platform analytics…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Platform dashboard</h1>
      <p className="text-sm text-brand-600">Aggregates across all users, listings and orders.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total users" value={stats.users.total} hint={`${stats.users.verified} verified`} />
        <Stat label="Total listings" value={stats.listings.total} hint={`${stats.listings.verified} verified`} />
        <Stat label="Gross GMV" value={`$${Number(stats.sales.grossGMV).toFixed(2)}`} hint={`${stats.sales.orderCount} orders`} accent="text-brand-700" />
        <Stat label="Commission earned" value={`$${Number(stats.sales.commission).toFixed(2)}`} hint="Platform revenue" accent="text-emerald-700" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Farmers" value={stats.users.byRole.farmer || 0} />
        <Stat label="Buyers" value={stats.users.byRole.buyer || 0} />
        <Stat label="Admins" value={stats.users.byRole.admin || 0} />
        <Stat label="Suspended" value={stats.users.byRole.suspended || 0} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-brand-900">Top farmers by GMV</h3>
            <Link to="/admin/users" className="text-sm font-medium text-brand-700 hover:underline">All users</Link>
          </div>
          {stats.topFarmers.length === 0 ? (
            <p className="mt-4 text-sm text-brand-600">No accepted orders on the platform yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.topFarmers.map((f, i) => (
                <div key={f.farmerId} className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
                  <div>
                    <div className="font-semibold text-brand-900">
                      #{i + 1} {f.name || "—"}
                      {f.verified ? " ✓" : ""}
                    </div>
                    <div className="text-xs text-brand-600">{f.region || "no region"} · {f.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-700">${Number(f.grossGMV).toFixed(2)}</div>
                    <div className="text-xs text-brand-500">commission ${Number(f.commission).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Recent orders</h3>
          {stats.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-brand-600">No orders yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.recentOrders.map((o) => (
                <div key={o._id} className="rounded-lg border border-brand-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-900">{o.snapshot?.title || "—"} × {o.quantity}</span>
                    <span className={STATUS_BADGE[o.status]}>{o.status}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-brand-500">
                    ${Number(o.subtotal).toFixed(2)} · {o.buyer?.name} → {o.farmer?.name} · {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/admin/users" className="card p-4 hover:bg-brand-50">
          <h3 className="font-semibold text-brand-900">Manage users →</h3>
          <p className="mt-1 text-sm text-brand-600">Verify or suspend farmers and buyers.</p>
        </Link>
        <Link to="/admin/listings" className="card p-4 hover:bg-brand-50">
          <h3 className="font-semibold text-brand-900">Manage listings →</h3>
          <p className="mt-1 text-sm text-brand-600">Verify listings, review flagged content.</p>
        </Link>
        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Listing status</h3>
          <div className="mt-2 space-y-1 text-sm text-brand-700">
            {Object.entries(stats.listings.byStatus || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <span>{v.count} listings · {v.stock} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
