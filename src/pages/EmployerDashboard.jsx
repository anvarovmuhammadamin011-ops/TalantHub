import { Link } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Users, Eye, TrendingUp, Plus, ArrowUpRight, Clock, MessageSquare } from "lucide-react";
import { employerApplications, vacancies } from "../data/mockData";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

const viewsData = [
  { day: "Dush", views: 12 }, { day: "Sesh", views: 19 }, { day: "Chor", views: 15 },
  { day: "Pay", views: 28 }, { day: "Jum", views: 22 }, { day: "Shan", views: 35 }, { day: "Yak", views: 18 },
];
const appData = [
  { day: "Dush", count: 3 }, { day: "Sesh", count: 5 }, { day: "Chor", count: 2 },
  { day: "Pay", count: 8 }, { day: "Jum", count: 4 }, { day: "Shan", count: 6 }, { day: "Yak", count: 1 },
];

export default function EmployerDashboard() {
  const statsCards = [
    { label: "Faol vakansiyalar", value: "5", change: "+2", icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Kelgan arizalar", value: "24", change: "+8", icon: Users, color: "text-accent", bg: "bg-accent-soft" },
    { label: "Profil ko'rishlar", value: "156", change: "+23", icon: Eye, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Intervyular", value: "6", change: "+1", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">Dashboard</h1>
          <p className="text-ink-3 text-sm mt-1">TexnoLabs kompaniyasi boshqaruvi</p>
        </div>
        <Link to="/vacancies" className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Vakansiya e'lon qilish
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={1.75} />
              </div>
              <span className="text-xs font-medium text-success bg-success-soft px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {stat.change}
              </span>
            </div>
            <div className="text-2xl font-semibold text-ink tracking-tight">{stat.value}</div>
            <div className="text-sm text-ink-3 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-ink text-sm mb-4">Ko'rishlar (haftalik)</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData}>
                <defs><linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1E40AF" stopOpacity={0.1} /><stop offset="95%" stopColor="#1E40AF" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Area type="monotone" dataKey="views" stroke="#1E40AF" strokeWidth={2} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-ink text-sm mb-4">Arizalar (haftalik)</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-ink text-sm mb-4">Tezkor harakatlar</h3>
          <div className="space-y-2">
            {[
              { label: "Yangi arizalar (3 ta yangi)", icon: MessageSquare, color: "text-primary" },
              { label: "Intervyu rejalashtirilgan (2 ta)", icon: Clock, color: "text-amber-600" },
              { label: "Yangi profillar (12 ta)", icon: Users, color: "text-accent" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-border/50 transition-colors cursor-pointer">
                <item.icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.75} />
                <span className="text-sm text-ink-2">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink text-sm">So'nggi arizalar</h2>
            <Link to="/applications" className="text-sm text-ink-3 hover:text-ink font-medium transition-colors">Barchasini ko'rish</Link>
          </div>
          <div className="space-y-1">
            {employerApplications.map((app) => (
              <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface transition-colors">
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-sm font-medium text-ink-2">
                  {app.specialist.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink text-sm">{app.specialist}</div>
                  <div className="text-xs text-ink-3">{app.role}</div>
                </div>
                <MatchIndicator percent={app.matchPercent} size="sm" />
                <StatusBadge status={app.status} />
                <span className="text-xs text-ink-3 hidden sm:block">{app.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-ink text-sm mb-5">Faol vakansiyalar</h2>
          <div className="space-y-2">
            {vacancies.slice(0, 5).map((v) => (
              <Link key={v.id} to={`/vacancies/${v.id}`} className="block p-3 rounded-lg hover:bg-surface transition-colors">
                <div className="font-medium text-ink text-sm">{v.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-ink-3">{v.location}</span>
                  <span className="text-xs text-ink-3">·</span>
                  <span className="text-xs text-ink-3">{v.salary.split(" - ")[0]}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
