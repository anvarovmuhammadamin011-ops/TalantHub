import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock, ChevronRight, Award, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const statusOrder = ["Yuborildi", "Ko'rib chiqilmoqda", "Interview", "Qabul qilindi", "Rad etildi"];

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/applications");
        setApplications(data.applications);
        setStats(data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = applications.filter((a) => a.status === status);
    return acc;
  }, {});

  const avgMatch = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + a.match_percent, 0) / applications.length)
    : 0;

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Arizalar kuzatuvi</h1>
        <p className="text-ink-3 text-sm">{applications.length} ta ariza</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Jami arizalar", value: stats.total || 0, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
          { label: "Intervyu", value: stats.interview || 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Qabul qilindi", value: stats.accepted || 0, icon: Award, color: "bg-green-50 text-green-600" },
          { label: "O'rtacha moslik", value: `${avgMatch}%`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
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
          {/* Kanban */}
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
                          <p className="text-xs text-ink-3 mt-0.5">{app.company}</p>
                        </div>
                        <MatchIndicator percent={app.match_percent} size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(app.created_at)}
                        </span>
                        <Link to={`/vacancies/${app.vacancy_id}`} className="text-xs text-ink font-medium hover:text-accent transition-colors flex items-center gap-0.5">
                          Batafsil <ChevronRight className="w-3 h-3" />
                        </Link>
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

          {/* Table view */}
          <div className="hidden md:block bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Vakansiya</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Kompaniya</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Moslik</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Sana</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-6 py-4">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-ink-2" />
                        </div>
                        <span className="font-medium text-ink text-sm block">{app.vacancy_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-3">{app.company}</td>
                    <td className="px-6 py-4">
                      <MatchIndicator percent={app.match_percent} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-3">{timeAgo(app.created_at)}</td>
                    <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
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
