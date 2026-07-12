import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, TrendingUp, Heart, ArrowRight, Sparkles, Flame, Clock } from "lucide-react";
import { specialists, categories } from "../data/mockData";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

const allFilters = ["Hammasi", "Frontend", "Backend", "Mobile", "UI/UX", "O'qituvchiler", "Senior"];

export default function Landing() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Hammasi");
  const [savedIds, setSavedIds] = useState([]);

  const toggleSave = (e, id) => {
    e.preventDefault();
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const filtered = specialists.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === "Hammasi") return true;
    if (activeFilter === "O'qituvchiler") return s.category === "Ta'lim";
    if (activeFilter === "Senior") return s.experienceLevel === "Senior";
    return s.tags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase())) || s.title.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar with quick stats */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-ink-3"><TrendingUp className="w-3.5 h-3.5 text-accent" /> Profilingiz 80% to'ldirilgan</span>
            <span className="hidden sm:flex items-center gap-1.5 text-ink-3"><Clock className="w-3.5 h-3.5" /> 3 ta yangi ariza</span>
          </div>
          <Link to="/ai-chat" className="flex items-center gap-1.5 text-sm font-medium text-ink bg-surface px-3 py-1.5 rounded-full border border-border hover:border-ink/30 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> AI yordamchi
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Dasturchi, o'qituvchi yoki ko'nikma qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-xl border border-border focus:border-ink/30 focus:bg-white outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {allFilters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === f ? "bg-ink text-white" : "bg-surface text-ink-2 border border-border hover:border-ink/30"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Promo banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Link to="/ai-chat" className="bg-gradient-to-br from-ink to-ink/70 rounded-xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 mb-2 uppercase tracking-wider"><Sparkles className="w-3 h-3" /> AI bilan qidiring</div>
              <h3 className="text-base font-semibold mb-1">AI Kadrlar yordamchisi</h3>
              <p className="text-xs text-white/60 mb-3">Qanday mutaxassis kerakligini yozing — topib beramiz</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg hover:bg-white/25 transition-colors">
                Sinab ko'ring <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
          <div className="bg-gradient-to-br from-accent to-accent/70 rounded-xl p-5 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 mb-2 uppercase tracking-wider"><Flame className="w-3 h-3" /> Trend</div>
              <h3 className="text-base font-semibold mb-1">Eng talab qilinadigan</h3>
              <p className="text-xs text-white/60 mb-3">Frontend va Backend dasturchilar hozirgi eng talab qilinadigan kasblar</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg">
                {specialists.length} ta mutaxassis
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Mutaxassislar</h2>
            <p className="text-sm text-ink-3 mt-0.5">{filtered.length} ta natija</p>
          </div>
          <Link to="/specialists" className="text-sm font-medium text-ink-2 hover:text-ink transition-colors hidden sm:block">Hammasini ko'rish →</Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <Link key={s.id} to="/specialists"
              className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group relative">
              <div className="absolute top-3 right-3 z-10">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  s.matchPercent >= 80 ? "bg-accent-soft text-accent" : s.matchPercent >= 60 ? "bg-amber-50 text-amber-600" : "bg-surface text-ink-3"
                }`}>{s.matchPercent}% mos</div>
              </div>
              <button onClick={(e) => toggleSave(e, s.id)}
                className="absolute top-3 left-3 z-10 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-red-50">
                <Heart className={`w-4 h-4 transition-colors ${savedIds.includes(s.id) ? "text-red-500 fill-red-500" : "text-ink-3 hover:text-red-500"}`} />
              </button>
              <div className="w-14 h-14 mx-auto mb-3 bg-ink rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white text-lg font-semibold">{s.name.split(" ").map((n) => n[0]).join("")}</span>
              </div>
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-semibold text-ink text-sm truncate">{s.name}</h3>
                  {s.verified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-xs text-ink-2 mt-0.5 truncate">{s.title}</p>
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-3 h-3 text-ink fill-ink" />
                <span className="text-xs font-medium text-ink">{s.rating}</span>
                <span className="text-[10px] text-ink-3">({s.reviews})</span>
              </div>
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                <StatusBadge status={s.experienceLevel} />
                {s.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-surface text-ink-3 rounded text-[10px] font-medium">{tag}</span>
                ))}
              </div>
              <div className="text-center border-t border-border pt-3">
                <div className="flex items-center justify-center gap-1 text-[11px] text-ink-3 mb-1"><MapPin className="w-3 h-3" /> {s.location}</div>
                <div className="text-xs font-semibold text-ink">{s.salary}</div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-ink mb-1">Natija topilmadi</h3>
            <p className="text-sm text-ink-3">Boshqa so'z bilan qidirib ko'ring yoki <Link to="/ai-chat" className="text-ink font-medium hover:underline">AI yordamchini</Link> sinab ko'ring</p>
          </div>
        )}

        {/* Categories */}
        <div className="mt-10 mb-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Yo'nalishlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link key={cat.name} to="/specialists"
                className="bg-white rounded-xl border border-border p-4 hover:border-ink/20 hover:shadow-sm transition-all text-center group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="font-medium text-ink text-sm">{cat.name}</div>
                <div className="text-xs text-ink-3 mt-0.5">{cat.count} ta</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
