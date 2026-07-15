import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, ExternalLink, FileText, GraduationCap, Building2, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLE = {
  Kutilmoqda: { bg: "bg-amber-50", text: "text-amber-600", icon: Clock },
  Tasdiqlangan: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle },
  "Rad etildi": { bg: "bg-red-50", text: "text-red-500", icon: XCircle },
};

const DOC_TYPES = [
  { id: "diplom", label: "Diplom", icon: GraduationCap },
  { id: "sertifikat", label: "Sertifikat", icon: FileText },
  { id: "litsenziya", label: "Litsenziya", icon: ShieldCheck },
];

export default function VerificationPanel({ expanded = false }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(expanded);
  const [docType, setDocType] = useState("diplom");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [institution, setInstitution] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [year, setYear] = useState("");
  const [stir, setStir] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/verification/mine").then((d) => setRequests(d.requests)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!user || (user.role !== "specialist" && user.role !== "employer")) return null;
  if (loading) return null;

  const latest = requests[0];
  const canSubmit = !latest || latest.status === "Rad etildi";

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api("/verification", {
        method: "POST",
        body: {
          document_url: documentUrl,
          document_name: documentName || `${DOC_TYPES.find((d) => d.id === docType)?.label} - ${institution || ""}`,
          institution,
          specialty,
          year: year ? parseInt(year) : 0,
          stir,
        },
      });
      setDocumentUrl(""); setDocumentName(""); setInstitution(""); setSpecialty(""); setYear(""); setStir("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const isSpecialist = user.role === "specialist";
  const progress = requests.length > 0 ? (latest.status === "Tasdiqlangan" ? 100 : latest.status === "Kutilmoqda" ? 60 : 30) : 0;

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ink-3" />
          <h3 className="font-semibold text-ink text-sm">Verifikatsiya</h3>
          {latest && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[latest.status]?.bg} ${STATUS_STYLE[latest.status]?.text}`}>
              {latest.status}
            </span>
          )}
        </div>
        {user.verified ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Tasdiqlangan</span>
        ) : canSubmit && !showForm ? (
          <button onClick={() => setShowForm(true)} className="text-xs font-medium text-accent hover:underline">
            So'rash
          </button>
        ) : null}
      </div>

      {user.verified ? (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle className="w-4 h-4" />
          <span>Hisobingiz tasdiqlangan</span>
        </div>
      ) : latest && !showForm ? (
        <div className="space-y-3">
          {latest.status === "Rad etildi" && latest.reject_reason && (
            <div className="bg-red-50 text-red-500 text-xs px-3 py-2 rounded-lg">
              Rad etilgan sabab: {latest.reject_reason}
            </div>
          )}
          {latest.status === "Kutilmoqda" && (
            <div className="bg-amber-50 text-amber-600 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Hujjatlaringiz ko'rib chiqilmoqda
            </div>
          )}
          <div className="text-xs text-ink-3 space-y-1">
            {latest.document_name && <p><span className="font-medium">Hujjat:</span> {latest.document_name}</p>}
            {latest.institution && <p><span className="font-medium">Muassasa:</span> {latest.institution}</p>}
            {latest.specialty && <p><span className="font-medium">Mutaxassislik:</span> {latest.specialty}</p>}
            {latest.year > 0 && <p><span className="font-medium">Yil:</span> {latest.year}</p>}
          </div>
          {latest.document_url && (
            <a href={latest.document_url} target="_blank" rel="noreferrer"
              className="text-xs text-accent hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Yuborilgan hujjat
            </a>
          )}
          {latest.status === "Rad etildi" && (
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
              Qayta yuborish
            </button>
          )}
        </div>
      ) : showForm ? (
        <div className="space-y-4">
          {isSpecialist ? (
            <>
              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Hujjat turi</label>
                <div className="grid grid-cols-3 gap-2">
                  {DOC_TYPES.map((dt) => (
                    <button key={dt.id} onClick={() => setDocType(dt.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                        docType === dt.id ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                      }`}>
                      <dt.icon className="w-4 h-4" />
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Hujjat havolasi *</label>
                <input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Muassasa</label>
                  <input value={institution} onChange={(e) => setInstitution(e.target.value)}
                    placeholder="masalan: TDTU"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Mutaxassislik</label>
                  <input value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="masalan: IT"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Bitirgan yili</label>
                <input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} type="text" inputMode="numeric"
                  placeholder="masalan: 2023" maxLength={4}
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

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
              Bekor qilish
            </button>
            <button onClick={submit} disabled={submitting || (isSpecialist ? !documentUrl.trim() : !stir.trim())}
              className="flex-1 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50">
              {submitting ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-3">Profil tasdiqlash uchun hujjatingizni yuboring</p>
      )}
    </div>
  );
}
