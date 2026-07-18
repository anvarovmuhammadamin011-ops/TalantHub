import { X, MapPin, Briefcase, Building } from "lucide-react";
import { formatSalary } from "../../lib/format";

export default function VacancyPreviewModal({ vacancy, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-border">
          <span className="text-xs font-medium text-ink-3 uppercase tracking-wide">Oldindan ko'rish</span>
          <button onClick={onClose} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏢</div>
            <div>
              <h2 className="text-xl font-semibold text-ink">{vacancy.title || "Sarlavha ko'rsatilmagan"}</h2>
              <div className="flex items-center gap-2 text-sm text-ink-3 mt-1">
                <Building className="w-3.5 h-3.5" /> {vacancy.company || vacancy.author_name}
                {vacancy.location && <><span>·</span><MapPin className="w-3.5 h-3.5" />{vacancy.location}</>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[vacancy.format, vacancy.experience, vacancy.employment_type, vacancy.english_level, vacancy.openings_count > 1 ? `${vacancy.openings_count} ta o'rin` : null]
              .filter(Boolean).map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border">{t}</span>
              ))}
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium text-ink-3 mb-1">Maosh</div>
            <div className="text-ink font-semibold">
              {vacancy.salary_type === "Aniq" ? vacancy.salary
                : vacancy.salary_type === "Diapazon" ? [formatSalary(vacancy.salary_min), formatSalary(vacancy.salary_max)].filter(Boolean).join(" - ") || "Kelishiladi"
                : "Kelishiladi"}
            </div>
          </div>

          {vacancy.description && (
            <div className="mb-6">
              <div className="text-sm font-medium text-ink-3 mb-1">Tavsif</div>
              <p className="text-sm text-ink-2 whitespace-pre-line">{vacancy.description}</p>
            </div>
          )}

          {(vacancy.tags || []).length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium text-ink-3 mb-2">Ko'nikmalar</div>
              <div className="flex flex-wrap gap-2">
                {vacancy.tags.map((t) => <span key={t} className="px-2.5 py-1 rounded-lg text-xs bg-accent-soft text-accent">{t}</span>)}
              </div>
            </div>
          )}

          {[
            ["Vazifalar", vacancy.responsibilities],
            ["Talablar", vacancy.requirements],
            ["Imtiyozlar", vacancy.conditions],
          ].map(([label, list]) => (list && list.length > 0) && (
            <div key={label} className="mb-6">
              <div className="text-sm font-medium text-ink-3 mb-2">{label}</div>
              <ul className="space-y-1.5">
                {list.map((item, i) => (
                  <li key={i} className="text-sm text-ink-2 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-ink-3 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(vacancy.screening_questions || []).length > 0 && (
            <div className="mb-2">
              <div className="text-sm font-medium text-ink-3 mb-2">Saralash savollari</div>
              <ul className="space-y-1.5">
                {vacancy.screening_questions.map((q, i) => (
                  <li key={i} className="text-sm text-ink-2 flex items-start gap-2">
                    <Briefcase className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-ink-3" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
