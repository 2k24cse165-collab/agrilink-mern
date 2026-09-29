import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Stat({ label, value, hint }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-brand-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-brand-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-brand-500">{hint}</div>}
    </div>
  );
}

export default function FarmerDashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/farmer").then((r) => r.data),
      api.get("/listings/me/listings").then((r) => r.data.items),
    ])
      .then(([s, l]) => {
        setStats(s);
        setListings(l);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Could not load dashboard")))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="card p-10 text-center text-brand-600">Loading dashboard…</div>;

  const plan = user?.plan?.id || "free";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-brand-600">Quick overview of your farm store.</p>
        </div>
        <Link to="/farmer/listings" className="btn-primary">+ New listing</Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Revenue" value={`$${Number(stats?.revenue || 0).toFixed(2)}`} hint="Accepted + delivered" />
        <Stat label="Commission" value={`$${Number(stats?.commission || 0).toFixed(2)}`} hint="Paid to platform" />
        <Stat label="Net revenue" value={`$${Number(stats?.netRevenue || 0).toFixed(2)}`} hint="After commission" />
        <Stat label="Active orders" value={stats?.orderCount ?? 0} hint="Accepted + delivered" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Your plan</h3>
          <p className="mt-1 text-sm capitalize text-brand-700">
            <b>{plan}</b> · {stats?.listingStatus && Object.entries(stats.listingStatus).map(([k, v]) => `${k}: ${v.count}`).join(" · ")}
          </p>
          <Link to="/pricing" className="btn-outline mt-3 inline-flex">View / upgrade plan</Link>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-brand-900">Order status</h3>
          <div className="mt-2 space-y-1 text-sm text-brand-700">
            {["requested", "accepted", "declined", "delivered"].map((s) => (
              <div key={s} className="flex justify-between">
                <span className="capitalize">{s}</span>
                <span className="font-semibold">{stats?.statusCounts?.[s] ?? 0}</span>
              </div>
            ))}
          </div>
          <Link to="/farmer/orders" className="btn-outline mt-3 inline-flex">Manage orders</Link>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-brand-900">Recent listings</h3>
          <Link to="/farmer/listings" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
        </div>
        {listings.length === 0 ? (
          <div className="card p-6 text-center text-brand-600">
            You haven't published any listings yet. <Link to="/farmer/listings" className="font-semibold text-brand-700">Create your first one →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 6).map((l) => (
              <div key={l._id} className="card p-3">
                <div className="flex justify-between text-xs text-brand-500">
                  <span className="capitalize">{l.status}</span>
                  <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 font-semibold text-brand-900">{l.title}</div>
                <div className="text-sm text-brand-600">
                  {l.crop} · ${Number(l.pricePerUnit).toFixed(2)}/{l.unit} · stock {l.stock}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
