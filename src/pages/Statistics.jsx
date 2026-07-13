import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Send, Award, TrendingUp, Briefcase } from "lucide-react";
import { api } from "../lib/api";

const statusColors = {
  "Yuborildi": "#C7C7CE",
  "Ko'rib chiqilmoqda": "#3730A3",
  "Interview": "#0A0A0B",
  "Qabul qilindi": "#15803D",
  "Rad etildi": "#B91C1C",
};

const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

export default function Statistics() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  const total = applications.length;
  const interview = applications.filter((a) => a.status === "Interview").length;
  const accepted = applications.filter((a) => a.status === "Qabul qilindi").length;
  const responseRate = total > 0 ? Math.round(((interview + accepted) / total) * 100) : 0;
  const avgMatch = total > 0 ? Math.round(applications.reduce((s, a) => s + a.match_percent, 0) / total) : 0;

  const statusCounts = {};
  for (const a of applications) statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value, color: statusColors[name] || "#8A8A93" }));

  const monthCounts = new Array(12).fill(0);
  for (const a of applications) {
    monthCounts[new Date(a.created_at + "Z").getMonth()] += 1;
  }
  const applicationsData = monthNames.map((month, i) => ({ month, count: monthCounts[i] }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Statistika</h1>
        <p className="text-ink-3 text-sm">Arizalaringiz bo'yicha ko'rsatkichlar</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami arizalar", value: total, icon: Send },
          { label: "Intervyu takliflari", value: interview, icon: TrendingUp },
          { label: "Qabul qilindi", value: accepted, icon: Award },
          { label: "O'rtacha moslik", value: `${avgMatch}%`, icon: Briefcase },
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
          <p className="text-ink-3 text-sm">Statistikani ko'rish uchun avval vakansiyalarga ariza yuboring</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Applications by month */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-6">Yuborilgan arizalar (oylik)</h2>
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
            <h2 className="font-semibold text-ink text-sm mb-6">Ariza holatlari</h2>
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
            <h2 className="font-semibold text-ink text-sm mb-6">Javob olish darajasi</h2>
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
              <p className="text-sm text-ink-3">Intervyu yoki qabulga o'tgan arizalar ulushi</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
