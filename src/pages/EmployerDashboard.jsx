import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Users, Package, TrendingUp, Plus, Clock, MessageSquare, Trash2, Edit3, Eye, EyeOff, Copy, Archive } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";
import VerificationPanel from "../components/ui/VerificationPanel";

const weekdays = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function groupByWeekday(items) {
  const counts = new Array(7).fill(0);
  const now = Date.now();
  for (const item of items) {
    const t = new Date(item.created_at + "Z").getTime();
    if (now - t > 7 * 86400000) continue;
    counts[new Date(item.created_at + "Z").getDay()] += 1;
  }
  return weekdays.map((day, i) => ({ day, count: counts[i] }));
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [vacTab, setVacTab] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [vacData, appData, orderData] = await Promise.all([
          api("/vacancies/mine"),
          api("/applications/employer"),
          api("/orders"),
        ]);
        setVacancies(vacData.vacancies);
        setApplications(appData.applications);
        setOrders(orderData.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const deleteVacancy = async (id) => {
    if (!confirm("Vakansiyani o'chirishni xohlaysizmi?")) return;
    setDeletingId(id);
    try {
      await api(`/vacancies/${id}`, { method: "DELETE" });
      setVacancies((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleVacancyStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Faol" ? "Nofaol" : "Faol";
    try {
      await api(`/vacancies/${id}`, { method: "PATCH", body: { status: newStatus } });
      setVacancies((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v));
    } catch (err) {
      console.error(err);
    }
  };

  const archiveVacancy = async (id) => {
    if (!confirm("Vakansiyani arxivlashni xohlaysizmi? Bu qaytarib bo'lmaydi.")) return;
    try {
      await api(`/vacancies/${id}`, { method: "PATCH", body: { status: "Arxivlangan" } });
      setVacancies((prev) => prev.map((v) => v.id === id ? { ...v, status: "Arxivlangan" } : v));
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateVacancy = async (id) => {
    try {
      const { vacancy } = await api(`/vacancies/${id}/duplicate`, { method: "POST" });
      setVacancies((prev) => [vacancy, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  const interviewCount = applications.filter((a) => a.status === "Interview").length;
  const activeOrders = orders.filter((o) => o.status === "Jarayonda" || o.status === "Qabul qilindi").length;

  const statsCards = [
    { label: "Faol vakansiyalar", value: vacancies.length, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Kelgan arizalar", value: applications.length, icon: Users, color: "text-accent", bg: "bg-accent-soft" },
    { label: "Faol buyurtmalar", value: activeOrders, icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Intervyular", value: interviewCount, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const applicationsChartData = groupByWeekday(applications);
  const recentApplications = applications.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">Dashboard</h1>
          <p className="text-ink-3 text-sm mt-1">{user?.name} boshqaruvi</p>
        </div>
        <Link to="/vacancies/new" className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Yangi vakansiya
        </Link>
      </div>

      <div className="max-w-md mb-6">
        <VerificationPanel />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.75} />
              </div>
            </div>
            <div className="text-2xl font-semibold text-ink tracking-tight">{stat.value}</div>
            <div className="text-sm text-ink-3 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-ink text-sm mb-4">Arizalar (so'nggi 7 kun)</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-ink text-sm mb-4">Tezkor harakatlar</h3>
          <div className="space-y-2">
            <Link to="/applications" className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-border/50 transition-colors">
              <MessageSquare className="w-4 h-4 text-primary" strokeWidth={1.75} />
              <span className="text-sm text-ink-2">{applications.length} ta ariza</span>
            </Link>
            <Link to="/applications" className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-border/50 transition-colors">
              <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
              <span className="text-sm text-ink-2">{interviewCount} ta intervyu</span>
            </Link>
            <Link to="/orders" className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-border/50 transition-colors">
              <Package className="w-4 h-4 text-accent" strokeWidth={1.75} />
              <span className="text-sm text-ink-2">{activeOrders} ta faol buyurtma</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink text-sm">So'nggi arizalar</h2>
            <Link to="/applications" className="text-sm text-ink-3 hover:text-ink font-medium transition-colors">Barchasini ko'rish</Link>
          </div>
          {recentApplications.length === 0 ? (
            <p className="text-sm text-ink-3 text-center py-8">Hozircha arizalar yo'q</p>
          ) : (
            <div className="space-y-1">
              {recentApplications.map((app) => (
                <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface transition-colors">
                  <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-sm font-medium text-ink-2">
                    {app.specialist_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink text-sm">{app.specialist_name}</div>
                    <div className="text-xs text-ink-3">{app.specialist_category}</div>
                  </div>
                  <MatchIndicator percent={app.match_percent} size="sm" />
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink text-sm">Vakansiyalarim</h2>
            <Link to="/vacancies/new" className="text-xs text-ink font-medium hover:text-accent transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Yangi
            </Link>
          </div>
          {vacancies.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-ink-3 mb-3">Hali vakansiya yo'q</p>
              <Link to="/vacancies/new" className="text-sm text-ink font-medium hover:underline">Vakansiya yaratish</Link>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                {["", ...new Set(vacancies.map((v) => v.status || "Faol"))].map((s) => (
                  <button key={s || "all"} onClick={() => setVacTab(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      vacTab === s ? "bg-accent text-white" : "bg-surface text-ink-2 hover:bg-border-soft"
                    }`}>{s || "Barchasi"}</button>
                ))}
              </div>
              <div className="space-y-2">
              {vacancies.filter((v) => !vacTab || (v.status || "Faol") === vacTab).map((v) => (
                <div key={v.id} className="p-3 rounded-lg hover:bg-surface transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/vacancies/${v.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-ink text-sm truncate">{v.title}</div>
                        <StatusBadge status={v.status || "Faol"} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-ink-3">{v.location}</span>
                        <span className="text-xs text-ink-3">·</span>
                        <span className="text-xs text-ink-3">{v.applications_count} ta ariza</span>
                        <span className="text-xs text-ink-3">·</span>
                        <span className="text-xs text-ink-3">{v.views || 0} ko'rish</span>
                      </div>
                      {v.status === "Tuzatish kerak" && v.reject_reason && (
                        <div className="text-xs text-red-500 mt-1">Sabab: {v.reject_reason}</div>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/vacancies/${v.id}/applicants`}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface transition-colors"
                        title="Arizalar">
                        <Users className="w-3.5 h-3.5" />
                      </Link>
                      <Link to={`/vacancies/${v.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface transition-colors"
                        title="Tahrirlash">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => duplicateVacancy(v.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface transition-colors"
                        title="Nusxalash">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {(v.status === "Faol" || v.status === "Nofaol") && (
                        <button onClick={() => toggleVacancyStatus(v.id, v.status || "Faol")}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface transition-colors"
                          title={v.status === "Nofaol" ? "Faollashtirish" : "To'xtatish"}>
                          {v.status === "Nofaol" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {(v.status === "Faol" || v.status === "Nofaol") && (
                        <button onClick={() => archiveVacancy(v.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface transition-colors"
                          title="Arxivlash">
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteVacancy(v.id)} disabled={deletingId === v.id}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="O'chirish">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
