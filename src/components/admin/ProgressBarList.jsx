import EmptyState from "../ui/EmptyState";

export default function ProgressBarList({ items, colorClass = "bg-accent", emptyTitle = "Hozircha ma'lumot yo'q", emptyDescription = "" }) {
  if (!items.length) {
    return <EmptyState icon="📈" title={emptyTitle} description={emptyDescription} />;
  }
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-ink-2 font-medium truncate pr-2">{item.name}</span>
            <span className="text-ink-3 flex-shrink-0">{item.count}</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.colorClass || colorClass}`}
              style={item.color ? { width: `${(item.count / max) * 100}%`, backgroundColor: item.color } : { width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
