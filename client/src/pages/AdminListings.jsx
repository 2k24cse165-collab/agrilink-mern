import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import ListingCard from "../components/ListingCard.jsx";

const PAGE_SIZE = 20;

export default function AdminListings() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: "", verified: "" });
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    const sp = new URLSearchParams();
    sp.set("limit", String(PAGE_SIZE));
    sp.set("page", String(page));
    if (filter.status) sp.set("status", filter.status);
    if (filter.verified) sp.set("verified", filter.verified);
    api.get(`/admin/listings?${sp.toString()}`)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load listings")));
  };

  useEffect(load, [page, filter]);

  const toggleVerify = async (l) => {
    setBusyId(l._id);
    try {
      const res = await api.post(`/admin/listings/${l._id}/verify`);
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === l._id ? res.data.listing : x)) }));
      toast.success(`Listing ${res.data.listing.verified ? "verified" : "unverified"}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update listing"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (l) => {
    if (!confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    setBusyId(l._id);
    try {
      await api.delete(`/listings/${l._id}`);
      setData((d) => ({ ...d, items: d.items.filter((x) => x._id !== l._id) }));
      toast.success("Listing deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Listings</h1>
      <p className="text-sm text-brand-600">Verify listings and review the full catalog.</p>

      <div className="card mt-4 grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
        <select className="input" value={filter.status}
          onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="sold_out">Sold out</option>
        </select>
        <select className="input" value={filter.verified}
          onChange={(e) => { setFilter({ ...filter, verified: e.target.value }); setPage(1); }}>
          <option value="">All verification</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
        <button className="btn-ghost" onClick={() => { setFilter({ status: "", verified: "" }); setPage(1); }}>Clear filters</button>
      </div>

      {data.items.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-brand-600">No listings match these filters.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((l) => (
            <ListingCard
              key={l._id}
              listing={l}
              footer={
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="btn-outline flex-1"
                    disabled={busyId === l._id}
                    onClick={() => toggleVerify(l)}
                  >
                    {l.verified ? "Unverify" : "Verify"}
                  </button>
                  <button className="btn-danger" disabled={busyId === l._id} onClick={() => remove(l)}>Delete</button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="text-sm text-brand-700">Page {page} of {data.totalPages}</span>
          <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
