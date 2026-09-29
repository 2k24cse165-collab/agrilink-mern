export default function ListingCard({ listing, onOrder, onEdit, onDelete, footer }) {
  const status = listing.stock === 0 ? "sold_out" : listing.status;

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-brand-100">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🌾</div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {listing.organic && <span className="badge-organic">Organic</span>}
          {listing.verified && <span className="badge-verified">Verified</span>}
          {listing.featured && <span className="badge bg-amber-100 text-amber-800">Featured</span>}
        </div>
        {status === "sold_out" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold uppercase tracking-wide text-white">
            Sold out
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-900">{listing.title}</h3>
          <span className="shrink-0 font-bold text-brand-700">
            ${Number(listing.pricePerUnit).toFixed(2)}
            <span className="text-xs font-normal text-brand-500">/{listing.unit}</span>
          </span>
        </div>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-600">
          {listing.crop}
          {listing.variety ? ` · ${listing.variety}` : ""}
          {listing.category ? ` · ${listing.category}` : ""}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-brand-700">{listing.description || "No description provided."}</p>

        <div className="mt-2 flex items-center justify-between text-xs text-brand-600">
          <span>
            Stock: <b className="text-brand-800">{listing.stock}</b> {listing.unit}
          </span>
          {listing.farmer?.region && <span>📍 {listing.farmer.region}</span>}
        </div>

        {listing.farmer && (
          <p className="mt-1 text-xs text-brand-500">
            by {listing.farmer.name}
            {listing.farmer.verified ? " ✓" : ""}
          </p>
        )}

        {footer ?? (
          <div className="mt-3 flex flex-wrap gap-2">
            {onOrder && listing.status === "active" && listing.stock > 0 && (
              <button className="btn-primary flex-1" onClick={() => onOrder(listing)}>
                Order
              </button>
            )}
            {onEdit && (
              <button className="btn-outline flex-1" onClick={() => onEdit(listing)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className="btn-danger" onClick={() => onDelete(listing)}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
