import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Search, MapPin, Star, Briefcase, Heart, ArrowRight, Users, TrendingUp, Shield, Zap, CheckCircle } from "lucide-react";
import { specialists, categories, stats } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

const allFilters = ["Hammasi", "Frontend", "Backend", "Mobile", "UI/UX", "O'qituvchiler", "Senior", "Masofaviy"];

function LoggedInHome() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Hammasi");

  const filtered = specialists.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === "Hammasi") return true;
    if (activeFilter === "O'qituvchiler") return s.category === "Ta'lim";
    if (activeFilter === "Senior") return s.experienceLevel === "Senior";
    if (activeFilter === "Masofaviy") return false;
    return s.tags.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase())) || s.title.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-surface">
      {/* Top promo banner */}
      <div className="bg-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2">
          <span className="text-white/80 text-xs">🔥 Yangi mutaxassislar qo'shildi —</span>
          <Link to="/specialists" className="text-white text-xs font-semibold hover:underline">Hozir ko'ring →</Link>
        </div>
      </div>

      {/* Search section */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Category filters */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {allFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === f
                    ? "bg-ink text-white"
                    : "bg-surface text-ink-2 border border-border hover:border-ink/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Promo banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-ink to-ink/80 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full -mb-8" />
            <div className="relative">
              <div className="text-xs font-medium text-white/60 mb-2">TAVSIYA ETILADI</div>
              <h3 className="text-lg font-semibold mb-1">Eng yaxshi Frontend dasturchilar</h3>
              <p className="text-sm text-white/70 mb-4">React, Next.js, TypeScript bo'yicha mutaxassislar</p>
              <Link to="/specialists" className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 px-4 py-2 rounded-lg hover:bg-white/25 transition-colors">
                Ko'rish <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full -mb-8" />
            <div className="relative">
              <div className="text-xs font-medium text-white/60 mb-2">YANGI</div>
              <h3 className="text-lg font-semibold mb-1">Ingliz tili o'qituvchilari</h3>
              <p className="text-sm text-white/70 mb-4">IELTS 7+ darajadagi tajribali o'qituvchilar</p>
              <Link to="/specialists" className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 px-4 py-2 rounded-lg hover:bg-white/25 transition-colors">
                Ko'rish <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Tavsiya etilgan mutaxassislar</h2>
            <p className="text-sm text-ink-3 mt-0.5">{filtered.length} ta natija</p>
          </div>
          <Link to="/specialists" className="text-sm font-medium text-ink-2 hover:text-ink transition-colors hidden sm:block">
            Hammasini ko'rish →
          </Link>
        </div>

        {/* Specialist cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/vacancies`}
              className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group relative"
            >
              {/* Match badge */}
              <div className="absolute top-3 right-3">
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.matchPercent >= 80 ? "bg-emerald-50 text-emerald-600" :
                  s.matchPercent >= 60 ? "bg-amber-50 text-amber-600" :
                  "bg-red-50 text-red-500"
                }`}>
                  {s.matchPercent}% mos
                </div>
              </div>

              {/* Heart */}
              <button className="absolute top-3 left-3 p-1.5 rounded-full text-ink-3 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => e.preventDefault()}>
                <Heart className="w-4 h-4" />
              </button>

              {/* Avatar */}
              <div className="w-16 h-16 mx-auto mb-3 bg-ink rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {s.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>

              {/* Info */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-semibold text-ink text-sm truncate">{s.name}</h3>
                  {s.verified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-xs text-ink-2 mt-0.5 truncate">{s.title}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-3.5 h-3.5 text-ink fill-ink" />
                <span className="text-xs font-medium text-ink">{s.rating}</span>
                <span className="text-xs text-ink-3">({s.reviews})</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                <StatusBadge status={s.experienceLevel} />
                {s.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-surface text-ink-3 rounded text-[10px] font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Location + salary */}
              <div className="text-center border-t border-border pt-3">
                <div className="flex items-center justify-center gap-1 text-xs text-ink-3 mb-1">
                  <MapPin className="w-3 h-3" /> {s.location}
                </div>
                <div className="text-xs font-semibold text-ink">{s.salary}</div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-ink mb-1">Natija topilmadi</h3>
            <p className="text-sm text-ink-3">Boshqa so'z bilan qidirib ko'ring</p>
          </div>
        )}

        {/* Categories section */}
        <div className="mt-10 mb-6">
          <h2 className="text-lg font-semibold text-ink mb-5">Yo'nalishlar bo'yicha</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to="/specialists"
                className="bg-white rounded-xl border border-border p-4 hover:border-ink/20 hover:shadow-sm transition-all text-center group"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-medium text-ink text-sm group-hover:text-ink/80 transition-colors">{cat.name}</div>
                <div className="text-xs text-ink-3 mt-0.5">{cat.count} ta</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicLanding() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-border rounded-full px-3.5 py-1.5 mb-8 text-ink-2">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium">O'zbekistondagi #1 HR platformasi</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold text-ink leading-[1.08] tracking-tight mb-6 text-balance">
              IT mutaxassislar va o'qituvchilar uchun professional platforma
            </h1>
            <p className="text-lg text-ink-2 mb-10 max-w-xl leading-relaxed">
              Eng yaxshi vakansiyalarni toping yoki malakali kadrlarni jalb qiling. Sun'iy intellekt bilan ishlaydigan moslik tizimi sizni to'g'ri bilan bog'laydi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-ink text-white font-medium px-6 py-3.5 rounded-lg hover:bg-ink/90 transition-colors">
                Ish izlayapman <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 border border-border text-ink font-medium px-6 py-3.5 rounded-lg hover:border-ink/30 transition-colors">
                Xodim izlayapman
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Mutaxassislar", value: stats.specialists.toLocaleString(), icon: Users },
              { label: "Vakansiyalar", value: stats.vacancies.toLocaleString(), icon: Briefcase },
              { label: "Muvaffaqiyatli joylashish", value: stats.placements.toLocaleString(), icon: TrendingUp },
              { label: "Kompaniyalar", value: stats.companies.toLocaleString(), icon: Star },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="w-4 h-4 text-ink-3 mb-3" strokeWidth={1.75} />
                <div className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">{stat.value}</div>
                <div className="text-ink-3 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-3">Qanday ishlaydi?</h2>
            <p className="text-ink-3 text-base">Faqat 3 oddiy qadam orqali o'zingizga mos ishni toping</p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {[
              { step: "01", title: "Profil yarating", desc: "Mutaxassisligingiz, ko'nikmalaringiz va tajribangizni kiriting.", icon: Users },
              { step: "02", title: "Moslikni ko'ring", desc: "Sun'iy intellekt sizning ko'nikmalaringizga mos vakansiyalarni topadi.", icon: Zap },
              { step: "03", title: "Bog'laning", desc: "Qiziqtirgan vakansiyaga ariza yuboring va kompaniya bilan bog'laning.", icon: CheckCircle },
            ].map((item) => (
              <div key={item.step} className="bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                    <item.icon className="w-[18px] h-[18px] text-ink" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-ink-3 tabular-nums">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-ink mb-2">{item.title}</h3>
                <p className="text-ink-3 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: Shield, title: "Verifikatsiya tizimi", desc: "Har bir foydalanuvchi tekshiriladi. Faqat haqiqiy mutaxassislar va ishonchli kompaniyalar." },
              { icon: Zap, title: "AI moslik tizimi", desc: "Sun'iy intellekt sizning ko'nikmalaringizga eng mos vakansiyalarni avtomatik topadi." },
              { icon: Star, title: "Sifat kafolati", desc: "Reyting va sharhlar tizimi orqali eng yaxshi mutaxassislar va kompaniyalarni aniqlang." },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="w-5 h-5 text-accent mb-4" strokeWidth={1.75} />
                <h3 className="text-ink font-semibold mb-2">{item.title}</h3>
                <p className="text-ink-3 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-3">O'z karerangizni bugun boshlang</h2>
          <p className="text-ink-3 text-base mb-8">Minglab mutaxassislar allaqachon TalentHub orqali o'zlariga mos ishni topishdi</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-ink text-white font-medium px-6 py-3.5 rounded-lg hover:bg-ink/90 transition-colors">
              Bepul ro'yxatdan o'ting <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/vacancies" className="inline-flex items-center justify-center gap-2 text-ink font-medium px-6 py-3.5 rounded-lg hover:bg-surface transition-colors">
              Vakansiyalarni ko'rish
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Landing() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <LoggedInHome /> : <PublicLanding />;
}
