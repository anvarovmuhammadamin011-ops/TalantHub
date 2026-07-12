import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Users, Briefcase, TrendingUp, Star, CheckCircle, Shield, Zap } from "lucide-react";
import { categories, stats } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/vacancies" replace />;
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
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-ink text-white font-medium px-6 py-3.5 rounded-lg hover:bg-ink/90 transition-colors"
              >
                Ish izlayapman
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-border text-ink font-medium px-6 py-3.5 rounded-lg hover:border-ink/30 transition-colors"
              >
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
              {
                step: "01",
                title: "Profil yarating",
                desc: "Mutaxassisligingiz, ko'nikmalaringiz va tajribangizni kiriting. Tizim avtomatik profilingizni tahlil qiladi.",
                icon: Users,
              },
              {
                step: "02",
                title: "Moslikni ko'ring",
                desc: "Sun'iy intellekt sizning ko'nikmalaringizga mos vakansiyalarni topadi va moslik foizini ko'rsatadi.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Bog'laning",
                desc: "Qiziqtirgan vakansiyaga ariza yuboring va to'g'ridan-to'g'ri kompaniya bilan chat orqali bog'laning.",
                icon: CheckCircle,
              },
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

      {/* Categories */}
      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-3">Mashhur kategoriyalar</h2>
            <p className="text-ink-3 text-base">O'zingizga mos yo'nalishni tanlang</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to="/vacancies"
                className="border border-border rounded-xl p-5 hover:border-ink/30 transition-colors group"
              >
                <div className="text-2xl mb-4">{cat.icon}</div>
                <div className="font-medium text-ink text-sm mb-1">{cat.name}</div>
                <div className="text-xs text-ink-3">{cat.count} vakansiya</div>
              </Link>
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
          <h2 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-3">
            O'z karerangizni bugun boshlang
          </h2>
          <p className="text-ink-3 text-base mb-8">
            Minglab mutaxassislar allaqachon TalentHub orqali o'zlariga mos ishni topishdi
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-ink text-white font-medium px-6 py-3.5 rounded-lg hover:bg-ink/90 transition-colors"
            >
              Bepul ro'yxatdan o'ting
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/vacancies"
              className="inline-flex items-center justify-center gap-2 text-ink font-medium px-6 py-3.5 rounded-lg hover:bg-surface transition-colors"
            >
              Vakansiyalarni ko'rish
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
