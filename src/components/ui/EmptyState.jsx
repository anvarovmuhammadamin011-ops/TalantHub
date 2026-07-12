export default function EmptyState({ icon = "○", title, description, action, actionText }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">{icon}</div>
      <h3 className="text-base font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-ink-3 text-sm mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action}
          className="px-5 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
