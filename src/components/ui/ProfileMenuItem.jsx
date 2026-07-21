import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// One row in a ProfileMenuGroup: icon + label + right-side content (chevron by default,
// or a custom node like a toggle/value). Pass `to` for navigation or `onClick` for an action.
export default function ProfileMenuItem({ icon: Icon, label, to, onClick, right, danger = false }) {
  const className = `w-full min-h-12 flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface transition-colors text-left ${
    danger ? "text-danger" : "text-ink"
  }`;

  const content = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        <Icon className={`w-5 h-5 flex-shrink-0 ${danger ? "text-danger" : "text-ink-3"}`} />
        <span className="text-sm font-medium truncate">{label}</span>
      </span>
      <span className="flex items-center gap-2 flex-shrink-0 text-ink-3">
        {right !== undefined ? right : <ChevronRight className="w-4 h-4" />}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
