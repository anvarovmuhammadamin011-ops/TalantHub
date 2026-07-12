import { Link } from "react-router-dom";
import { Briefcase, Clock, ChevronRight } from "lucide-react";
import { applications } from "../data/mockData";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

export default function Applications() {
  const statusOrder = ["Yuborildi", "Ko'rildi", "Intervyu", "Qabul qilindi", "Rad etildi"];

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = applications.filter((a) => a.status === status);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Arizalar kuzatuvi</h1>
        <p className="text-ink-3 text-sm">{applications.length} ta ariza</p>
      </div>

      {/* Timeline / Kanban */}
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
                      <h4 className="font-medium text-ink text-sm">{app.vacancy}</h4>
                      <p className="text-xs text-ink-3 mt-0.5">{app.company}</p>
                    </div>
                    <MatchIndicator percent={app.matchPercent} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {app.date}
                    </span>
                    <Link to="/vacancies" className="text-xs text-ink font-medium hover:text-accent transition-colors flex items-center gap-0.5">
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
                    <span className="font-medium text-ink text-sm">{app.vacancy}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-ink-3">{app.company}</td>
                <td className="px-6 py-4">
                  <MatchIndicator percent={app.matchPercent} size="sm" />
                </td>
                <td className="px-6 py-4 text-sm text-ink-3">{app.date}</td>
                <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
