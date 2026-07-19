import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, XCircle, Building, Briefcase, Send, TrendingUp, Paperclip, X, Heart } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, computeMatch, formatSalary } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";
import ReportButton from "../components/ui/ReportButton";

export default function VacancyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [marketSalary, setMarketSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [{ vacancy }, { applications }] = await Promise.all([
          api(`/vacancies/${id}`),
          api("/applications").catch(() => ({ applications: [] })),
        ]);
        setVacancy(vacancy);
        setSaved(!!vacancy.is_saved);
        setApplied(applications.some((a) => String(a.vacancy_id) === String(id)));

        if (vacancy?.category) {
          const { vacancies: sameCategory } = await api(`/vacancies?category=${encodeURIComponent(vacancy.category)}`).catch(() => ({ vacancies: [] }));
          const others = sameCategory.filter((v) => String(v.id) !== String(id));
          setSimilar(others.slice(0, 3));

          const mins = others.map((v) => Number(v.salary_min) || 0).filter((n) => n > 0);
          const maxs = others.map((v) => Number(v.salary_max) || 0).filter((n) => n > 0);
          const allVals = [...mins, ...maxs, Number(vacancy.salary_min) || 0, Number(vacancy.salary_max) || 0].filter((n) => n > 0);
          if (allVals.length >= 2) {
            const min = Math.min(...allVals);
            const max = Math.max(...allVals);
            const avg = Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length);
            setMarketSalary({ min, avg, max });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleSave = async () => {
    if (!user) { navigate("/login"); return; }
    const next = !saved;
    setSaved(next);
    try {
      await api(`/vacancies/${id}/save`, { method: next ? "POST" : "DELETE" });
    } catch (err) {
      console.error(err);
      setSaved(!next);
    }
  };

  const openApplyModal = () => {
    if (applied || applying) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setError("");
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    if (applied || applying) return;
    setApplying(true);
    setError("");
    try {
      const screening_answers = (vacancy.screening_questions || []).map((question) => ({
        question, answer: (answers[question] || "").trim(),
      }));
      await api("/applications", { method: "POST", body: { vacancy_id: Number(id), resume_url: resumeUrl.trim(), screening_answers } });
      setApplied(true);
      setShowApplyModal(false);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      if (err.status === 409) {
        setApplied(true);
        setShowApplyModal(false);
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
              <div className="hidden sm:flex items-center gap-2">
                <MatchIndicator percent={matchPercent} size="lg" />
                {user?.role === "specialist" && (
                  <button
                    onClick={toggleSave}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                      saved ? "text-danger bg-danger-soft border-danger/10" : "text-ink-3 border-border hover:text-ink hover:bg-surface"
                    }`}
                    title={saved ? "Saqlangandan olib tashlash" : "Saqlash"}
                  >
                    <Heart className="w-[18px] h-[18px]" fill={saved ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-4 flex-wrap">
              <StatusBadge status={vacancy.experience} />
              <StatusBadge status={vacancy.format} />
              {!!vacancy.employment_type && <StatusBadge status={vacancy.employment_type} />}
              {!!vacancy.schedule && <StatusBadge status={vacancy.schedule} />}
              {!!vacancy.gender && vacancy.gender !== "Farqi yo'q" && <StatusBadge status={vacancy.gender} />}
              {vacancy.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-surface text-ink-2 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="sm:hidden flex justify-center items-center gap-2 mt-6">
          <MatchIndicator percent={matchPercent} size="lg" />
          {user?.role === "specialist" && (
            <button
              onClick={toggleSave}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                saved ? "text-danger bg-danger-soft border-danger/10" : "text-ink-3 border-border hover:text-ink hover:bg-surface"
              }`}
              title={saved ? "Saqlangandan olib tashlash" : "Saqlash"}
            >
              <Heart className="w-[18px] h-[18px]" fill={saved ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border-soft flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-ink">{vacancy.salary}</div>
            {!!vacancy.salary_details && <div className="text-xs text-ink-3 mt-0.5">{vacancy.salary_details}</div>}
          </div>
          <div className="flex items-center gap-1 text-sm text-ink-3">
            <Star className="w-3.5 h-3.5 text-ink fill-ink" />
            {vacancy.company_rating} ({vacancy.company_reviews} sharh)
          </div>
        </div>

        {(!!vacancy.day_off || !!vacancy.start_date) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
            {!!vacancy.day_off && <span>Dam olish kuni: <span className="text-ink-2 font-medium">{vacancy.day_off}</span></span>}
            {!!vacancy.start_date && <span>Ish boshlanishi: <span className="text-ink-2 font-medium">{new Date(vacancy.start_date).toLocaleDateString("uz-UZ")}</span></span>}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="md:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-base font-semibold text-ink mb-3">Vakansiya haqida</h2>
            <p className="text-ink-2 text-sm leading-relaxed">{vacancy.description}</p>
          </div>

          {/* Responsibilities */}
          {vacancy.responsibilities && vacancy.responsibilities.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-base font-semibold text-ink mb-3">Vazifalar</h2>
              <ul className="space-y-2.5">
                {vacancy.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Briefcase className="w-4 h-4 text-ink-3 mt-0.5 flex-shrink-0" />
                    <span className="text-ink-2 text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              <h2 className="text-base font-semibold text-ink mb-3">Imtiyozlar</h2>
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

          {/* Similar vacancies */}
          {similar.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-base font-semibold text-ink mb-4">O'xshash vakansiyalar</h2>
              <div className="space-y-1">
                {similar.map((v) => (
                  <Link key={v.id} to={`/vacancies/${v.id}`} className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-surface transition-colors">
                    <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      {v.company_logo || "🏢"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink text-sm truncate">{v.title}</div>
                      <div className="text-xs text-ink-3">{v.company} · {v.location}</div>
                    </div>
                    <div className="text-xs font-semibold text-ink whitespace-nowrap">{v.salary}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Market salary */}
          {marketSalary && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-semibold text-ink text-sm mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-ink-3" /> Bu lavozim uchun odatdagi maosh
              </h3>
              <p className="text-xs text-ink-3 mb-4">Shu kategoriyadagi vakansiyalar asosida</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-semibold text-ink">{formatSalary(marketSalary.min)}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">minimum</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-accent">{formatSalary(marketSalary.avg)}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">o'rtacha</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{formatSalary(marketSalary.max)}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">maksimum</div>
                </div>
              </div>
            </div>
          )}

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
          {error && !showApplyModal && <div className="text-xs text-red-500 flex-1 text-right">{error}</div>}
          <button
            onClick={openApplyModal}
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

      {/* Apply modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !applying && setShowApplyModal(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink text-base">Ariza yuborish</h3>
              <button onClick={() => !applying && setShowApplyModal(false)} className="p-1 text-ink-3 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-ink-3 mb-5">{vacancy.title} — {vacancy.company}</p>

            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-2">
              CV / rezyume havolasi (ixtiyoriy)
            </label>
            <div className="relative mb-1.5">
              <Paperclip className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Google Drive, PDF yoki boshqa havola"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors bg-white text-sm"
              />
            </div>
            <p className="text-xs text-ink-3 mb-5">Havola qo'shsangiz, ish beruvchi CV'ingizni to'g'ridan-to'g'ri ko'ra oladi.</p>

            {(vacancy.screening_questions || []).length > 0 && (
              <div className="space-y-3 mb-5">
                {vacancy.screening_questions.map((q) => (
                  <div key={q}>
                    <label className="block text-xs font-medium text-ink-3 mb-1.5">{q}</label>
                    <textarea
                      rows={2}
                      value={answers[q] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors bg-white text-sm resize-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <div className="text-xs text-red-500 mb-3">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                disabled={applying}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2"
              >
                {applying ? "Yuborilmoqda..." : (<><Send className="w-4 h-4" /> Yuborish</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
