import { useState } from "react";
import { Flag } from "lucide-react";
import { api } from "../../lib/api";

export default function ReportButton({ targetType, targetId, className, label = "Shikoyat qilish" }) {
  const [sending, setSending] = useState(false);

  const submitReport = async () => {
    const reason = prompt("Shikoyat sababini kiriting:");
    if (!reason || !reason.trim()) return;
    setSending(true);
    try {
      await api("/reports", { method: "POST", body: { target_type: targetType, target_id: targetId, reason: reason.trim() } });
      alert("Shikoyatingiz qabul qilindi. Administrator tez orada ko'rib chiqadi.");
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
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
      <Flag className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
