import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const STATUS_BADGE = {
  requested: "badge-pending",
  accepted: "badge-accepted",
  declined: "badge-declined",
  delivered: "badge-delivered",
};

export default function BuyerOrders() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/buyer")
      .then((res) => setItems(res.data.items))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load orders")))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">My orders</h1>
      <p className="text-sm text-brand-600">Track requests you've placed and their status.</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-brand-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <div className="text-5xl">🧺</div>
          <h3 className="mt-3 text-lg font-semibold text-brand-900">No orders yet</h3>
          <p className="mt-1 text-sm text-brand-600">Browse listings and place your first order.</p>
          <Link to="/browse" className="btn-primary mt-4 inline-flex">Browse produce</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((o) => (
            <div key={o._id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-100">
                {o.snapshot?.imageUrl ? (
                  <img src={o.snapshot.imageUrl} alt={o.snapshot.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">🌾</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-brand-900">{o.snapshot?.title}</h3>
                  <span className={STATUS_BADGE[o.status]}>{o.status}</span>
                </div>
                <p className="text-sm text-brand-600">
                  {o.quantity} {o.snapshot?.unit} × ${Number(o.snapshot?.pricePerUnit || 0).toFixed(2)} ·{" "}
                  <b className="text-brand-800">${Number(o.subtotal).toFixed(2)}</b>
                </p>
                <p className="mt-0.5 text-xs text-brand-500">
                  Seller: {o.farmer?.name} {o.farmer?.verified ? "✓" : ""}
                  {o.farmer?.region ? ` · ${o.farmer.region}` : ""}
                  {" · "}{new Date(o.createdAt).toLocaleString()}
                </p>
                {o.note && <p className="mt-1 text-xs italic text-brand-600">"{o.note}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
