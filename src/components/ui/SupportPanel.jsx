import { useState, useEffect } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { api } from "../../lib/api";

export default function SupportPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api("/support/mine").then((d) => setTickets(d.tickets)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!subject.trim()) { setError("Mavzu kiritilishi shart"); return; }
    setSubmitting(true);
    setError("");
    try {
      await api("/support", { method: "POST", body: { subject: subject.trim(), message: message.trim() } });
      setSubject("");
      setMessage("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="font-semibold text-ink text-xs sm:text-sm flex items-center gap-1.5">
          <LifeBuoy className="w-4 h-4 text-ink-3" /> Yordam
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent font-medium hover:underline flex-shrink-0">
          {showForm ? "Bekor qilish" : "Murojaat yuborish"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-4">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mavzu"
            className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:border-ink/30 outline-none" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            placeholder="Muammoingizni tasvirlab bering..."
            className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:border-ink/30 outline-none resize-none" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={submit} disabled={submitting}
            className="w-full px-3 py-2 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> {submitting ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <p className="text-[11px] sm:text-xs text-ink-3">Hozircha murojaatlar yo'q</p>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((t) => (
            <div key={t.id} className="border border-border-soft rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-ink text-xs">{t.subject}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                  t.status === "Yopiq" ? "bg-success-soft text-success" : "bg-[#FEF3C7] text-[#B45309]"
                }`}>{t.status}</span>
              </div>
              {!!t.response && (
                <div className="mt-2 pt-2 border-t border-border-soft">
                  <div className="text-[10px] font-medium text-ink-3 uppercase tracking-wide mb-1">Javob</div>
                  <p className="text-xs text-ink-2">{t.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
