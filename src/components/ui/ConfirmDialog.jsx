import { useState, useEffect } from "react";
import { useT } from "../../context/I18nContext";

// Generic confirm modal. Pass `requireText` to demand the user type an exact phrase
// before the confirm button unlocks — used for irreversible actions like account deletion.
export default function ConfirmDialog({
  open, title, description, confirmLabel, cancelLabel,
  danger = false, requireText, confirming = false, error, onConfirm, onCancel,
}) {
  const { t } = useT();
  const [typed, setTyped] = useState("");

  useEffect(() => { if (open) setTyped(""); }, [open]);

  if (!open) return null;

  const canConfirm = !requireText || typed.trim() === requireText;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
        <h3 className="font-semibold text-ink text-base mb-2">{title}</h3>
        {description && <p className="text-sm text-ink-3 mb-4 leading-relaxed">{description}</p>}
        {requireText && (
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:border-danger/40 outline-none mb-4"
          />
        )}
        {error && <p className="text-xs text-danger mb-4">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 min-h-11 px-4 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
            {cancelLabel || t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || confirming}
            className={`flex-1 min-h-11 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              danger ? "bg-danger text-white hover:bg-danger/90" : "bg-ink text-white hover:bg-ink/90"
            }`}
          >
            {confirming ? "..." : confirmLabel || t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
