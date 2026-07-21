import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";

// Self-contained confirm modal for the irreversible "delete account" action — requires
// typing a confirm phrase AND the current password before it will submit. Owns its own
// state and the delete call so any profile menu can drop it in without extra wiring.
export default function DeleteAccountDialog({ open, onCancel }) {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const CONFIRM_WORD = t("profile.deleteAccountWord");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const canSubmit = password && confirmText.trim() === CONFIRM_WORD;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    const result = await deleteAccount(password);
    setSubmitting(false);
    if (result.success) navigate("/login");
    else setError(result.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
        <h3 className="font-semibold text-ink text-base mb-2">{t("profile.deleteAccountTitle")}</h3>
        <p className="text-sm text-ink-3 mb-4 leading-relaxed">
          {t("profile.deleteAccountWarning")}
        </p>
        <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">
          {t("profile.deleteAccountConfirmLabel", { word: CONFIRM_WORD })}
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:border-danger/40 outline-none mb-3"
        />
        <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{t("profile.yourPassword")}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.password")}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:border-danger/40 outline-none mb-4"
        />
        {error && <p className="text-xs text-danger mb-4">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 min-h-11 px-4 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
            {t("common.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex-1 min-h-11 px-4 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "..." : t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
