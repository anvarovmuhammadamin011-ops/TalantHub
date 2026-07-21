import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, icon: Icon, color = "bg-accent-soft text-accent", trendPct }) {
  const hasTrend = typeof trendPct === "number";
  const trendUp = hasTrend && trendPct >= 0;

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {Icon && <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />}
        </div>
        {hasTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
              trendUp ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trendPct)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-ink tracking-tight">{value}</div>
      <div className="text-xs text-ink-3 mt-0.5">{label}</div>
    </div>
  );
}
