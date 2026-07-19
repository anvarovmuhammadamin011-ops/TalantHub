import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Clock, ChevronRight, Award, TrendingUp, CheckCircle, XCircle, MessageSquare, X, Paperclip, Search, ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEmployer = user?.role === "employer";
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [contactingId, setContactingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const statusOrder = ["Yuborildi", "Ko'rib chiqilmoqda", "Interview", "Qabul qilindi", "Rad etildi"];

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const endpoint = isEmployer ? "/applications/employer" : "/applications";
      const data = await api(endpoint);
      setApplications(data.applications);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api(`/applications/${id}/status`, { method: "PATCH", body: { status } });
      await loadApps();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const withdrawApp = async (id) => {
    if (!confirm("Arizani qaytarib olishni xohlaysizmi?")) return;
    setUpdatingId(id);
    try {
      await api(`/applications/${id}`, { method: "DELETE" });
      await loadApps();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const contactSpecialist = async (userId) => {
    setContactingId(userId);
    try {
      await api("/chats/create", { method: "POST", body: { user_id: userId } });
      navigate("/chat");
    } catch (err) {
      console.error(err);
    } finally {
      setContactingId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = applications.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (!q) return true;
    return (a.vacancy_title || "").toLowerCase().includes(q) || (isEmployer ? a.specialist_name : a.company || "").toLowerCase().includes(q);
  });

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = filtered.filter((a) => a.status === status);
    return acc;
  }, {});

  const ratedApplications = applications.filter((a) => a.match_percent !== null && a.match_percent !== undefined);
  const avgMatch = ratedApplications.length > 0
    ? Math.round(ratedApplications.reduce((sum, a) => sum + a.match_percent, 0) / ratedApplications.length)
    : null;

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">
          {isEmployer ? "Kelgan arizalar" : "Arizalar kuzatuvi"}
        </h1>
        <p className="text-ink-3 text-sm">{applications.length} ta ariza</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Jami arizalar", value: stats.total || applications.length, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
          { label: "Intervyu", value: stats.interview || grouped["Interview"]?.length || 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Qabul qilindi", value: stats.accepted || grouped["Qabul qilindi"]?.length || 0, icon: Award, color: "bg-green-50 text-green-600" },
          { label: "O'rtacha moslik", value: avgMatch === null ? "—" : `${avgMatch}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-ink">{stat.value}</div>
                <div className="text-xs text-ink-3">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">📋</div>
          <h3 className="text-base font-semibold text-ink mb-1.5">Hozircha arizalar yo'q</h3>
          <p className="text-ink-3 text-sm">
            <Link to="/vacancies" className="text-ink font-medium hover:underline">Vakansiyalar</Link>ga ariza yuboring
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={isEmployer ? "Vakansiya yoki nomzod qidirish..." : "Vakansiya yoki kompaniya qidirish..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha holatlar</option>
              {statusOrder.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-ink-3 text-sm mb-6">Qidiruv bo'yicha ariza topilmadi</div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:gap-4">
            {statusOrder.map((status) => (
              <div key={status} className="min-w-[250px] md:min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={status} />
                  <span className="text-xs text-ink-3 font-medium">{grouped[status]?.length || 0}</span>
                </div>
                <div className="space-y-3">
                  {grouped[status]?.map((app) => (
                    <div key={app.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/20 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-medium text-ink text-sm">{app.vacancy_title}</h4>
                          {isEmployer ? (
                            <Link to={`/specialists/${app.user_id}`} className="text-xs text-ink-3 mt-0.5 hover:text-ink hover:underline">
                              {app.specialist_name}
                            </Link>
                          ) : (
                            <p className="text-xs text-ink-3 mt-0.5">{app.company}</p>
                          )}
                          {isEmployer && app.specialist_category && (
                            <p className="text-[10px] text-ink-3 mt-0.5">{app.specialist_category}</p>
                          )}
                        </div>
                        {!isEmployer && <MatchIndicator percent={app.match_percent} size="sm" />}
                      </div>
                      {isEmployer && (
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {app.resume_url && (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-medium"
                            >
                              <Paperclip className="w-3 h-3" /> CV ko'rish
                            </a>
                          )}
                          <button onClick={() => contactSpecialist(app.user_id)} disabled={contactingId === app.user_id}
                            className="inline-flex items-center gap-1 text-[11px] text-ink-2 hover:text-ink font-medium disabled:opacity-50">
                            <MessageSquare className="w-3 h-3" /> Bog'lanish
                          </button>
                          {app.specialist_phone && <span className="text-[11px] text-ink-3">{app.specialist_phone}</span>}
                          {app.specialist_telegram && <span className="text-[11px] text-ink-3">@{app.specialist_telegram.replace(/^@/, "")}</span>}
                          {(app.screening_answers?.length > 0 || app.cover_letter) && (
                            <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-ink-2 hover:text-ink font-medium">
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === app.id ? "rotate-180" : ""}`} /> Batafsil
                            </button>
                          )}
                        </div>
                      )}
                      {isEmployer && expandedId === app.id && (app.screening_answers?.length > 0 || app.cover_letter) && (
                        <div className="space-y-2 mb-3 bg-surface rounded-lg p-3">
                          {!!app.cover_letter && (
                            <div>
                              <div className="text-[11px] font-medium text-ink-3">Xat</div>
                              <div className="text-xs text-ink-2 mt-0.5">{app.cover_letter}</div>
                            </div>
                          )}
                          {app.screening_answers?.map((qa, i) => (
                            <div key={i}>
                              <div className="text-[11px] font-medium text-ink-3">{qa.question}</div>
                              <div className="text-xs text-ink-2 mt-0.5">{qa.answer || "Javob berilmagan"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(app.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          {isEmployer && status !== "Qabul qilindi" && status !== "Rad etildi" && (
                            <>
                              <button onClick={() => updateStatus(app.id, "Interview")} disabled={updatingId === app.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                title="Intervyuga taklif qilish">
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateStatus(app.id, "Qabul qilindi")} disabled={updatingId === app.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                                title="Qabul qilish">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateStatus(app.id, "Rad etildi")} disabled={updatingId === app.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Rad etish">
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!isEmployer && (status === "Yuborildi" || status === "Ko'rib chiqilmoqda") && (
                            <button onClick={() => withdrawApp(app.id)} disabled={updatingId === app.id}
                              className="text-[10px] text-red-500 hover:text-red-600 font-medium disabled:opacity-50 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                              Qaytarish
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!grouped[status] || grouped[status].length === 0) && (
                    <div className="bg-surface rounded-xl border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-ink-3">Bo'sh</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Vakansiya</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">{isEmployer ? "Mutaxassis" : "Kompaniya"}</th>
                  {!isEmployer && <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Moslik</th>}
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Sana</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Holat</th>
                  {isEmployer && <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-ink-2" />
                        </div>
                        <span className="font-medium text-ink text-sm block">{app.vacancy_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-3">
                      {isEmployer ? (
                        <Link to={`/specialists/${app.user_id}`} className="hover:text-ink hover:underline">{app.specialist_name}</Link>
                      ) : app.company}
                      {isEmployer && (
                        <div className="flex items-center gap-3 mt-0.5">
                          {app.resume_url && (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] text-accent hover:underline font-medium"
                            >
                              <Paperclip className="w-3 h-3" /> CV
                            </a>
                          )}
                          <button onClick={() => contactSpecialist(app.user_id)} disabled={contactingId === app.user_id}
                            className="flex items-center gap-1 text-[11px] text-ink-2 hover:text-ink font-medium disabled:opacity-50">
                            <MessageSquare className="w-3 h-3" /> Bog'lanish
                          </button>
                        </div>
                      )}
                    </td>
                    {!isEmployer && (
                      <td className="px-6 py-4"><MatchIndicator percent={app.match_percent} size="sm" /></td>
                    )}
                    <td className="px-6 py-4 text-sm text-ink-3">{timeAgo(app.created_at)}</td>
                    <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                    {isEmployer && (
                      <td className="px-6 py-4">
                        {app.status !== "Qabul qilindi" && app.status !== "Rad etildi" && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateStatus(app.id, "Interview")} disabled={updatingId === app.id}
                              className="px-2 py-1 text-[10px] font-medium bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors disabled:opacity-50">
                              Intervyu
                            </button>
                            <button onClick={() => updateStatus(app.id, "Qabul qilindi")} disabled={updatingId === app.id}
                              className="px-2 py-1 text-[10px] font-medium bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50">
                              Qabul qilish
                            </button>
                            <button onClick={() => updateStatus(app.id, "Rad etildi")} disabled={updatingId === app.id}
                              className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors disabled:opacity-50">
                              Rad etish
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
