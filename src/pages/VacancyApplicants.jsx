import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Paperclip, Phone, Send, Mail, Users } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";

const STATUS_TABS = [
  { value: "", label: "Barchasi" },
  { value: "Yuborildi", label: "Yangi" },
  { value: "Ko'rib chiqilmoqda", label: "Ko'rib chiqilmoqda" },
  { value: "Interview", label: "Suhbatga taklif" },
  { value: "Rad etildi", label: "Rad etildi" },
  { value: "Qabul qilindi", label: "Qabul qilindi" },
];

const STATUS_SELECT_CLASS = {
  Yuborildi: "bg-surface text-ink-2 border-border",
  "Ko'rib chiqilmoqda": "bg-accent-soft text-accent border-accent/20",
  Interview: "bg-[#FEF3C7] text-[#B45309] border-[#B45309]/20",
  "Qabul qilindi": "bg-success-soft text-success border-success/20",
  "Rad etildi": "bg-danger-soft text-danger border-danger/20",
};

export default function VacancyApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const data = await api(`/applications/vacancy/${id}`);
      setVacancy(data.vacancy);
      setApplications(data.applications);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (appId, status) => {
    setUpdatingId(appId);
    try {
      await api(`/applications/${appId}/status`, { method: "PATCH", body: { status } });
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = statusFilter ? applications.filter((a) => a.status === statusFilter) : applications;

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
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">{vacancy?.title}</h1>
        <p className="text-ink-3 text-sm mt-1">{applications.length} ta ariza</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value ? "bg-accent text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-5">
            <Users className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">Hozircha arizalar yo'q</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const initials = app.specialist_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
            const hasAnswers = app.screening_answers?.length > 0;
            return (
              <div key={app.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <Link to={`/specialists/${app.user_id}`} className="font-medium text-ink text-sm hover:underline">{app.specialist_name}</Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-ink-3">
                          {app.specialist_category && <span>{app.specialist_category}</span>}
                          {app.specialist_experience_level && <><span>·</span><span>{app.specialist_experience_level}</span></>}
                          <span>·</span>
                          <span title={new Date(app.created_at + "Z").toLocaleString("uz-UZ")}>{timeAgo(app.created_at)}</span>
                        </div>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        disabled={updatingId === app.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border outline-none disabled:opacity-50 ${STATUS_SELECT_CLASS[app.status] || "bg-surface text-ink-2 border-border"}`}
                      >
                        {STATUS_TABS.filter((t) => t.value).map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {!!app.cover_letter && (
                      <p className="mt-2 text-sm text-ink-2 bg-surface rounded-lg p-3 leading-relaxed">{app.cover_letter}</p>
                    )}

                    {hasAnswers && (
                      <div className="mt-2">
                        <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                          className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink font-medium">
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === app.id ? "rotate-180" : ""}`} /> Javoblarni ko'rish
                        </button>
                        {expandedId === app.id && (
                          <div className="mt-2 space-y-2 bg-surface rounded-lg p-3">
                            {app.screening_answers.map((qa, i) => (
                              <div key={i}>
                                <div className="text-xs font-medium text-ink-3">{qa.question}</div>
                                <div className="text-sm text-ink-2 mt-0.5">{qa.answer || "Javob berilmagan"}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-ink-2 border border-border hover:bg-border-soft transition-colors">
                          <Paperclip className="w-3.5 h-3.5" /> Rezyume
                        </a>
                      )}
                      {app.specialist_phone && (
                        <a href={`tel:${app.specialist_phone}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition-colors" title={app.specialist_phone}>
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {app.specialist_telegram && (
                        <a href={`https://t.me/${app.specialist_telegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition-colors" title={app.specialist_telegram}>
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                      {app.specialist_email && (
                        <a href={`mailto:${app.specialist_email}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition-colors" title={app.specialist_email}>
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
