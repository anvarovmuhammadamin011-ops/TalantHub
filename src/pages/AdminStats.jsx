import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Briefcase, Eye, ClipboardList, TrendingUp, Download } from "lucide-react";
import { api, downloadFile } from "../lib/api";

const EXPORTS = [
  { path: "/admin/export/users", filename: "users.csv", label: "Foydalanuvchilar" },
  { path: "/admin/export/vacancies", filename: "vacancies.csv", label: "Vakansiyalar" },
  { path: "/admin/export/applications", filename: "applications.csv", label: "Arizalar" },
  { path: "/admin/export/transactions", filename: "transactions.csv", label: "Tranzaksiyalar" },
];

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingPath, setExportingPath] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = await api("/admin/stats");
      setStats(data);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runExport = async (exp) => {
    setExportingPath(exp.path);
    try {
      await downloadFile(exp.path, exp.filename);
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setExportingPath("");
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">Qayta urinish</button></div>
      </div>
    );
  }

  const cards = [
    { label: "Jami foydalanuvchilar", value: stats.users_total, icon: Users, color: "bg-accent-soft text-accent" },
    { label: "Jami vakansiyalar", value: stats.vacancies_total, icon: Briefcase, color: "bg-surface text-ink" },
    { label: "Faol vakansiyalar", value: stats.vacancies_active, icon: Eye, color: "bg-success-soft text-success" },
    { label: "Jami arizalar", value: stats.applications_total, icon: ClipboardList, color: "bg-[#FEF3C7] text-[#B45309]" },
    { label: "Konversiya (ariza → yollash)", value: `${stats.conversion?.rate ?? 0}%`, icon: TrendingUp, color: "bg-accent-soft text-accent" },
  ];

  const maxDirectionCount = Math.max(1, ...(stats.top_directions || []).map((d) => d.count));
  const maxCityCount = Math.max(1, ...(stats.users_by_city || []).map((c) => c.count));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">Statistika</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-2xl font-semibold text-ink">{c.value}</div>
            <div className="text-xs text-ink-3 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-ink text-sm mb-4">Oxirgi 30 kunda yangi vakansiyalar</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.vacancies_30d_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickFormatter={(d) => d.slice(5)} interval={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-semibold text-ink text-sm mb-4">Top yo'nalishlar</h2>
          {(stats.top_directions || []).length === 0 ? (
            <p className="text-sm text-ink-3">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {stats.top_directions.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-2 font-medium">{d.name}</span>
                    <span className="text-ink-3">{d.count}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(d.count / maxDirectionCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-semibold text-ink text-sm mb-4">Viloyatlar bo'yicha taqsimot</h2>
          {(stats.users_by_city || []).length === 0 ? (
            <p className="text-sm text-ink-3">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2.5">
              {stats.users_by_city.map((c) => (
                <div key={c.city}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-2 font-medium">{c.city}</span>
                    <span className="text-ink-3">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(c.count / maxCityCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-ink text-sm mb-1">Eksport</h2>
        <p className="text-xs text-ink-3 mb-4">Ma'lumotlarni CSV formatida yuklab oling (Excel'da ochish mumkin).</p>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((exp) => (
            <button key={exp.path} onClick={() => runExport(exp)} disabled={exportingPath === exp.path}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-ink-2 hover:bg-surface transition-colors disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />
              {exportingPath === exp.path ? "Yuklanmoqda..." : exp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
