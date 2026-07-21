import { X } from "lucide-react";

// Sliding panel anchored to the bottom of the viewport (filters, pickers, etc.).
// Pass mobileOnly when a desktop equivalent already exists elsewhere on the page.
export default function BottomSheet({ open, onClose, title, children, footer, mobileOnly = false }) {
  if (!open) return null;

  return (
    <div className={`${mobileOnly ? "md:hidden " : ""}fixed inset-0 z-50`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-5">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="w-11 h-11 -mr-2 flex items-center justify-center text-ink-3 hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
        {footer && <div className="px-6 pb-6">{footer}</div>}
      </div>
    </div>
  );
}
