import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Heart, Clock, Code2, Server, Smartphone, Sparkles, Languages, Calculator, GraduationCap, LayoutGrid, Bell, BellRing } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/ui/StatusBadge";
import SaveButton from "../components/ui/SaveButton";
import BottomSheet from "../components/ui/BottomSheet";
import { VacancyCardSkeletonList } from "../components/ui/Skeleton";
import CompanyLogo from "../components/ui/CompanyLogo";
import { useT } from "../context/I18nContext";

const SALARY_MIN = 0;
const SALARY_MAX = 20_000_000;
const SALARY_STEP = 500_000;

function formatSalaryShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} mln`;
  if (n >= 1_000) return `${Math.round(n / 1000)} ming`;
  return String(n);
}

export default function Vacancies() {
  const { user } = useAuth();
  const { t } = useT();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  const isTeacher = user?.role === "specialist" && (user?.category === "Ta'lim" || (user?.fields || []).includes("Ta'lim"));
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(isTeacher);
  const [filters, setFilters] = useState({
    category: isTeacher ? "Ta'lim" : "",
    city: "",
    format: [],
    experience: [],
    subcategory: "",
    salaryMin: SALARY_MIN,
    salaryMax: SALARY_MAX,
  });
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertState, setAlertState] = useState("idle"); // idle | saving | saved

  const cities = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Namangan", "Xiva", "Qo'qon"];

  const popularCategories = [
    { key: "frontend", query: "Frontend Developer", icon: Code2 },
    { key: "backend", query: "Backend Developer", icon: Server },
    { key: "mobile", query: "Mobile Developer", icon: Smartphone },
    { key: "aiMl", query: "AI/ML Engineer", icon: Sparkles },
    { key: "english", query: "Ingliz tili o'qituvchisi", icon: Languages },
    { key: "math", query: "Matematika o'qituvchisi", icon: Calculator },
    { key: "sat", query: "SAT o'qituvchisi", icon: GraduationCap },
    { key: "all", query: "", icon: LayoutGrid },
  ];

  const teacherSubcategories = [
    "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
    "Tarix", "Ona tili", "Informatika", "Geografiya", "Musiqa", "Jismoniy tarbiya",
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadVacancies();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, filters.category, filters.city]);

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.category) params.set("category", filters.category);
      if (filters.city) params.set("location", filters.city);

      const data = await api(`/vacancies?${params.toString()}`);
      setVacancies(data.vacancies);
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.vacancies.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSearch = !!(search || filters.category || filters.city || filters.format[0] || filters.experience[0]);

  const createAlert = async () => {
    if (alertState === "saving" || !hasActiveSearch) return;
    setAlertState("saving");
    try {
      await api("/saved-searches", {
        method: "POST",
        body: {
          name: search || filters.subcategory || t("pages.vacancies.defaultSearchName"),
          query: search,
          category: filters.category,
          location: filters.city,
          format: filters.format[0] || "",
          experience: filters.experience[0] || "",
        },
      });
      setAlertState("saved");
      showToast(t("pages.vacancies.alertCreatedToast"), "success");
      setTimeout(() => setAlertState("idle"), 2500);
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.vacancies.alertError"), "error");
      setAlertState("idle");
    }
  };

  const toggleMulti = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((x) => x !== value) : [...prev[field], value],
    }));
  };

  let filtered = vacancies;

  if (filters.subcategory) {
    const q = filters.subcategory.toLowerCase();
    filtered = filtered.filter((v) =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q)) ||
      (v.category || "").toLowerCase().includes(q)
    );
  }

  if (filters.experience.length > 0) {
    filtered = filtered.filter((v) => filters.experience.includes(v.experience));
  }

  if (filters.format.length > 0) {
    filtered = filtered.filter((v) => filters.format.includes(v.format));
  }

  if (filters.salaryMin > SALARY_MIN || filters.salaryMax < SALARY_MAX) {
    filtered = filtered.filter((v) => {
      const vMin = Number(v.salary_min) || 0;
      const vMax = Number(v.salary_max) || 0;
      if (vMin === 0 && vMax === 0) return true; // "Kelishiladi" — raqam kiritilmagan vakansiyalarni yashirmaymiz
      return vMax >= filters.salaryMin && vMin <= filters.salaryMax;
    });
  }

  const FilterGroup = ({ label, options, value, onChange }) => (
    <div>
      <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-2.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              value === opt ? "bg-ink text-white" : "bg-surface text-ink-2 hover:bg-border-soft"
            }`}
          >
            {opt || t("common.all")}
          </button>
        ))}
      </div>
    </div>
  );

  const CheckboxGroup = ({ label, options, values, onToggle }) => (
    <div>
      <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-2.5">{label}</label>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={values.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-4 h-4 rounded border-border text-ink accent-ink cursor-pointer"
            />
            <span className="text-sm text-ink-2 group-hover:text-ink transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const SalaryRangeSlider = () => {
    const pctMin = ((filters.salaryMin - SALARY_MIN) / (SALARY_MAX - SALARY_MIN)) * 100;
    const pctMax = ((filters.salaryMax - SALARY_MIN) / (SALARY_MAX - SALARY_MIN)) * 100;
    return (
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-medium text-ink-3 uppercase tracking-wide">{t("pages.vacancies.filterSalary")}</label>
          <span className="text-xs font-medium text-ink">{formatSalaryShort(filters.salaryMin)} – {formatSalaryShort(filters.salaryMax)}</span>
        </div>
        <div className="relative h-5 flex items-center">
          <div className="absolute left-0 right-0 h-1 bg-surface rounded-full" />
          <div className="absolute h-1 bg-ink rounded-full" style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }} />
          <input
            type="range" min={SALARY_MIN} max={SALARY_MAX} step={SALARY_STEP}
            value={filters.salaryMin}
            onChange={(e) => setFilters({ ...filters, salaryMin: Math.min(Number(e.target.value), filters.salaryMax - SALARY_STEP) })}
            className="absolute w-full appearance-none bg-transparent pointer-events-none accent-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
          <input
            type="range" min={SALARY_MIN} max={SALARY_MAX} step={SALARY_STEP}
            value={filters.salaryMax}
            onChange={(e) => setFilters({ ...filters, salaryMax: Math.max(Number(e.target.value), filters.salaryMin + SALARY_STEP) })}
            className="absolute w-full appearance-none bg-transparent pointer-events-none accent-ink [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      </div>
    );
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {isTeacher && (
        <FilterGroup
          label={t("pages.vacancies.filterDirection")}
          options={["", ...teacherSubcategories]}
          value={filters.subcategory}
          onChange={(v) => setFilters({ ...filters, subcategory: v })}
        />
      )}
      <FilterGroup label={t("pages.vacancies.filterCategory")} options={["", "IT", "Ta'lim"]} value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} />
      <FilterGroup label={t("pages.vacancies.filterCity")} options={["", ...cities]} value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
      <CheckboxGroup label={t("pages.vacancies.filterExperience")} options={["Junior", "Middle", "Senior"]} values={filters.experience} onToggle={(v) => toggleMulti("experience", v)} />
      <CheckboxGroup label={t("pages.vacancies.filterFormat")} options={["Ofis", "Masofaviy", "Gibrid"]} values={filters.format} onToggle={(v) => toggleMulti("format", v)} />
      <SalaryRangeSlider />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">
            {filters.category === "Ta'lim" ? t("pages.vacancies.titleTeacher") : filters.category === "IT" ? t("pages.vacancies.titleIt") : t("pages.vacancies.titleAll")}
          </h1>
          <p className="text-ink-3 text-sm">
            {filters.category === "Ta'lim"
              ? t("pages.vacancies.countTeacher", { count: filtered.length })
              : filters.category === "IT"
              ? t("pages.vacancies.countIt", { count: filtered.length })
              : t("pages.vacancies.countAll", { count: filtered.length })
            }
          </p>
        </div>
        {user?.role === "specialist" && (
          <Link to="/saved" className="md:hidden flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-ink-2 text-xs font-medium hover:border-ink/30 hover:text-ink transition-colors">
            <Heart className="w-3.5 h-3.5" /> {t("nav.savedShort")}
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("pages.vacancies.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors bg-white text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-colors ${
            showFilters ? "bg-ink text-white border-ink" : "bg-white border-border text-ink-2 hover:border-ink/30"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common.filter")}</span>
        </button>
        {user?.role === "specialist" && hasActiveSearch && (
          <button
            onClick={createAlert}
            disabled={alertState === "saving"}
            title={t("pages.vacancies.alertTooltip")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-colors flex-shrink-0 ${
              alertState === "saved" ? "bg-success-soft text-success border-success/10" : "bg-white border-border text-ink-2 hover:border-ink/30"
            }`}
          >
            {alertState === "saved" ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span className="hidden sm:inline">{alertState === "saved" ? t("pages.vacancies.alertCreated") : t("pages.vacancies.alertCreate")}</span>
          </button>
        )}
      </div>

      {/* Popular categories */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">{t("pages.vacancies.popularCategoriesTitle")}</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {popularCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                if (!cat.query) {
                  setShowFilters(true);
                  return;
                }
                setSearch(cat.query);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 rounded-xl border transition-colors ${
                search === cat.query && cat.query
                  ? "border-ink bg-ink/5"
                  : "border-border bg-white hover:border-ink/20"
              }`}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <cat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-ink-2 text-center leading-tight">{t(`pages.vacancies.category.${cat.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Filters */}
      {showFilters && (
        <div className="hidden md:block bg-white rounded-xl border border-border p-6 mb-6">
          <FilterPanel />
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar filters */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="border border-border rounded-xl p-6 sticky top-24">
            <h3 className="font-semibold text-ink text-sm mb-5">{t("common.filter")}</h3>
            <FilterPanel />
          </div>
        </div>

        {/* Vacancy cards */}
        <div className="flex-1 space-y-3">
          {loading && <VacancyCardSkeletonList count={4} />}

          {!loading && filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-border p-6 hover:border-ink/20 transition-colors">
              <div className="flex items-start gap-4">
                <CompanyLogo name={v.company} logo={v.company_logo} size="ml" />
                <div className="flex-1 min-w-0">
                  <div>
                    <Link to={`/vacancies/${v.id}`} className="text-base font-semibold text-ink hover:text-accent transition-colors">
                      {v.title}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-3">
                      <Link to={`/companies/${v.employer_id}`} onClick={(e) => e.stopPropagation()} className="hover:text-ink hover:underline">{v.company}</Link>
                      <span>·</span>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{v.location}</span>
                    </div>
                  </div>

                  <p className="text-ink-2 text-sm mt-3 line-clamp-2 leading-relaxed">{v.description}</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <StatusBadge status={v.experience} />
                    <StatusBadge status={v.format} />
                    {v.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-surface text-ink-2 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                    {v.tags.length > 3 && (
                      <span className="text-xs text-ink-3">+{v.tags.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-soft">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-ink text-sm">{v.salary}</span>
                      <span className="text-xs text-ink-3 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {timeAgo(v.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {user?.role === "specialist" && (
                        <SaveButton vacancyId={v.id} initialSaved={v.is_saved} size="lg" />
                      )}
                      <Link
                        to={`/vacancies/${v.id}`}
                        className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
                      >
                        {t("common.apply")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">🔍</div>
              <h3 className="text-base font-semibold text-ink mb-1.5">{t("pages.vacancies.emptyTitle")}</h3>
              <p className="text-ink-3 text-sm">{t("pages.vacancies.emptySubtitle")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={t("common.filter")}
        mobileOnly
        footer={
          <button
            onClick={() => setShowFilters(false)}
            className="w-full min-h-11 bg-ink text-white py-3 rounded-lg font-medium hover:bg-ink/90 transition-colors"
          >
            {t("pages.vacancies.viewResults", { count: filtered.length })}
          </button>
        }
      >
        <FilterPanel />
      </BottomSheet>
    </div>
  );
}
