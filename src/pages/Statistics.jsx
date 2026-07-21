import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Send, Award, TrendingUp, Briefcase } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useT } from "../context/I18nContext";

const statusColors = {
  "Yuborildi": "#C7C7CE",
  "Ko'rib chiqilmoqda": "#3730A3",
  "Interview": "#0A0A0B",
  "Qabul qilindi": "#15803D",
  "Rad etildi": "#B91C1C",
};

export default function Statistics() {
  const { user } = useAuth();
  const { t } = useT();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const monthNames = [
    t("pages.statistics.monthJan"), t("pages.statistics.monthFeb"), t("pages.statistics.monthMar"),
    t("pages.statistics.monthApr"), t("pages.statistics.monthMay"), t("pages.statistics.monthJun"),
    t("pages.statistics.monthJul"), t("pages.statistics.monthAug"), t("pages.statistics.monthSep"),
    t("pages.statistics.monthOct"), t("pages.statistics.monthNov"), t("pages.statistics.monthDec"),
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/applications");
        setApplications(data.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // This page reads GET /applications, which returns the current user's own submitted
  // applications — meaningless for an employer (they don't submit applications). There's no
  // nav link here for employers, but the route itself is reachable directly by URL.
  if (user?.role === "employer") {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  const total = applications.length;
  const interview = applications.filter((a) => a.status === "Interview").length;
  const accepted = applications.filter((a) => a.status === "Qabul qilindi").length;
  const responseRate = total > 0 ? Math.round(((interview + accepted) / total) * 100) : 0;
  const avgMatch = total > 0 ? Math.round(applications.reduce((s, a) => s + a.match_percent, 0) / total) : 0;

  const statusCounts = {};
  for (const a of applications) statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: t(`status.${name}`), value, color: statusColors[name] || "#8A8A93" }));

  // Last 12 real calendar months in chronological order (not a fixed Jan-Dec bucket) so
  // applications from different years don't collapse into the same month slot.
  const now = new Date();
  const monthKeys = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthCounts = {};
  for (const a of applications) {
    const d = new Date(a.created_at + "Z");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  }
  const applicationsData = monthKeys.map((key) => ({
    month: monthNames[Number(key.slice(5, 7)) - 1],
    count: monthCounts[key] || 0,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">{t("nav.statistics")}</h1>
        <p className="text-ink-3 text-sm">{t("pages.statistics.subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("pages.statistics.totalApplications"), value: total, icon: Send },
          { label: t("pages.statistics.interviewOffers"), value: interview, icon: TrendingUp },
          { label: t("status.Qabul qilindi"), value: accepted, icon: Award },
          { label: t("pages.statistics.avgMatch"), value: `${avgMatch}%`, icon: Briefcase },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5">
            <stat.icon className="w-4 h-4 text-ink-3 mb-4" strokeWidth={1.75} />
            <div className="text-2xl font-semibold text-ink tracking-tight">{stat.value}</div>
            <div className="text-sm text-ink-3 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <p className="text-ink-3 text-sm">{t("pages.statistics.emptyState")}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Applications by month */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-6">{t("pages.statistics.applicationsByMonth")}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicationsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7E7EA", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="count" fill="#3730A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status pie chart */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-6">{t("pages.statistics.applicationStatuses")}</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-ink-2">{s.name}</span>
                  <span className="font-medium text-ink">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Response rate */}
          <div className="bg-white rounded-xl border border-border p-6 lg:col-span-2">
            <h2 className="font-semibold text-ink text-sm mb-6">{t("pages.statistics.responseRateTitle")}</h2>
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F0F1" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#3730A3" strokeWidth="8"
                    strokeDasharray="314" strokeDashoffset={314 - (314 * responseRate) / 100} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-semibold text-ink">{responseRate}%</span>
                </div>
              </div>
              <p className="text-sm text-ink-3">{t("pages.statistics.responseRateDesc")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
