export default function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-border shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-ink text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-ink-3 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
