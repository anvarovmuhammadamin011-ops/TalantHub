import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLE = {
  Kutilmoqda: "bg-amber-50 text-amber-600",
  Tasdiqlangan: "bg-emerald-50 text-emerald-600",
  "Rad etildi": "bg-red-50 text-red-500",
};

export default function VerificationPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [stir, setStir] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/verification/mine").then((d) => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!user || user.verified || (user.role !== "specialist" && user.role !== "employer")) return null;
  if (loading) return null;

  const latest = requests[0];
  const canSubmit = !latest || latest.status === "Rad etildi";

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api("/verification", { method: "POST", body: { document_url: documentUrl, document_name: documentName, stir } });
      setDocumentUrl(""); setDocumentName(""); setStir("");
      load();
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-ink-3" />
        <h3 className="font-semibold text-ink text-sm">Verifikatsiya</h3>
        {latest && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[latest.status] || ""}`}>{latest.status}</span>}
      </div>

      {latest && latest.status === "Rad etildi" && latest.reject_reason && (
        <p className="text-xs text-red-500 mb-3">Rad etilgan sabab: {latest.reject_reason}</p>
      )}
      {latest && latest.status === "Kutilmoqda" && (
        <p className="text-xs text-ink-3 mb-3">Hujjatlaringiz administrator tomonidan ko'rib chiqilmoqda.</p>
      )}

      {canSubmit && (
        <div className="space-y-3">
          {user.role === "specialist" ? (
            <>
              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Diplom / sertifikat havolasi</label>
                <input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Hujjat nomi (ixtiyoriy)</label>
                <input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="masalan: Diplom №12345"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Kompaniya STIR raqami</label>
              <input value={stir} onChange={(e) => setStir(e.target.value)} placeholder="123456789"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={submit} disabled={submitting || (user.role === "specialist" ? !documentUrl.trim() : !stir.trim())}
            className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50">
            {submitting ? "Yuborilmoqda..." : "Verifikatsiya so'rash"}
          </button>
        </div>
      )}

      {latest?.document_url && (
        <a href={latest.document_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-3">
          <ExternalLink className="w-3 h-3" /> Yuborilgan hujjat
        </a>
      )}
    </div>
  );
}
