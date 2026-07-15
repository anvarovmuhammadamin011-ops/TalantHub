import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Clock, CheckCircle, Star, MessageSquare, Briefcase, ArrowRight, TrendingUp, AlertCircle, Sparkles, User, FileText, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { computeMatch } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import MatchIndicator from "../components/ui/MatchIndicator";

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

export default function Home() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [vacancies, setVacancies] = useState([]);
  const [chats, setChats] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [orderData, vacData, chatData, appData] = await Promise.all([
          api("/orders"),
          api("/vacancies"),
          api("/chats").catch(() => ({ chats: [] })),
          api("/applications").catch(() => ({ applications: [] })),
        ]);
        setOrders(orderData.orders || []);
        setOrderStats(orderData.stats || {});
        setVacancies((vacData.vacancies || []).slice(0, 20));
        setChats((chatData.chats || []).filter((c) => c.unread_count > 0).slice(0, 3));
        setApplications(appData.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateOrderStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api(`/orders/${id}/status`, { method: "PATCH", body: { status } });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const profileCompleteness = (() => {
    const fields = ["name", "email", "phone", "city", "category", "bio", "avatar", "experience"];
    const filled = fields.filter((f) => user && user[f] && user[f] !== "" && user[f] !== "[]");
    const skills = user?.skills?.length > 0 ? 1 : 0;
    const certs = user?.certificates?.length > 0 ? 1 : 0;
    const total = fields.length + 2;
    const done = filled.length + skills + certs;
    return Math.round((done / total) * 100);
  })();

  const matchedVacancies = vacancies
    .map((v) => ({ ...v, matchPercent: computeMatch(user?.skills, v.tags || []) }))
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 4);

  const weekData = groupByWeekday(orders);
  const activeOrders = orders.filter((o) => o.status === "Yangi" || o.status === "Qabul qilindi" || o.status === "Jarayonda");

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* 1. Quick Stats */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink tracking-tight mb-1">Assalomu alaykum, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-ink-3">Bugungi holatingiz</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 mb-2">
            <Package className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{orderStats.active || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">Faol buyurtmalar</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 mb-2">
            <AlertCircle className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{orderStats.new || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">Javob kutayotgan</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink mb-2">
            <Star className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{user?.rating || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">Umumiy reyting</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 mb-2">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{applications.length > 0 ? Math.round((applications.filter((a) => a.status === "Qabul qilindi" || a.status === "Interview").length / applications.length) * 100) : 0}%</div>
          <div className="text-xs text-ink-3 mt-0.5">Qabul qilish foizi</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Active Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">Faol buyurtmalar</h2>
              <Link to="/orders" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 text-center">
                <Package className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                <p className="text-sm text-ink-3">Hozircha faol buyurtmalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeOrders.slice(0, 4).map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-ink text-sm">{o.title}</h3>
                          <StatusBadge status={o.status} />
                          {o.priority && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              o.priority === "Yuqori" ? "bg-red-50 text-red-500" : o.priority === "Orta" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                            }`}>{o.priority}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                          <span>{o.employer_name}</span>
                          <span>·</span>
                          <span>{o.price}</span>
                          {o.deadline && <><span>·</span><span>{o.deadline}</span></>}
                        </div>
                      </div>
                      {o.status === "Yangi" && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => updateOrderStatus(o.id, "Qabul qilindi")} disabled={updatingId === o.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-ink text-white hover:bg-ink/90 transition-colors disabled:opacity-50">
                            {updatingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Qabul qilish"}
                          </button>
                          <button onClick={() => updateOrderStatus(o.id, "Bekor qilindi")} disabled={updatingId === o.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                            Rad etish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Matched Vacancies */}
          {matchedVacancies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-ink">Sizga mos takliflar</h2>
                <Link to="/vacancies" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Hammasini ko'rish <ArrowRight className="w-3 h-3 inline" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedVacancies.map((v) => (
                  <Link key={v.id} to={`/vacancies/${v.id}`}
                    className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-ink text-sm truncate">{v.title}</h3>
                        <p className="text-xs text-ink-3 mt-0.5">{v.company} · {v.location}</p>
                      </div>
                      <MatchIndicator percent={v.matchPercent} size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(v.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-surface text-ink-3 rounded text-[10px] font-medium">{tag}</span>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-ink">{v.salary}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 6. Weekly Activity */}
          <div>
            <h2 className="text-base font-semibold text-ink mb-3">Haftalik faollik</h2>
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* 4. Profile Completeness */}
          <div>
            <h2 className="text-base font-semibold text-ink mb-3">Profil holati</h2>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ink">To'ldirilgan</span>
                <span className="text-sm font-bold text-ink">{profileCompleteness}%</span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-3">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${profileCompleteness}%` }} />
              </div>
              {user?.verified ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> Profilingiz tasdiqlangan
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-ink-3">Profilingiz {profileCompleteness}% to'ldirilgan. To'liq profil ko'proq buyurtma oladi.</p>
                  {profileCompleteness < 80 && (
                    <Link to="/profile" className="text-xs font-medium text-accent hover:underline">Profilni to'ldirish <ArrowRight className="w-3 h-3 inline" /></Link>
                  )}
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
