export default function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            value === opt.value ? "bg-ink text-white" : "bg-surface text-ink-2 hover:bg-border-soft"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
