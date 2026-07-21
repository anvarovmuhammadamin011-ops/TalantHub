// White rounded card that wraps a set of ProfileMenuItem rows, separated by thin dividers.
export default function ProfileMenuGroup({ title, children }) {
  return (
    <div>
      {title && <h3 className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 px-1">{title}</h3>}
      <div className="bg-white rounded-xl border border-border divide-y divide-border-soft overflow-hidden">
        {children}
      </div>
    </div>
  );
}
