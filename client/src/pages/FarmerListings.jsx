import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import ListingCard from "../components/ListingCard.jsx";

const CATEGORIES = ["grain", "vegetable", "fruit", "tuber", "legume", "spice", "other"];
const UNITS = ["kg", "lb", "ton", "crate", "bag", "each"];

const EMPTY = {
  title: "",
  description: "",
  crop: "",
  variety: "",
  category: "other",
  pricePerUnit: "",
  unit: "kg",
  stock: "",
  organic: false,
  region: "",
  harvestDate: "",
};

export default function FarmerListings() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // listing or {} for new
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    api
      .get("/listings/me/listings")
      .then((r) => setItems(r.data.items))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load listings")))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startNew = () => {
    setEditing({});
    setForm(EMPTY);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (l) => {
    setEditing(l);
    setForm({
      ...EMPTY,
      ...l,
      harvestDate: l.harvestDate ? l.harvestDate.slice(0, 10) : "",
    });
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeForm = () => setEditing(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.crop || !form.pricePerUnit || form.stock === "") {
      toast.error("Title, crop, price and stock are required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null) fd.append(k, v);
      });
      if (file) fd.append("image", file);

      if (editing?._id) {
        await api.patch(`/listings/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Listing updated");
      } else {
        await api.post("/listings", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Listing published");
      }
      setEditing(null);
      load();
    } catch (err) {
      const msg = getErrorMessage(err, "Could not save listing");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l) => {
    if (!confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/listings/${l._id}`);
      toast.success("Listing deleted");
      setItems((prev) => prev.filter((x) => x._id !== l._id));
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete"));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">My listings</h1>
          <p className="text-sm text-brand-600">Publish, edit and manage your farm store.</p>
        </div>
        <button className="btn-primary" onClick={startNew}>+ New listing</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-brand-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl">🌱</div>
          <h3 className="mt-3 text-lg font-semibold text-brand-900">No listings yet</h3>
          <p className="mt-1 text-sm text-brand-600">Publish your first listing to start receiving orders.</p>
          <button className="btn-primary mt-4" onClick={startNew}>+ Create listing</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l._id} listing={l} onEdit={startEdit} onDelete={remove} />
          ))}
        </div>
      )}

      {/* Editor drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="card w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5"
            encType="multipart/form-data"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-900">
                {editing._id ? "Edit listing" : "New listing"}
              </h3>
              <button type="button" className="btn-ghost px-2" onClick={closeForm}>×</button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title *</label>
                <input className="input" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Crop *</label>
                <input className="input" required value={form.crop} placeholder="e.g. Maize"
                  onChange={(e) => setForm({ ...form, crop: e.target.value })} />
              </div>
              <div>
                <label className="label">Variety</label>
                <input className="input" value={form.variety} placeholder="e.g. H614"
                  onChange={(e) => setForm({ ...form, variety: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unit</label>
                <select className="input" value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price per unit *</label>
                <input type="number" step="0.01" min="0" className="input" required value={form.pricePerUnit}
                  onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
              </div>
              <div>
                <label className="label">Stock *</label>
                <input type="number" min="0" step="1" className="input" required value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="label">Region</label>
                <input className="input" value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
              <div>
                <label className="label">Harvest date</label>
                <input type="date" className="input" value={form.harvestDate}
                  onChange={(e) => setForm({ ...form, harvestDate: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea rows={3} className="input" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-brand-700 sm:col-span-2">
                <input type="checkbox" checked={form.organic}
                  onChange={(e) => setForm({ ...form, organic: e.target.checked })} />
                Certified organic
              </label>
              <div className="sm:col-span-2">
                <label className="label">Listing image (optional)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-brand-700 file:mr-3 file:rounded file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-200"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {editing.imageUrl && !file && (
                  <p className="mt-1 text-xs text-brand-500">Current image will be kept.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? "Saving…" : editing._id ? "Save changes" : "Publish listing"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
