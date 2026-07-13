import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Heart, Clock, X } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, computeMatch } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";

export default function Vacancies() {
  const { user } = useAuth();
  const isTeacher = user?.role === "specialist" && (user?.category === "Ta'lim" || (user?.fields || []).includes("Ta'lim"));
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(isTeacher);
  const [filters, setFilters] = useState({
    category: isTeacher ? "Ta'lim" : "",
    city: "",
    format: "",
    experience: "",
    subcategory: "",
  });
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  const cities = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Namangan", "Xiva", "Qo'qon"];

  const teacherSubcategories = [
    "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
    "Tarix", "Ona tili", "Informatika", "Geografiya", "Musiqa", "Jismoniy tarbiya",
  ];

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadVacancies();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, filters]);

  const loadVacancies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.category) params.set("category", filters.category);
      if (filters.city) params.set("location", filters.city);
      if (filters.format) params.set("format", filters.format);
      if (filters.experience) params.set("experience", filters.experience);

      const data = await api(`/vacancies?${params.toString()}`);
      setVacancies(data.vacancies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  let filtered = vacancies.map((v) => ({
    ...v,
    matchPercent: computeMatch(user?.skills, v.tags),
  }));

  if (filters.subcategory) {
    const q = filters.subcategory.toLowerCase();
    filtered = filtered.filter((v) =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q)) ||
      (v.category || "").toLowerCase().includes(q)
    );
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
            {opt || "Barchasi"}
          </button>
        ))}
      </div>
    </div>
  );

  const FilterPanel = () => (
    <div className="space-y-6">
      {isTeacher && (
        <FilterGroup
          label="Yo'nalish"
          options={["", ...teacherSubcategories]}
          value={filters.subcategory}
          onChange={(v) => setFilters({ ...filters, subcategory: v })}
        />
      )}
      <FilterGroup label="Kategoriya" options={["", "IT", "Ta'lim"]} value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} />
      <FilterGroup label="Shahar" options={["", ...cities]} value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
      <FilterGroup label="Tajriba" options={["", "Junior", "Middle", "Senior"]} value={filters.experience} onChange={(v) => setFilters({ ...filters, experience: v })} />
      <FilterGroup label="Ish formati" options={["", "Ofis", "Masofaviy", "Gibrid"]} value={filters.format} onChange={(v) => setFilters({ ...filters, format: v })} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">
          {isTeacher ? "O'qituvchilar uchun ishlar" : "Vakansiyalar"}
        </h1>
        <p className="text-ink-3 text-sm">
          {isTeacher
            ? `${filtered.length} ta o'qituvchilik vakansiyasi topildi`
            : `${filtered.length} ta vakansiya topildi`
          }
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Vakansiya yoki kompaniya qidirish..."
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
          <span className="hidden sm:inline">Filtrlar</span>
        </button>
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
            <h3 className="font-semibold text-ink text-sm mb-5">Filtrlar</h3>
            <FilterPanel />
          </div>
        </div>

        {/* Vacancy cards */}
        <div className="flex-1 space-y-3">
          {loading && (
            <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>
          )}

          {!loading && filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-border p-6 hover:border-ink/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                  {v.company_logo || "🏢"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/vacancies/${v.id}`} className="text-base font-semibold text-ink hover:text-accent transition-colors">
                        {v.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-3">
                        <span>{v.company}</span>
                        <span>·</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{v.location}</span>
                      </div>
                    </div>
                    <MatchIndicator percent={v.matchPercent} />
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
                      <button className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors">
                        <Heart className="w-[18px] h-[18px]" />
                      </button>
                      <Link
                        to={`/vacancies/${v.id}`}
                        className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
                      >
                        Ariza yuborish
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
              <h3 className="text-base font-semibold text-ink mb-1.5">Vakansiya topilmadi</h3>
              <p className="text-ink-3 text-sm">Filtrlarni o'zgartirib ko'ring</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {showFilters && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-ink">Filtrlar</h3>
              <button onClick={() => setShowFilters(false)} className="p-1">
                <X className="w-5 h-5 text-ink-3" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 bg-ink text-white py-3 rounded-lg font-medium hover:bg-ink/90 transition-colors"
            >
              Natijalarni ko'rish ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
