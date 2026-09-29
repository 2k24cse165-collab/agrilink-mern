import { useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ListingCard from "../components/ListingCard.jsx";
import QuantityPicker from "../components/QuantityPicker.jsx";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "grain", label: "Grains" },
  { value: "vegetable", label: "Vegetables" },
  { value: "fruit", label: "Fruits" },
  { value: "tuber", label: "Tubers" },
  { value: "legume", label: "Legumes" },
  { value: "spice", label: "Spices" },
  { value: "other", label: "Other" },
];

const SORTS = [
  { value: "featured_first", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "stock_desc", label: "Most stock" },
];

const PAGE_SIZE = 12;

export default function BuyerBrowse() {
  const toast = useToast();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    q: "",
    category: "",
    region: "",
    organic: false,
    minPrice: "",
    maxPrice: "",
    sort: "featured_first",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  // Order modal
  const [orderTarget, setOrderTarget] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);

  // Debounce the text filters
  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(PAGE_SIZE));
    sp.set("page", String(page));
    if (filters.q) sp.set("q", filters.q);
    if (filters.category) sp.set("category", filters.category);
    if (filters.region) sp.set("region", filters.region);
    if (filters.organic) sp.set("organic", "true");
    if (filters.minPrice) sp.set("minPrice", filters.minPrice);
    if (filters.maxPrice) sp.set("maxPrice", filters.maxPrice);
    sp.set("sort", filters.sort);
    return sp.toString();
  }, [filters, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/listings?${query}`)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load listings")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const onFilterChange = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const openOrder = (listing) => {
    setOrderTarget(listing);
    setQty(Math.min(1, listing.stock));
    setNote("");
  };

  const placeOrder = async () => {
    if (!orderTarget) return;
    if (qty < 1 || qty > orderTarget.stock) {
      toast.error(`Quantity must be between 1 and ${orderTarget.stock}`);
      return;
    }
    setPlacing(true);
    try {
      await api.post("/orders", {
        listingId: orderTarget._id,
        quantity: qty,
        note,
      });
      toast.success(`Order request sent for ${qty} ${orderTarget.unit} of ${orderTarget.title}`);
      setOrderTarget(null);
      // refresh list so the buyer sees updated stock if accepted
      api.get(`/listings?${query}`).then((res) => setData(res.data)).catch(() => {});
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not place order"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Browse produce</h1>
          <p className="text-sm text-brand-600">
            {data.total} active listing{data.total === 1 ? "" : "s"} from verified local farmers
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card mb-4 grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="q">Search</label>
          <input
            id="q"
            className="input"
            placeholder="Search title, crop, description…"
            value={filters.q}
            onChange={(e) => onFilterChange("q", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select
            id="category"
            className="input"
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="region">Region</label>
          <input
            id="region"
            className="input"
            placeholder="e.g. Nyeri"
            value={filters.region}
            onChange={(e) => onFilterChange("region", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="minPrice">Min price</label>
          <input
            id="minPrice"
            type="number"
            min="0"
            className="input"
            value={filters.minPrice}
            onChange={(e) => onFilterChange("minPrice", e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="maxPrice">Max price</label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            className="input"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-brand-700">
            <input
              type="checkbox"
              checked={filters.organic}
              onChange={(e) => onFilterChange("organic", e.target.checked)}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-200"
            />
            Organic only
          </label>
        </div>
        <div>
          <label className="label" htmlFor="sort">Sort</label>
          <select
            id="sort"
            className="input"
            value={filters.sort}
            onChange={(e) => onFilterChange("sort", e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setFilters({ q: "", category: "", region: "", organic: false, minPrice: "", maxPrice: "", sort: "newest" })}
            className="btn-ghost w-full"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-brand-50" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl">🌾</div>
          <h3 className="mt-3 text-lg font-semibold text-brand-900">No listings match your filters</h3>
          <p className="mt-1 text-sm text-brand-600">Try clearing some filters or browsing a different region.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((l) => (
            <ListingCard
              key={l._id}
              listing={l}
              onOrder={user?.role === "buyer" ? openOrder : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span className="px-3 text-sm text-brand-700">
            Page <b>{page}</b> of {data.totalPages}
          </span>
          <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {/* Order modal */}
      {orderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-brand-900">Place order</h3>
              <button className="btn-ghost px-2" onClick={() => setOrderTarget(null)}>×</button>
            </div>
            <p className="mt-1 text-sm text-brand-700">
              {orderTarget.title} — {orderTarget.crop}
            </p>
            <p className="text-sm text-brand-600">
              ${Number(orderTarget.pricePerUnit).toFixed(2)} / {orderTarget.unit} · stock {orderTarget.stock} {orderTarget.unit}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Quantity ({orderTarget.unit})</label>
                <QuantityPicker
                  value={qty}
                  onChange={setQty}
                  min={1}
                  max={orderTarget.stock}
                />
              </div>
              <div className="rounded-lg bg-brand-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-700">Subtotal</span>
                  <span className="font-bold text-brand-900">
                    ${(qty * Number(orderTarget.pricePerUnit)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-brand-500">
                  <span>Platform commission applied at acceptance</span>
                  <span></span>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="note">Note to farmer (optional)</label>
                <textarea
                  id="note"
                  className="input"
                  rows={2}
                  placeholder="Delivery preferences, packaging, etc."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setOrderTarget(null)}>Cancel</button>
              <button className="btn-primary flex-1" disabled={placing} onClick={placeOrder}>
                {placing ? "Sending…" : "Send order request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
