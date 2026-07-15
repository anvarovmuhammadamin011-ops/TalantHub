import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Briefcase, Package, TrendingUp, ArrowRight, MessageSquare, Sparkles, Plus, Star, MapPin } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import MatchIndicator from "../components/ui/MatchIndicator";
import VerifiedBadge from "../components/ui/VerifiedBadge";

const weekdays = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function groupByWeekday(items) {
  const counts = new Array(7).fill(0);
  const now = Date.now();
  for (const item of items) {
    const t = new Date(item.created_at + "Z").getTime();
    if (now - t > 7 * 86400000) continue;
    counts[new Date(item.created_at + "Z").getDay()] += 1;
  }
  return weekdays.map((day, i) => ({ day, count: counts[i] }));
}

export default function EmployerHome() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vacData, appData, orderData, specData, chatData] = await Promise.all([
          api("/vacancies/mine"),
          api("/applications/employer"),
          api("/orders"),
          api("/specialists"),
          api("/chats").catch(() => ({ chats: [] })),
        ]);
        setVacancies(vacData.vacancies || []);
        setApplications(appData.applications || []);
        setOrders(orderData.orders || []);
        setSpecialists(specData.specialists || []);
        setChats((chatData.chats || []).filter((c) => c.unread_count > 0).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>
      </div>
    );
  }

  const activeVacancies = vacancies.filter((v) => (v.status || "Faol") === "Faol");
  const activeOrders = orders.filter((o) => o.status === "Jarayonda" || o.status === "Qabul qilindi");
  const pendingApplications = applications.filter((a) => a.status === "Yuborildi");
  const acceptedCount = applications.filter((a) => a.status === "Qabul qilindi" || a.status === "Interview").length;
  const acceptRate = applications.length > 0 ? Math.round((acceptedCount / applications.length) * 100) : 0;

  const weekData = groupByWeekday(applications);

  const topSpecialists = [...specialists]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  const recentApplications = applications.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight mb-1">Assalomu alaykum, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-ink-3">
            {pendingApplications.length > 0 ? `${pendingApplications.length} ta ariza javob kutmoqda` : "Bugungi holatingiz"}
          </p>
        </div>
        <Link to="/vacancies/new" className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
          <Plus className="w-4 h-4" /> Yangi vakansiya
        </Link>
      </div>

      {/* 1. Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink mb-2">
            <Briefcase className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{activeVacancies.length}</div>
          <div className="text-xs text-ink-3 mt-0.5">Faol vakansiyalar</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 mb-2">
            <Users className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{pendingApplications.length}</div>
          <div className="text-xs text-ink-3 mt-0.5">Ko'rilmagan arizalar</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 mb-2">
            <Package className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{activeOrders.length}</div>
          <div className="text-xs text-ink-3 mt-0.5">Faol buyurtmalar</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 mb-2">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{acceptRate}%</div>
          <div className="text-xs text-ink-3 mt-0.5">Qabul qilish foizi</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Pending applications needing action */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">Ko'rilmagan arizalar</h2>
              <Link to="/applications" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {recentApplications.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 text-center">
                <Users className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                <p className="text-sm text-ink-3">Hozircha ariza yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApplications.map((app) => (
                  <Link key={app.id} to="/applications" className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-sm font-medium text-ink-2 flex-shrink-0">
                      {app.specialist_name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ink text-sm truncate">{app.specialist_name}</h3>
                      <p className="text-xs text-ink-3 mt-0.5">{app.specialist_category}</p>
                    </div>
                    <MatchIndicator percent={app.match_percent} size="sm" />
                    <StatusBadge status={app.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 3. Top specialists to hire */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">Tavsiya etilgan mutaxassislar</h2>
              <Link to="/specialists" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {topSpecialists.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 text-center">
                <p className="text-sm text-ink-3">Hozircha mutaxassis topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topSpecialists.map((s) => (
                  <Link key={s.id} to={`/specialists/${s.id}`}
                    className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
                    <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">{s.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-medium text-ink text-sm truncate">{s.name}</h3>
                        {!!s.verified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-ink-3 mt-0.5 truncate">{s.category}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-3">
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-ink fill-ink" /> {s.rating}</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {s.city}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 6. Weekly Activity */}
          <div>
            <h2 className="text-base font-semibold text-ink mb-3">Haftalik arizalar</h2>
            <div className="bg-white rounded-xl border border-border p-5">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={false} contentStyle={{ borderRadius: 8, border: "1px solid #F0F0F1", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#3730A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* 4. My vacancies */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">Vakansiyalarim</h2>
              <Link to="/vacancies/new" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Yangi <Plus className="w-3 h-3 inline" /></Link>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              {activeVacancies.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-ink-3 mb-3">Hali faol vakansiya yo'q</p>
                  <Link to="/vacancies/new" className="text-sm font-medium text-accent hover:underline">Vakansiya yaratish</Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {activeVacancies.slice(0, 4).map((v) => (
                    <Link key={v.id} to={`/vacancies/${v.id}`} className="block p-2.5 -mx-2.5 rounded-lg hover:bg-surface transition-colors">
                      <div className="font-medium text-ink text-sm truncate">{v.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-3">
                        <span>{v.location}</span>
                        <span>·</span>
                        <span>{v.applications_count} ta ariza</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 5. Recent Chat Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">Yangi xabarlar</h2>
              <Link to="/chat" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {chats.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-5 text-center">
                <MessageSquare className="w-7 h-7 text-ink-3 mx-auto mb-2" />
                <p className="text-xs text-ink-3">O'qilmagan xabarlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((c) => (
                  <Link key={c.id} to="/chat"
                    className="bg-white rounded-xl border border-border p-3 hover:border-ink/10 transition-colors flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-xs font-medium text-ink-2 flex-shrink-0">
                      {c.other_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink truncate">{c.other_name}</span>
                        <span className="text-[10px] text-ink-3 flex-shrink-0 ml-2">{c.unread_count}</span>
                      </div>
                      <p className="text-xs text-ink-3 truncate mt-0.5">{c.last_message}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 7. AI Assistant Banner */}
          <Link to="/ai-chat"
            className="bg-gradient-to-br from-ink to-ink/70 rounded-xl p-5 text-white block hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <Sparkles className="w-6 h-6 text-white/40 mb-2" />
              <h3 className="font-semibold text-sm mb-1">AI Kadrlar yordamchisi</h3>
              <p className="text-xs text-white/60 mb-2">Qanday mutaxassis kerakligini yozing — topib beramiz</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-lg">
                Sinab ko'ring <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
