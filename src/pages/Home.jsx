import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Clock, CheckCircle, Star, MessageSquare, Briefcase, ArrowRight, TrendingUp, AlertCircle, Sparkles, User, FileText, Loader2, Bot, Search, SlidersHorizontal, Code2, Server, Smartphone, Languages, Calculator, GraduationCap, LayoutGrid, ShieldCheck, Wallet, MapPinned, Zap } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import Notifications from "../components/ui/Notifications";
import { useT } from "../context/I18nContext";

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

const trustSignals = [
  { key: "verified", icon: ShieldCheck },
  { key: "pricing", icon: Wallet },
  { key: "aiMatch", icon: Zap },
  { key: "payment", icon: MapPinned },
];

const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function groupByWeekday(items) {
  const counts = new Array(7).fill(0);
  const now = Date.now();
  for (const item of items) {
    const ts = new Date(item.created_at + "Z").getTime();
    if (now - ts > 7 * 86400000) continue;
    counts[new Date(item.created_at + "Z").getDay()] += 1;
  }
  return counts;
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const showToast = useToast();
  const [homeSearch, setHomeSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [vacancies, setVacancies] = useState([]);
  const [matchedVacancies, setMatchedVacancies] = useState([]);
  const [aiMatching, setAiMatching] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
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
        showToast(err.message || t("pages.home.loadError"), "error");
      } finally {
        setLoading(false);
      }

      try {
        setAiMatching(true);
        const aiData = await api("/ai/match-jobs", { method: "POST" });
        setMatchedVacancies(aiData.matches || []);
        setAiUsed(aiData.ai || false);
      } catch {
        const vacRes = await api("/vacancies");
        const allVac = (vacRes.vacancies || []).slice(0, 6);
        setMatchedVacancies(allVac.map((v) => ({ ...v, matchPercent: 50, reasons: [] })));
        setAiUsed(false);
      } finally {
        setAiMatching(false);
      }
    }
    load();
  }, []);

  const updateOrderStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api(`/orders/${id}/status`, { method: "PATCH", body: { status } });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.home.statusUpdateError"), "error");
    }
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

  const weekDayCounts = groupByWeekday(orders);
  const weekData = weekdayKeys.map((key, i) => ({ day: t(`pages.home.weekday.${key}`), count: weekDayCounts[i] }));
  const activeOrders = orders.filter((o) => o.status === "Yangi" || o.status === "Qabul qilindi" || o.status === "Jarayonda");
  const completedOrders = orders.filter((o) => o.status === "Tugatildi").slice(0, 4);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20 text-ink-3 text-sm">{t("common.loading")}</div>
      </div>
    );
  }

  const goSearch = (query) => {
    const q = query.trim();
    navigate(q ? `/vacancies?search=${encodeURIComponent(q)}` : "/vacancies");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight mb-1">{t("pages.home.greeting", { name: user?.name?.split(" ")[0] || "" })}</h1>
          <p className="text-sm text-ink-3">{t("pages.home.subtitle")}</p>
        </div>
        <div className="flex-shrink-0 md:hidden">
          <Notifications />
        </div>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); goSearch(homeSearch); }}
        className="flex gap-3 mb-6"
      >
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("pages.home.searchPlaceholder")}
            value={homeSearch}
            onChange={(e) => setHomeSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors bg-white text-sm"
          />
        </div>
        <Link to="/vacancies" className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-white text-ink-2 hover:border-ink/30 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </Link>
      </form>

      {/* Hero banner */}
      <Link
        to="/chat?ai=1"
        className="block bg-gradient-to-br from-ink via-ink to-ink/80 rounded-2xl p-6 text-white relative overflow-hidden mb-6 hover:shadow-lg transition-shadow"
      >
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute right-8 bottom-0 w-24 h-24 bg-white/5 rounded-full -mb-10" />
        <div className="relative max-w-sm">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/15 px-2.5 py-1 rounded-full mb-3">
            <Sparkles className="w-3 h-3" /> {t("pages.home.aiAssistantBadge")}
          </span>
          <h2 className="text-lg sm:text-xl font-semibold mb-1.5">{t("pages.home.aiHeroTitle")}</h2>
          <p className="text-sm text-white/70 mb-4">{t("pages.home.aiHeroDescription")}</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white text-ink px-4 py-2 rounded-lg">
              <Bot className="w-3.5 h-3.5" /> {t("pages.home.aiSearchLabel")}
            </span>
            <span
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate("/vacancies"); }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {t("pages.home.viewVacancies")}
            </span>
          </div>
        </div>
      </Link>

      {/* Popular categories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">{t("pages.home.popularCategoriesTitle")}</h2>
          <Link to="/vacancies" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">{t("common.seeAll")} <ArrowRight className="w-3 h-3 inline" /></Link>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {popularCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => cat.query ? goSearch(cat.query) : navigate("/vacancies")}
              className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4 rounded-xl border border-border bg-white hover:border-ink/20 transition-colors"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <cat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-ink-2 text-center leading-tight">{t(`pages.home.category.${cat.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {trustSignals.map((signal) => (
          <div key={signal.key} className="flex flex-col items-center text-center gap-1.5 bg-white border border-border rounded-xl p-3">
            <signal.icon className="w-4 h-4 text-ink-2" />
            <span className="text-[10px] sm:text-[11px] font-medium text-ink-3 leading-tight">{t(`pages.home.trust.${signal.key}`)}</span>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 mb-2">
            <Package className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{orderStats.active || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">{t("pages.home.statActiveOrders")}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 mb-2">
            <AlertCircle className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{orderStats.new || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">{t("pages.home.statPendingResponse")}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-ink/5 text-ink mb-2">
            <Star className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{user?.rating || 0}</div>
          <div className="text-xs text-ink-3 mt-0.5">{t("pages.home.statOverallRating")}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 mb-2">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
          <div className="text-2xl font-bold text-ink">{applications.length > 0 ? Math.round((applications.filter((a) => a.status === "Qabul qilindi" || a.status === "Interview").length / applications.length) * 100) : 0}%</div>
          <div className="text-xs text-ink-3 mt-0.5">{t("pages.home.statAcceptanceRate")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Active Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">{t("pages.home.statActiveOrders")}</h2>
              <Link to="/orders" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">{t("common.seeAll")} <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 text-center">
                <Package className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                <p className="text-sm text-ink-3">{t("pages.home.noActiveOrders")}</p>
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
                              o.priority === "Yuqori" ? "bg-red-50 text-red-500" : o.priority === "O'rta" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                            }`}>{t(`pages.home.priority.${o.priority}`)}</span>
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
                            {updatingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t("pages.home.acceptOrder")}
                          </button>
                          <button onClick={() => updateOrderStatus(o.id, "Bekor qilindi")} disabled={updatingId === o.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                            {t("common.reject")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed work */}
          {completedOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-ink">{t("pages.home.completedWorkTitle")}</h2>
                <Link to="/orders" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">{t("common.seeAll")} <ArrowRight className="w-3 h-3 inline" /></Link>
              </div>
              <div className="space-y-2">
                {completedOrders.map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-ink text-sm">{o.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                          <span>{o.employer_name}</span>
                          <span>·</span>
                          <span>{o.price}</span>
                        </div>
                        {o.review && <p className="text-xs text-ink-3 mt-1.5 italic">"{o.review}"</p>}
                      </div>
                      {o.rating > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-500 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500" /> {o.rating}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-3 flex-shrink-0">{t("pages.home.notRated")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. AI Matched Vacancies */}
          {(matchedVacancies.length > 0 || aiMatching) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">{t("pages.home.aiMatchedTitle")}</h2>
                  {aiUsed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      <Bot className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <Link to="/vacancies" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">{t("common.seeAll")} <ArrowRight className="w-3 h-3 inline" /></Link>
              </div>
              {aiMatching ? (
                <div className="bg-white rounded-xl border border-border p-6 text-center">
                  <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
                  <p className="text-xs text-ink-3">{t("pages.home.aiMatching")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchedVacancies.slice(0, 6).map((v) => (
                    <Link key={v.id} to={`/vacancies/${v.id}`}
                      className="bg-white rounded-xl border border-border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className="mb-2">
                        <h3 className="font-medium text-ink text-sm truncate">{v.title}</h3>
                        <p className="text-xs text-ink-3 mt-0.5">{v.company} · {v.location}</p>
                      </div>
                      {v.reasons && v.reasons.length > 0 && (
                        <div className="mb-2 space-y-0.5">
                          {v.reasons.slice(0, 2).map((r, i) => (
                            <p key={i} className="text-[10px] text-accent flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                              {r}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(v.tags || []).slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-surface text-ink-3 rounded text-[10px] font-medium">{tag}</span>
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-ink">{v.salary}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. Weekly Activity */}
          <div>
            <h2 className="text-base font-semibold text-ink mb-3">{t("pages.home.weeklyActivityTitle")}</h2>
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
            <h2 className="text-base font-semibold text-ink mb-3">{t("pages.home.profileStatusTitle")}</h2>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ink">{t("pages.home.filledLabel")}</span>
                <span className="text-sm font-bold text-ink">{profileCompleteness}%</span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-3">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${profileCompleteness}%` }} />
              </div>
              {user?.verified ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> {t("pages.home.profileVerified")}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-ink-3">{t("pages.home.profileCompletenessMsg", { percent: profileCompleteness })}</p>
                  {profileCompleteness < 80 && (
                    <Link to="/profile" className="text-xs font-medium text-accent hover:underline">{t("pages.home.completeProfile")} <ArrowRight className="w-3 h-3 inline" /></Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. Recent Chat Messages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">{t("pages.home.newMessagesTitle")}</h2>
              <Link to="/chat" className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">{t("common.seeAll")} <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {chats.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-5 text-center">
                <MessageSquare className="w-7 h-7 text-ink-3 mx-auto mb-2" />
                <p className="text-xs text-ink-3">{t("pages.home.noUnreadMessages")}</p>
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
        </div>
      </div>
    </div>
  );
}
