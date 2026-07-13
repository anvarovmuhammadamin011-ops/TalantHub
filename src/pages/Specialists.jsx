import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Star, Wifi, DollarSign } from "lucide-react";
import { api } from "../lib/api";
import { computeMatch } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

export default function Specialists() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: "", experience: "", city: "", priceMin: "", priceMax: "" });
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadSpecialists();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, filters]);

  const loadSpecialists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.category) params.set("category", filters.category);
      if (filters.city) params.set("city", filters.city);

      const data = await api(`/specialists?${params.toString()}`);
      let list = filters.experience
        ? data.specialists.filter((s) => s.experience_level === filters.experience)
        : data.specialists;

      if (filters.priceMin) {
        const min = Number(filters.priceMin);
        list = list.filter((s) => {
          const price = parseInt((s.hourly_price || "0").replace(/[^0-9]/g, ""));
          return price >= min;
        });
      }
      if (filters.priceMax) {
        const max = Number(filters.priceMax);
        list = list.filter((s) => {
          const price = parseInt((s.hourly_price || "0").replace(/[^0-9]/g, ""));
          return price <= max || price === 0;
        });
      }

      setSpecialists(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = specialists.map((s) => ({ ...s, matchPercent: computeMatch(user?.skills, s.skills) }));

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
      <FilterGroup label="Kategoriya" options={["", "IT", "Ta'lim"]} value={filters.category} onChange={(v) => setFilters({ ...filters, category: v })} />
      <FilterGroup label="Tajriba" options={["", "Junior", "Middle", "Senior", "Expert"]} value={filters.experience} onChange={(v) => setFilters({ ...filters, experience: v })} />
      <FilterGroup label="Shahar" options={["", "Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Namangan", "Xiva"]} value={filters.city} onChange={(v) => setFilters({ ...filters, city: v })} />
      <div>
        <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-2.5">Narx diapazoni (soatlik, so'm)</label>
        <div className="flex gap-2 items-center">
          <input type="number" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
            placeholder="Min" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
          <span className="text-ink-3">—</span>
          <input type="number" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            placeholder="Max" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Mutaxassislar bazasi</h1>
        <p className="text-ink-3 text-sm">{filtered.length} ta mutaxassis topildi</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ism yoki kasb qidirish..."
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
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <FilterPanel />
        </div>
      )}

      {loading && <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>}

      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <Link key={s.id} to={`/specialists/${s.id}`}
              className="bg-white rounded-xl border border-border p-6 hover:border-ink/20 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  {!!s.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-white flex items-center justify-center">
                      <Wifi className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-ink truncate text-sm">{s.name}</h3>
                    {!!s.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-sm text-ink-2 truncate">{s.category}</p>
                  <div className="flex items-center gap-1.5 text-xs text-ink-3 mt-1">
                    <MapPin className="w-3 h-3" /> {s.city}
                    <span>·</span>
                    <span>{s.experience}</span>
                  </div>
                </div>
                <MatchIndicator percent={s.matchPercent} />
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                <StatusBadge status={s.experience_level} />
                {s.skills.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-surface text-ink-2 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-border-soft">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3.5 h-3.5 text-ink fill-ink" />
                    <span className="font-medium text-ink">{s.rating}</span>
                    <span className="text-ink-3">({s.reviews_count})</span>
                  </div>
                  {!!s.online && (
                    <span className="flex items-center gap-1 text-xs text-accent font-medium">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-3 flex items-center gap-1">
                    {s.hourly_price && <><DollarSign className="w-3 h-3" /> {s.hourly_price} so'm/soat</>}
                  </span>
                  <span className="text-sm font-medium text-ink">{s.salary}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">👤</div>
          <h3 className="text-base font-semibold text-ink mb-1.5">Mutaxassis topilmadi</h3>
          <p className="text-ink-3 text-sm">Filtrlarni o'zgartirib ko'ring</p>
        </div>
      )}
    </div>
  );
}
