import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, XCircle, Building, Briefcase, Send } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, computeMatch } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";
import ReportButton from "../components/ui/ReportButton";

export default function VacancyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ vacancy }, { applications }] = await Promise.all([
          api(`/vacancies/${id}`),
          api("/applications").catch(() => ({ applications: [] })),
        ]);
        setVacancy(vacancy);
        setApplied(applications.some((a) => String(a.vacancy_id) === String(id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    setError("");
    try {
      await api("/applications", { method: "POST", body: { vacancy_id: Number(id) } });
      setApplied(true);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      if (err.status === 409) {
        setApplied(true);
      } else {
        setError(err.message || "Xatolik yuz berdi");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (!vacancy) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Vakansiya topilmadi</div>;
  }

  const matchPercent = computeMatch(user?.skills, vacancy.tags);
  const matchedTags = vacancy.tags.filter((t) => (user?.skills || []).some((s) => s.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(s.toLowerCase())));
  const unmatchedTags = vacancy.tags.filter((t) => !matchedTags.includes(t));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 md:pb-10">
      <Link to="/vacancies" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Vakansiyalar
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 md:p-8 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {vacancy.company_logo || "🏢"}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">{vacancy.title}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-ink-3">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {vacancy.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {vacancy.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(vacancy.created_at)}</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <MatchIndicator percent={matchPercent} size="lg" />
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
          <MatchIndicator percent={matchPercent} size="lg" />
        </div>

        <div className="mt-6 pt-6 border-t border-border-soft flex items-center justify-between">
          <div className="text-lg font-semibold text-ink">{vacancy.salary}</div>
          <div className="flex items-center gap-1 text-sm text-ink-3">
            <Star className="w-3.5 h-3.5 text-ink fill-ink" />
            {vacancy.company_rating} ({vacancy.company_reviews} sharh)
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
          {vacancy.requirements.length > 0 && (
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
          )}

          {/* Conditions */}
          {vacancy.conditions.length > 0 && (
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
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Match details */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4 text-center">Moslik tahlili</h3>
            <div className="flex justify-center mb-4">
              <MatchIndicator percent={matchPercent} size="lg" />
            </div>
            <div className="text-center text-sm text-ink-3 mb-5">Sizga {matchPercent}% mos</div>
            <div className="space-y-4">
              {matchedTags.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Mos ko'nikmalar</div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-success-soft text-success rounded-md text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {unmatchedTags.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">Yo'q ko'nikmalar</div>
                  <div className="flex flex-wrap gap-1.5">
                    {unmatchedTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-danger-soft text-danger rounded-md text-xs font-medium flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4">Kompaniya</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center text-xl">
                {vacancy.company_logo || "🏢"}
              </div>
              <div>
                <div className="font-medium text-ink text-sm">{vacancy.company}</div>
                <div className="flex items-center gap-1 text-sm text-ink-3">
                  <Star className="w-3.5 h-3.5 text-ink fill-ink" />
                  {vacancy.company_rating} · {vacancy.company_reviews} sharh
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-soft flex justify-end">
              <ReportButton targetType="vacancy" targetId={Number(id)} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky apply button (mobile) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-ink-3">Maosh</div>
            <div className="font-semibold text-ink text-sm">{vacancy.salary}</div>
          </div>
          {error && <div className="text-xs text-red-500 flex-1 text-right">{error}</div>}
          <button
            onClick={handleApply}
            disabled={applied || applying}
            className={`px-8 py-3 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 flex-shrink-0 ${
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
