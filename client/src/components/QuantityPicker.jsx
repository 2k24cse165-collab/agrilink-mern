export default function QuantityPicker({ value, onChange, min = 1, max = 9999, step = 1 }) {
  const set = (next) => {
    const v = Math.max(min, Math.min(max, Number(next) || min));
    onChange(v);
  };
  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-brand-200">
      <button
        type="button"
        className="px-3 text-lg font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        onClick={() => set(value - step)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => set(e.target.value)}
        className="w-16 border-x border-brand-200 text-center text-sm focus:outline-none"
      />
      <button
        type="button"
        className="px-3 text-lg font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        onClick={() => set(value + step)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
