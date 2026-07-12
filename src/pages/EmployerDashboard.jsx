import { Link } from "react-router-dom";
import { Briefcase, Users, Eye, TrendingUp, Plus, ArrowUpRight } from "lucide-react";
import { employerApplications, vacancies } from "../data/mockData";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

export default function EmployerDashboard() {
  const statsCards = [
    { label: "Faol vakansiyalar", value: "5", change: "+2", icon: Briefcase },
    { label: "Kelgan arizalar", value: "24", change: "+8", icon: Users },
    { label: "Profil ko'rishlar", value: "156", change: "+23", icon: Eye },
    { label: "Intervyular", value: "6", change: "+1", icon: TrendingUp },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">Ish beruvchi dashboardi</h1>
          <p className="text-ink-3 text-sm mt-1">TexnoLabs kompaniyasi</p>
        </div>
        <Link
          to="/vacancies"
          className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Vakansiya e'lon qilish
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-4 h-4 text-ink-3" strokeWidth={1.75} />
              <span className="text-xs font-medium text-success bg-success-soft px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {stat.change}
              </span>
            </div>
            <div className="text-2xl font-semibold text-ink tracking-tight">{stat.value}</div>
            <div className="text-sm text-ink-3 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent applications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink text-sm">So'nggi arizalar</h2>
            <Link to="/applications" className="text-sm text-ink-3 hover:text-ink font-medium transition-colors">Barchasini ko'rish</Link>
          </div>
          <div className="space-y-1">
            {employerApplications.slice(0, 4).map((app) => (
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

        {/* Active vacancies */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="font-semibold text-ink text-sm mb-5">Faol vakansiyalar</h2>
          <div className="space-y-1">
            {vacancies.slice(0, 4).map((v) => (
              <Link
                key={v.id}
                to={`/vacancies/${v.id}`}
                className="block p-3 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="font-medium text-ink text-sm">{v.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-ink-3">{v.location}</span>
                  <span className="text-xs text-ink-3">·</span>
                  <span className="text-xs text-ink-3">{v.salary}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
