import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const STATUS_BADGE = {
  requested: "badge-pending",
  accepted: "badge-accepted",
  declined: "badge-declined",
  delivered: "badge-delivered",
};

export default function FarmerOrders() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    const url = filter ? `/orders/farmer?status=${filter}` : "/orders/farmer";
    api.get(url)
      .then((r) => setItems(r.data.items))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load orders")))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const action = async (id, kind) => {
    setBusyId(id);
    try {
      const res = await api.post(`/orders/${id}/${kind}`);
      toast.success(`Order ${kind}`);
      setItems((prev) => prev.map((o) => (o._id === id ? res.data.order : o)));
    } catch (err) {
      toast.error(getErrorMessage(err, `Could not ${kind} order`));
    } finally {
      setBusyId(null);
    }
  };

  const TABS = ["", "requested", "accepted", "declined", "delivered"];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Incoming orders</h1>
      <p className="text-sm text-brand-600">Accept, decline and mark deliveries.</p>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t || "all"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === t ? "bg-brand-600 text-white" : "bg-white text-brand-700 hover:bg-brand-50"
            }`}
            onClick={() => setFilter(t)}
          >
            {t ? t[0].toUpperCase() + t.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-brand-50" />)}</div>
      ) : items.length === 0 ? (
        <div className="card mt-4 p-10 text-center">
          <div className="text-5xl">📭</div>
          <h3 className="mt-3 text-lg font-semibold text-brand-900">No orders match</h3>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((o) => (
            <div key={o._id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-brand-100">
                    {o.snapshot?.imageUrl ? <img src={o.snapshot.imageUrl} alt={o.snapshot.title} className="h-full w-full object-cover" /> : <span className="text-2xl">🌾</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-brand-900">{o.snapshot?.title}</h3>
                      <span className={STATUS_BADGE[o.status]}>{o.status}</span>
                    </div>
                    <p className="text-sm text-brand-700">
                      {o.buyer?.name} ({o.buyer?.region || "no region"}) · {o.buyer?.phone || "no phone"}
                    </p>
                    <p className="text-xs text-brand-500">
                      {o.quantity} {o.snapshot?.unit} × ${Number(o.snapshot?.pricePerUnit || 0).toFixed(2)} ={" "}
                      <b>${Number(o.subtotal).toFixed(2)}</b>
                      {o.commission?.amount ? ` · commission $${Number(o.commission.amount).toFixed(2)} (${(o.commission.rate * 100).toFixed(0)}%)` : ""}
                      {" · "}{new Date(o.createdAt).toLocaleString()}
                    </p>
                    {o.note && <p className="mt-1 text-xs italic text-brand-600">"{o.note}"</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {o.status === "requested" && (
                    <>
                      <button className="btn-primary" disabled={busyId === o._id} onClick={() => action(o._id, "accept")}>
                        Accept
                      </button>
                      <button className="btn-outline" disabled={busyId === o._id} onClick={() => action(o._id, "decline")}>
                        Decline
                      </button>
                    </>
                  )}
                  {o.status === "accepted" && (
                    <button className="btn-primary" disabled={busyId === o._id} onClick={() => action(o._id, "deliver")}>
                      Mark delivered
                    </button>
                  )}
                  {(o.status === "declined" || o.status === "delivered") && (
                    <span className="text-xs text-brand-500">No further action</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
