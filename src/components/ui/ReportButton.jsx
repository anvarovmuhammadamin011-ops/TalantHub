import { useState } from "react";
import { Flag } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useT } from "../../context/I18nContext";

export default function ReportButton({ targetType, targetId, className, label }) {
  const [sending, setSending] = useState(false);
  const showToast = useToast();
  const { t } = useT();

  const submitReport = async () => {
    const reason = prompt(t("reportButton.promptReason"));
    if (!reason || !reason.trim()) return;
    setSending(true);
    try {
      await api("/reports", { method: "POST", body: { target_type: targetType, target_id: targetId, reason: reason.trim() } });
      showToast(t("reportButton.success"), "success");
    } catch (err) {
      showToast(err.message || t("common.error"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={submitReport}
      disabled={sending}
      className={className || "flex items-center gap-1.5 text-xs text-ink-3 hover:text-red-500 transition-colors disabled:opacity-60"}
    >
      <Flag className="w-3.5 h-3.5" /> {label || t("reportButton.label")}
    </button>
  );
}
