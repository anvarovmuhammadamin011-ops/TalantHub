import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, XCircle, Building, Briefcase, Send } from "lucide-react";
import { vacancies } from "../data/mockData";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";

export default function VacancyDetail() {
  const { id } = useParams();
  const vacancy = vacancies.find((v) => v.id === +id) || vacancies[0];
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleApply = () => {
    if (applied || applying) return;
    setApplying(true);
    setTimeout(() => {
      setApplied(true);
      setApplying(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 md:pb-10">
      <Link to="/vacancies" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Vakansiyalar
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 md:p-8 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {vacancy.companyLogo}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">{vacancy.title}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-ink-3">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {vacancy.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {vacancy.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {vacancy.postedAgo}</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <MatchIndicator percent={vacancy.matchPercent} size="lg" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-4 flex-wrap">
              <StatusBadge status={vacancy.experience} />
              <StatusBadge status={vacancy.format} />
              {vacancy.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-surface text-ink-2 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sm:hidden flex justify-center mt-6">
          <MatchIndicator percent={vacancy.matchPercent} size="lg" />
        </div>

        <div className="mt-6 pt-6 border-t border-border-soft flex items-center justify-between">
          <div className="text-lg font-semibold text-ink">{vacancy.salary}</div>
          <div className="flex items-center gap-1 text-sm text-ink-3">
            <Star className="w-3.5 h-3.5 text-ink fill-ink" />
            {vacancy.companyRating} ({vacancy.companyReviews} sharh)
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="md:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-ink mb-3">Vakansiya haqida</h2>
            <p className="text-ink-2 text-sm leading-relaxed">{vacancy.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-ink mb-3">Talablar</h2>
            <ul className="space-y-2.5">
              {vacancy.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-ink-2 text-sm">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditions */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-ink mb-3">Sharoitlar</h2>
            <ul className="space-y-2.5">
              {vacancy.conditions.map((cond, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-ink-3 mt-0.5 flex-shrink-0" />
                  <span className="text-ink-2 text-sm">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Match details */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4 text-center">Moslik tahlili</h3>
            <div className="flex justify-center mb-4">
              <MatchIndicator percent={vacancy.matchPercent} size="lg" />
            </div>
            <div className="text-center text-sm text-ink-3 mb-5">Sizga {vacancy.matchPercent}% mos</div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Mos ko'nikmalar</div>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-success-soft text-success rounded-md text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Yo'q ko'nikmalar</div>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.tags.slice(3).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-danger-soft text-danger rounded-md text-xs font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Company */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4">Kompaniya</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center text-xl">
                {vacancy.companyLogo}
              </div>
              <div>
                <div className="font-medium text-ink text-sm">{vacancy.company}</div>
                <div className="flex items-center gap-1 text-sm text-ink-3">
                  <Star className="w-3.5 h-3.5 text-ink fill-ink" />
                  {vacancy.companyRating} · {vacancy.companyReviews} sharh
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky apply button (mobile) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-3">Maosh</div>
            <div className="font-semibold text-ink text-sm">{vacancy.salary}</div>
          </div>
          <button
            onClick={handleApply}
            disabled={applied || applying}
            className={`px-8 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              applied
                ? "bg-accent text-white cursor-default"
                : applying
                ? "bg-ink/60 text-white cursor-wait"
                : "bg-ink text-white hover:bg-ink/90"
            }`}
          >
            {applied ? (
              <>
                <CheckCircle className="w-4 h-4" /> Yuborildi
              </>
            ) : applying ? (
              "Yuborilmoqda..."
            ) : (
              <>
                <Send className="w-4 h-4" /> Ariza yuborish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
