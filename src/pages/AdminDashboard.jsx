import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Briefcase, ClipboardList, Package, Target, Plus, CalendarDays } from "lucide-react";
import { api, downloadFile } from "../lib/api";
import { formatDate } from "../lib/format";
import StatCard from "../components/admin/StatCard";
import ChartCard from "../components/admin/ChartCard";
import DonutChart from "../components/admin/DonutChart";
import ProgressBarList from "../components/admin/ProgressBarList";
import FilterPills from "../components/admin/FilterPills";
import SearchInput from "../components/admin/SearchInput";
import AdminHeader from "../components/admin/AdminHeader";
import VacancyTable from "../components/admin/VacancyTable";
import EmptyState from "../components/ui/EmptyState";
import { useVacancyModeration } from "../hooks/useVacancyModeration";
import { useAdminRealtime } from "../hooks/useAdminRealtime";
import { useT } from "../context/I18nContext";

const directionColors = ["#6366F1", "#3730A3", "#15803D", "#B45309", "#B91C1C", "#0891B2", "#9333EA", "#64748B"];
const statusColors = {
  "Yuborildi": "#C7C7CE",
  "Ko'rib chiqilmoqda": "#6366F1",
  "Interview": "#0A0A0B",
  "Qabul qilindi": "#15803D",
  "Rad etildi": "#B91C1C",
};

const PAGE_SIZE = 8;

function MiniCalendar({ dates }) {
  const { t } = useT();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const markedDays = new Set(dates.filter((d) => d.slice(0, 7) === now.toISOString().slice(0, 7)).map((d) => Number(d.slice(8, 10))));
  const todayNum = now.getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekdayKeys.map((d) => (
          <span key={d} className="text-[10px] font-medium text-ink-3">{t(`pages.adminDashboard.weekday.${d}`)}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d && (
              <span
                className={`w-full h-full flex items-center justify-center rounded-md text-[11px] ${
                  d === todayNum
                    ? "bg-ink text-white font-semibold"
                    : markedDays.has(d)
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-ink-2"
                }`}
              >
                {d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useT();
  const monthNames = [
    t("pages.adminDashboard.months.jan"), t("pages.adminDashboard.months.feb"), t("pages.adminDashboard.months.mar"),
    t("pages.adminDashboard.months.apr"), t("pages.adminDashboard.months.may"), t("pages.adminDashboard.months.jun"),
    t("pages.adminDashboard.months.jul"), t("pages.adminDashboard.months.aug"), t("pages.adminDashboard.months.sep"),
    t("pages.adminDashboard.months.oct"), t("pages.adminDashboard.months.nov"), t("pages.adminDashboard.months.dec"),
  ];
  const VACANCY_FILTERS = [
    { value: "", label: t("common.all") },
    { value: "Faol", label: t("status.Faol") },
    { value: "Kutilmoqda", label: t("status.Kutilmoqda") },
    { value: "Tuzatish kerak", label: t("status.Tuzatish kerak") },
    { value: "Arxivlangan", label: t("pages.adminDashboard.filterClosed") },
  ];
  const [stats, setStats] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [pending, setPending] = useState({ vacancies: [], flags: [], verification: [], disputes: [], support: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [vacSearch, setVacSearch] = useState("");
  const [vacStatus, setVacStatus] = useState("");
  const [vacPage, setVacPage] = useState(1);
  const [verifBusyId, setVerifBusyId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const [statsData, vacData, flagsData, verifData, disputesData, supportData, pendingVacData] = await Promise.all([
        api("/admin/stats"),
        api("/admin/vacancies"),
        api("/admin/flags?status=" + encodeURIComponent("Ko'rib chiqilmoqda")).catch(() => ({ flags: [] })),
        api("/admin/verification?status=Kutilmoqda").catch(() => ({ requests: [] })),
        api("/admin/disputes?status=Ochiq").catch(() => ({ disputes: [] })),
        api("/admin/support?status=Ochiq").catch(() => ({ tickets: [] })),
        api("/admin/vacancies?status=Kutilmoqda").catch(() => ({ vacancies: [] })),
      ]);
      setStats(statsData);
      setVacancies(vacData.vacancies || []);
      setPending({
        vacancies: pendingVacData.vacancies || [],
        flags: flagsData.flags || [],
        verification: verifData.requests || [],
        disputes: disputesData.disputes || [],
        support: supportData.tickets || [],
      });
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useAdminRealtime(load);

  const filteredVacancies = useMemo(() => {
    let list = vacancies;
    if (vacStatus) list = list.filter((v) => v.status === vacStatus);
    if (vacSearch.trim()) {
      const q = vacSearch.trim().toLowerCase();
      list = list.filter((v) => v.title?.toLowerCase().includes(q) || v.company?.toLowerCase().includes(q));
    }
    return list;
  }, [vacancies, vacStatus, vacSearch]);

  const pagedVacancies = filteredVacancies.slice((vacPage - 1) * PAGE_SIZE, vacPage * PAGE_SIZE);

  const { busyId, approve: approveVacancy, reject: rejectVacancy, remove: deleteVacancy } = useVacancyModeration(load);

  const approveVerification = async (id) => {
    setVerifBusyId(id);
    try {
      await api(`/admin/verification/${id}`, { method: "PATCH", body: { status: "Tasdiqlangan" } });
      await load();
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setVerifBusyId(null);
    }
  };

  const runExport = async () => {
    setExporting(true);
    try {
      await downloadFile("/admin/export/vacancies", "vakansiyalar.csv");
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-8 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  const kpis = [
    { label: t("pages.adminDashboard.kpiTotalUsers"), value: stats.users_total, icon: Users, color: "bg-accent-soft text-accent", trendPct: stats.trend?.users_total?.pct },
    { label: t("pages.adminDashboard.kpiActiveVacancies"), value: stats.vacancies_active, icon: Briefcase, color: "bg-success-soft text-success", trendPct: stats.trend?.vacancies_active?.pct },
    { label: t("pages.adminDashboard.kpiTotalApplications"), value: stats.applications_total, icon: ClipboardList, color: "bg-[#FEF3C7] text-[#B45309]", trendPct: stats.trend?.applications_total?.pct },
    { label: t("pages.adminDashboard.kpiActiveOrders"), value: stats.orders_active, icon: Package, color: "bg-surface text-ink" },
    { label: t("pages.adminDashboard.kpiAvgMatch"), value: `${stats.avg_match_percent}%`, icon: Target, color: "bg-accent-soft text-accent" },
  ];

  const monthlyData = (stats.monthly_activity || []).map((m) => ({
    month: monthNames[Number(m.month.slice(5, 7)) - 1],
    applications: m.applications,
    vacancies: m.vacancies,
  }));

  const directionData = (stats.top_directions || []).map((d, i) => ({ name: d.name, value: d.count, color: directionColors[i % directionColors.length] }));

  const statusData = (stats.application_status_breakdown || []).map((s) => ({ name: t(`status.${s.status}`), count: s.count, color: statusColors[s.status] || "#8A8A93" }));

  const pendingItems = [
    ...pending.vacancies.map((v) => ({ id: `vac${v.id}`, rawId: v.id, type: "vacancy", title: v.title, subtitle: v.company, badge: t("pages.adminDashboard.badgeVacancy") })),
    ...pending.verification.map((v) => ({ id: `verif${v.id}`, rawId: v.id, type: "verification", title: v.user_name, subtitle: t("pages.adminDashboard.subtitleVerificationRequest"), badge: t("pages.adminDashboard.badgeVerification") })),
    ...pending.flags.map((f) => ({ id: `flag${f.id}`, rawId: f.id, type: "flag", title: f.reason || t("pages.adminDashboard.flagFallbackTitle"), subtitle: f.target_type, badge: t("pages.adminDashboard.badgeFlag") })),
    ...pending.disputes.map((d) => ({ id: `disp${d.id}`, rawId: d.id, type: "dispute", title: d.title || t("pages.adminDashboard.orderFallbackTitle", { id: d.order_id }), subtitle: t("pages.adminDashboard.badgeDispute"), badge: t("pages.adminDashboard.badgeDispute") })),
    ...pending.support.map((s) => ({ id: `sup${s.id}`, rawId: s.id, type: "support", title: s.subject, subtitle: t("pages.adminDashboard.subtitleSupportRequest"), badge: t("admin.support") })),
  ].slice(0, 8);

  return (
    <div>
      <AdminHeader title={t("nav.dashboard")} search={vacSearch} onExport={runExport} exporting={exporting} />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((k) => <StatCard key={k.label} {...k} />)}
        </div>

        {/* Analytics row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <ChartCard title={t("pages.adminDashboard.chartMonthlyActivityTitle")} subtitle={t("pages.adminDashboard.chartMonthlyActivitySubtitle")} className="lg:col-span-1">
            {monthlyData.every((m) => m.applications === 0 && m.vacancies === 0) ? (
              <EmptyState icon="📅" title={t("pages.adminDashboard.emptyDataTitle")} description={t("pages.adminDashboard.emptyActivityDescription")} />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="applications" name={t("pages.adminDashboard.chartApplications")} fill="#6366F1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="vacancies" name={t("pages.adminDashboard.chartVacancies")} fill="#3730A3" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title={t("pages.adminDashboard.chartDirectionsTitle")} subtitle={t("pages.adminDashboard.chartDirectionsSubtitle")}>
            <DonutChart data={directionData} />
          </ChartCard>

          <ChartCard title={t("pages.adminDashboard.chartStatusTitle")} subtitle={t("pages.adminDashboard.chartStatusSubtitle")}>
            <ProgressBarList items={statusData} emptyTitle={t("pages.adminDashboard.emptyApplicationsTitle")} />
          </ChartCard>
        </div>

        {/* Vacancy management table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-5 border-b border-border-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-semibold text-ink text-sm">{t("pages.adminDashboard.vacancyManagement")}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput value={vacSearch} onChange={(v) => { setVacSearch(v); setVacPage(1); }} placeholder={t("pages.adminDashboard.searchVacancyPlaceholder")} className="w-52" />
              <Link to="/admin/vacancies" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink text-white text-xs font-medium hover:bg-ink/90 transition-colors whitespace-nowrap">
                <Plus className="w-3.5 h-3.5" /> {t("common.seeAll")}
              </Link>
            </div>
          </div>
          <div className="px-5 pt-4">
            <FilterPills options={VACANCY_FILTERS} value={vacStatus} onChange={(v) => { setVacStatus(v); setVacPage(1); }} />
          </div>

          <VacancyTable
            vacancies={pagedVacancies}
            page={vacPage}
            pageSize={PAGE_SIZE}
            total={filteredVacancies.length}
            onPageChange={setVacPage}
            onApprove={approveVacancy}
            onReject={rejectVacancy}
            onDelete={deleteVacancy}
            busyId={busyId}
          />
        </div>

        {/* Lower two-column block */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h2 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-ink-3" /> {t("pages.adminDashboard.upcomingDatesTitle")}
            </h2>
            {(stats.upcoming || []).length === 0 ? (
              <EmptyState icon="🗓️" title={t("pages.adminDashboard.emptyDataTitle")} description={t("pages.adminDashboard.emptyUpcomingDescription")} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <MiniCalendar dates={stats.upcoming.map((u) => u.date)} />
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {stats.upcoming.map((u) => (
                    <div key={`${u.type}-${u.id}`} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex flex-col items-center justify-center flex-shrink-0 text-[10px] font-semibold leading-none">
                        <span>{new Date(u.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink truncate">{u.title}</p>
                        <p className="text-[11px] text-ink-3 truncate">{u.subtitle} · {formatDate(u.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">{t("pages.adminDashboard.pendingApprovalsTitle")}</h2>
            {pendingItems.length === 0 ? (
              <EmptyState icon="✅" title={t("pages.adminDashboard.emptyPendingTitle")} description={t("pages.adminDashboard.emptyPendingDescription")} />
            ) : (
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-border-soft last:border-0">
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface text-ink-3 mb-0.5">{item.badge}</span>
                      <p className="text-xs font-medium text-ink line-clamp-2">{item.title}</p>
                      <p className="text-[11px] text-ink-3 truncate">{item.subtitle}</p>
                    </div>
                    {item.type === "vacancy" && (
                      <button onClick={() => approveVacancy(item.rawId)} disabled={busyId === item.rawId} className="flex-shrink-0 text-xs font-medium text-accent hover:underline whitespace-nowrap">
                        {t("common.approve")}
                      </button>
                    )}
                    {item.type === "verification" && (
                      <button onClick={() => approveVerification(item.rawId)} disabled={verifBusyId === item.rawId} className="flex-shrink-0 text-xs font-medium text-accent hover:underline whitespace-nowrap">
                        {t("common.approve")}
                      </button>
                    )}
                    {(item.type === "flag" || item.type === "dispute" || item.type === "support") && (
                      <Link
                        to={item.type === "flag" ? "/admin/moderation" : item.type === "dispute" ? "/admin/disputes" : "/admin/support"}
                        className="flex-shrink-0 text-xs font-medium text-accent hover:underline whitespace-nowrap"
                      >
                        {t("common.view")}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
