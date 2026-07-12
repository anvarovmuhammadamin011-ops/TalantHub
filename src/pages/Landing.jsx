import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, TrendingUp, Heart, ArrowRight, Sparkles, Flame, Clock, Users, Briefcase, Award, Zap, Globe, Shield } from "lucide-react";
import { specialists, categories } from "../data/mockData";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

const allFilters = ["Hammasi", "Frontend", "Backend", "Mobile", "UI/UX", "O'qituvchiler", "Senior", "Online"];

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
    if (activeFilter === "Online") return s.online;
    return s.tags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase())) || s.title.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ink via-ink/90 to-ink/70 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute bottom-10 right-20 w-48 h-48 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 border border-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              O'zbekistondagi #1 HR platforma
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
              Eng yaxshi mutaxassislar<br />
              <span className="text-accent">bir platformada</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base mb-8 max-w-xl mx-auto">
              IT sohasi va ta'lim yo'nalishidagi eng tajribali mutaxassislar bilan bog'laning. AI yordamchisi sizga mos odamni topishga yordam beradi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-white text-ink px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2">
                Boshlash <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/specialists" className="bg-white/10 text-white px-8 py-3.5 rounded-xl font-medium text-sm hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10">
                <Users className="w-4 h-4" /> Mutaxassislar
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
            {[
              { icon: Users, label: "Mutaxassislar", value: "12,500+" },
              { icon: Briefcase, label: "Vakansiyalar", value: "3,400+" },
              { icon: Award, label: "Joylash", value: "8,900+" },
              { icon: Globe, label: "Kompaniyalar", value: "650+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <stat.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-[11px] text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dasturchi, o'qituvchi yoki ko'nikma qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl border border-border focus:border-ink/30 focus:bg-white outline-none transition-all text-sm"
              />
            </div>
            <Link to="/ai-chat" className="flex items-center gap-1.5 text-sm font-medium text-ink bg-surface px-4 py-3 rounded-xl border border-border hover:border-ink/30 transition-colors whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-accent" /> AI Qidirish
            </Link>
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
        {/* Feature Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <Link to="/ai-chat" className="bg-gradient-to-br from-ink to-ink/70 rounded-xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <Sparkles className="w-6 h-6 text-white/40 mb-3" />
              <h3 className="font-semibold mb-1">AI Kadrlar yordamchisi</h3>
              <p className="text-xs text-white/60 mb-3">Qanday mutaxassis kerakligini yozing — topib beramiz</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg">
                Sinab ko'ring <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
          <Link to="/specialists" className="bg-gradient-to-br from-accent to-accent/70 rounded-xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <Flame className="w-6 h-6 text-white/40 mb-3" />
              <h3 className="font-semibold mb-1">Eng talab qilinadigan</h3>
              <p className="text-xs text-white/60 mb-3">Frontend va Backend dasturchilar hozirgi eng talab qilinadigan kasblar</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg">
                {specialists.filter((s) => s.online).length} ta online
              </span>
            </div>
          </Link>
          <Link to="/vacancies" className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <Briefcase className="w-6 h-6 text-white/40 mb-3" />
              <h3 className="font-semibold mb-1">Yangi vakansiyalar</h3>
              <p className="text-xs text-white/60 mb-3">Har kuni yangi vakansiyalar qo'shiladi. O'zingizga mos ishni toping.</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg">
                8 ta yangi vakansiya
              </span>
            </div>
          </Link>
        </div>

        {/* Online Specialists */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <h2 className="text-lg font-semibold text-ink">Online mutaxassislar</h2>
            </div>
            <Link to="/specialists" className="text-sm font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {specialists.filter((s) => s.online).map((s) => (
              <Link key={s.id} to="/specialists"
                className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group relative">
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-[10px] text-accent font-medium">Online</span>
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
                  <div className="text-[10px] text-accent font-medium mb-1">{s.hourlyPrice}</div>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-ink-3 mb-1"><MapPin className="w-3 h-3" /> {s.location}</div>
                  <div className="text-xs font-semibold text-ink">{s.salary}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Specialists */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Barcha mutaxassislar</h2>
              <p className="text-sm text-ink-3 mt-0.5">{filtered.length} ta natija</p>
            </div>
            <Link to="/specialists" className="text-sm font-medium text-ink-2 hover:text-ink transition-colors hidden sm:block">Hammasini ko'rish →</Link>
          </div>
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
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-ink mb-1">Natija topilmadi</h3>
            <p className="text-sm text-ink-3">Boshqa so'z bilan qidirib ko'ring yoki <Link to="/ai-chat" className="text-ink font-medium hover:underline">AI yordamchini</Link> sinab ko'ring</p>
          </div>
        )}

        {/* Categories */}
        <div className="mb-8">
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

        {/* Trust Section */}
        <div className="bg-white rounded-xl border border-border p-8 text-center mb-8">
          <Shield className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-ink mb-2">Ishonchli platforma</h2>
          <p className="text-ink-3 text-sm max-w-lg mx-auto mb-6">
            Barcha mutaxassislar tekshirilgan. Sertifikatlar va tajriba tasdiqlangan. Sizga eng mos odamni topishga kafolat beramiz.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div>
              <div className="text-2xl font-bold text-ink">98%</div>
              <div className="text-xs text-ink-3">Mamnunlik</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">24/7</div>
              <div className="text-xs text-ink-3">Qo'llab-quvvatlash</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">100%</div>
              <div className="text-xs text-ink-3">Xavfsizlik</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
