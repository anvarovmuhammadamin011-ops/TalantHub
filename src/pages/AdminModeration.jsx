import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, RotateCcw, Clock, X, ScanSearch } from "lucide-react";
import { api } from "../lib/api";

function truncate(text, n) {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n)}...` : text;
}

export default function AdminModeration() {
  const [vacancies, setVacancies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const load = async () => {
    setError("");
    try {
      const [vacData, statsData] = await Promise.all([
        api("/admin/vacancies?status=Kutilmoqda"),
        api("/admin/stats"),
      ]);
      setVacancies(vacData.vacancies);
      setStats(statsData);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api("/admin/moderation/scan", { method: "POST" });
      setScanResult(result);
    } catch (err) {
      setScanResult({ error: err.message || "Xatolik yuz berdi" });
    } finally {
      setScanning(false);
    }
  };

  const approve = async (id) => {
    setUpdatingId(id);
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: "Faol" } });
      setVacancies((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return;
    setUpdatingId(rejecting.id);
    try {
      await api(`/admin/vacancies/${rejecting.id}/status`, { method: "PATCH", body: { status: "Tuzatish kerak", reject_reason: rejectReason.trim() } });
      setVacancies((prev) => prev.filter((v) => v.id !== rejecting.id));
      setRejecting(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = stats ? [
    { label: "Kutilmoqda", value: stats.vacancies_pending, color: "bg-[#FEF3C7] text-[#B45309]" },
    { label: "Faol", value: stats.vacancies_active, color: "bg-success-soft text-success" },
    { label: "Tuzatishda", value: stats.vacancies_needs_fix, color: "bg-danger-soft text-danger" },
    { label: "Jami", value: stats.vacancies_total, color: "bg-surface text-ink-2" },
  ] : [];

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">Qayta urinish</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">Moderatsiya</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${s.color}`}>{s.label}</div>
            <div className="text-2xl font-semibold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Ommaviy skanerlash</h2>
            <p className="text-xs text-ink-3 mt-0.5">Barcha profil bio va vakansiya tavsiflarini taqiqlangan so'zlar bo'yicha tekshiradi (ro'yxat Sozlamalarda).</p>
          </div>
          <button onClick={runScan} disabled={scanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 flex-shrink-0">
            <ScanSearch className="w-3.5 h-3.5" />
            {scanning ? "Skanerlanmoqda..." : "Skanerlashni boshlash"}
          </button>
        </div>
        {scanResult && (
          <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${scanResult.error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
            {scanResult.error || `${scanResult.scannedWords} ta so'z bo'yicha tekshirildi, ${scanResult.flagged} ta yangi shubhali kontent belgilandi. Shikoyatlar bo'limida ko'ring.`}
          </div>
        )}
      </div>

      <h2 className="font-semibold text-ink text-sm mb-4">Tekshirilmoqda</h2>
      {vacancies.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-4">
            <ClipboardCheck className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-ink-3">Tekshirish uchun vakansiya yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacancies.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Link to={`/admin/vacancies/${v.id}`} className="font-medium text-ink text-sm hover:underline">{v.title}</Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-ink-3">
                    <span>{v.author_name}</span>
                    {(v.directions || []).length > 0 && <><span>·</span><span>{v.directions.join(", ")}</span></>}
                    <span>·</span><span>{v.experience}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-2">{truncate(v.description, 60)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={() => setViewing(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-ink-2 hover:bg-border-soft transition-colors flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Ko'rish
                </button>
                <button onClick={() => approve(v.id)} disabled={updatingId === v.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success-soft text-success hover:opacity-80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlash
                </button>
                <button onClick={() => { setRejecting(v); setRejectReason(""); }} disabled={updatingId === v.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-soft text-danger hover:opacity-80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Tuzatishga qaytarish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-base">{viewing.title}</h3>
              <button onClick={() => setViewing(null)} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-xs text-ink-3 mb-4">{viewing.author_name} · {viewing.experience} · {viewing.location}</div>
            <p className="text-sm text-ink-2 whitespace-pre-line">{viewing.description}</p>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink text-base mb-1">Tuzatishga qaytarish</h3>
            <p className="text-xs text-ink-3 mb-4">"{rejecting.title}" — sababni yozing:</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder="Masalan: tavsif juda qisqa..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRejecting(null)} className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">Bekor qilish</button>
              <button onClick={submitReject} disabled={!rejectReason.trim() || updatingId === rejecting.id}
                className="flex-1 py-2.5 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                Yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
