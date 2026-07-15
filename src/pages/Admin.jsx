import { useState, useEffect } from "react";
import { Shield, Users, Briefcase, Package, TrendingUp, CheckCircle, AlertCircle, Search, Eye, EyeOff, Trash2, UserX, UserCheck, Clock, Star, CreditCard, Tag, MessageSquare, Activity, HeartPulse, Globe, Flag, ChevronDown, ChevronUp, Plus, X, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [vacancies, setVacancies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [vacSearch, setVacSearch] = useState("");
  const [vacStatusFilter, setVacStatusFilter] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [txData, setTxData] = useState({ transactions: [], total: 0 });
  const [financeStats, setFinanceStats] = useState({});
  const [txMethodFilter, setTxMethodFilter] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [txPeriod, setTxPeriod] = useState("");

  const [tariffs, setTariffs] = useState([]);
  const [showTariffForm, setShowTariffForm] = useState(false);
  const [tariffForm, setTariffForm] = useState({ name: "", price: "", duration_days: "30", max_vacancies: "3", max_contacts: "10" });

  const [promos, setPromos] = useState([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", discount_percent: "10", max_uses: "100", tariff_id: "", expires_at: "" });

  const [smsData, setSmsData] = useState({ logs: [], stats: {} });
  const [pushData, setPushData] = useState({ logs: [], stats: {} });

  const [health, setHealth] = useState({});

  const [translations, setTranslations] = useState([]);
  const [transLang, setTransLang] = useState("uz");
  const [transSearch, setTransSearch] = useState("");
  const [showTransForm, setShowTransForm] = useState(false);
  const [transForm, setTransForm] = useState({ key: "", lang: "uz", value: "" });

  const [flags, setFlags] = useState([]);
  const [flagStatusFilter, setFlagStatusFilter] = useState("");

  useEffect(() => { loadTab(); }, [tab]);

  useEffect(() => { if (tab === "users") loadUsers(); }, [userSearch, userRoleFilter, userStatusFilter]);
  useEffect(() => { if (tab === "vacancies") loadVacancies(); }, [vacSearch, vacStatusFilter]);
  useEffect(() => { if (tab === "orders") loadOrders(); }, [orderStatusFilter]);
  useEffect(() => { if (tab === "finance") { loadTransactions(); loadFinanceStats(); } }, [txMethodFilter, txStatusFilter, txPeriod]);
  useEffect(() => { if (tab === "tariffs") loadTariffs(); }, [showTariffForm]);
  useEffect(() => { if (tab === "promos") loadPromos(); }, [showPromoForm]);
  useEffect(() => { if (tab === "sms") loadSms(); }, []);
  useEffect(() => { if (tab === "push") loadPush(); }, []);
  useEffect(() => { if (tab === "health") loadHealth(); }, []);
  useEffect(() => { if (tab === "i18n") loadTranslations(); }, [transLang]);
  useEffect(() => { if (tab === "flags") loadFlags(); }, [flagStatusFilter]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === "overview") { const d = await api("/admin/stats"); setStats(d); }
      else if (tab === "users") await loadUsers();
      else if (tab === "vacancies") await loadVacancies();
      else if (tab === "orders") await loadOrders();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    const p = new URLSearchParams();
    if (userSearch) p.set("search", userSearch);
    if (userRoleFilter) p.set("role", userRoleFilter);
    if (userStatusFilter) p.set("status", userStatusFilter);
    const d = await api(`/admin/users?${p.toString()}`);
    setUsers(d.users); setUsersTotal(d.total);
  };

  const loadVacancies = async () => {
    const p = new URLSearchParams();
    if (vacSearch) p.set("search", vacSearch);
    if (vacStatusFilter) p.set("status", vacStatusFilter);
    const d = await api(`/admin/vacancies?${p.toString()}`);
    setVacancies(d.vacancies);
  };

  const loadOrders = async () => {
    const p = new URLSearchParams();
    if (orderStatusFilter) p.set("status", orderStatusFilter);
    const d = await api(`/admin/orders?${p.toString()}`);
    setOrders(d.orders);
  };

  const loadTransactions = async () => {
    const p = new URLSearchParams();
    if (txMethodFilter) p.set("method", txMethodFilter);
    if (txStatusFilter) p.set("status", txStatusFilter);
    if (txPeriod) p.set("period", txPeriod);
    const d = await api(`/admin/finance/transactions?${p.toString()}`);
    setTxData(d);
  };

  const loadFinanceStats = async () => { try { const d = await api("/admin/finance/stats"); setFinanceStats(d); } catch {} };
  const loadTariffs = async () => { try { const d = await api("/admin/tariffs"); setTariffs(d.tariffs); } catch {} };
  const loadPromos = async () => { try { const d = await api("/admin/promos"); setPromos(d.promos); } catch {} };
  const loadSms = async () => { try { const d = await api("/admin/sms"); setSmsData(d); } catch {} };
  const loadPush = async () => { try { const d = await api("/admin/push"); setPushData(d); } catch {} };
  const loadHealth = async () => { try { const d = await api("/admin/health"); setHealth(d); } catch {} };
  const loadTranslations = async () => {
    const p = new URLSearchParams();
    if (transLang) p.set("lang", transLang);
    if (transSearch) p.set("search", transSearch);
    try { const d = await api(`/admin/translations?${p.toString()}`); setTranslations(d.translations); } catch {}
  };
  const loadFlags = async () => {
    const p = new URLSearchParams();
    if (flagStatusFilter) p.set("status", flagStatusFilter);
    try { const d = await api(`/admin/flags?${p.toString()}`); setFlags(d.flags); } catch {}
  };

  const toggleVerified = async (id, current) => {
    setUpdatingId(id);
    try { await api(`/admin/users/${id}`, { method: "PATCH", body: { verified: !current } }); setUsers((prev) => prev.map((u) => u.id === id ? { ...u, verified: current ? 0 : 1 } : u)); } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const toggleBlock = async (id, current) => {
    if (!confirm(current ? "Foydalanuvchini bloklashni xohlaysizmi?" : "Bloklashni bekor qilishni xohlaysizmi?")) return;
    setUpdatingId(id);
    try { await api(`/admin/users/${id}`, { method: "PATCH", body: { blocked: !current, blocked_reason: current ? "" : "Admin tomonidan bloklangan" } }); setUsers((prev) => prev.map((u) => u.id === id ? { ...u, blocked: current ? 0 : 1 } : u)); } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const toggleVacStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Faol" ? "Nofaol" : "Faol";
    try { await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: newStatus } }); setVacancies((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v)); } catch (err) { console.error(err); }
  };

  const deleteVacancy = async (id) => {
    if (!confirm("Vakansiyani o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/vacancies/${id}`, { method: "DELETE" }); setVacancies((prev) => prev.filter((v) => v.id !== id)); } catch (err) { console.error(err); }
  };

  const processRefund = async (id) => {
    if (!confirm("Tranzaksiyani qaytarishni xohlaysizmi?")) return;
    try { await api(`/admin/finance/transactions/${id}/refund`, { method: "PATCH" }); loadTransactions(); loadFinanceStats(); } catch (err) { console.error(err); }
  };

  const createTariff = async () => {
    if (!tariffForm.name || !tariffForm.price) return;
    try { await api("/admin/tariffs", { method: "POST", body: { ...tariffForm, price: Number(tariffForm.price), duration_days: Number(tariffForm.duration_days), max_vacancies: Number(tariffForm.max_vacancies), max_contacts: Number(tariffForm.max_contacts) } }); setShowTariffForm(false); setTariffForm({ name: "", price: "", duration_days: "30", max_vacancies: "3", max_contacts: "10" }); loadTariffs(); } catch (err) { console.error(err); }
  };

  const deleteTariff = async (id) => {
    if (!confirm("Tarifni o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/tariffs/${id}`, { method: "DELETE" }); loadTariffs(); } catch (err) { console.error(err); }
  };

  const toggleTariff = async (id, active) => {
    try { await api(`/admin/tariffs/${id}`, { method: "PATCH", body: { active: !active } }); loadTariffs(); } catch (err) { console.error(err); }
  };

  const createPromo = async () => {
    if (!promoForm.code) return;
    try { await api("/admin/promos", { method: "POST", body: { ...promoForm, discount_percent: Number(promoForm.discount_percent), max_uses: Number(promoForm.max_uses), tariff_id: promoForm.tariff_id ? Number(promoForm.tariff_id) : null } }); setShowPromoForm(false); setPromoForm({ code: "", discount_percent: "10", max_uses: "100", tariff_id: "", expires_at: "" }); loadPromos(); } catch (err) { console.error(err); }
  };

  const togglePromo = async (id, active) => {
    try { await api(`/admin/promos/${id}`, { method: "PATCH", body: { active: !active } }); loadPromos(); } catch (err) { console.error(err); }
  };

  const deletePromo = async (id) => {
    if (!confirm("Promo-kodni o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/promos/${id}`, { method: "DELETE" }); loadPromos(); } catch (err) { console.error(err); }
  };

  const createTranslation = async () => {
    if (!transForm.key || !transForm.lang) return;
    try { await api("/admin/translations", { method: "POST", body: transForm }); setShowTransForm(false); setTransForm({ key: "", lang: "uz", value: "" }); loadTranslations(); } catch (err) { console.error(err); }
  };

  const deleteTranslation = async (id) => {
    try { await api(`/admin/translations/${id}`, { method: "DELETE" }); loadTranslations(); } catch (err) { console.error(err); }
  };

  const updateFlag = async (id, status) => {
    try { await api(`/admin/flags/${id}`, { method: "PATCH", body: { status } }); loadFlags(); } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: TrendingUp },
    { id: "users", label: "Foydalanuvchilar", icon: Users },
    { id: "vacancies", label: "Vakansiyalar", icon: Briefcase },
    { id: "orders", label: "Buyurtmalar", icon: Package },
    { id: "finance", label: "Moliya", icon: CreditCard },
    { id: "tariffs", label: "Tariflar", icon: Tag },
    { id: "promos", label: "Promo", icon: Star },
    { id: "sms", label: "SMS/Push", icon: MessageSquare },
    { id: "health", label: "Health", icon: HeartPulse },
    { id: "i18n", label: "i18n", icon: Globe },
    { id: "flags", label: "Moderatsiya", icon: Flag },
  ];

  const statCards = [
    { label: "Foydalanuvchilar", value: stats.users_total, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Mutaxassislar", value: stats.specialists, icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Ish beruvchilar", value: stats.employers, icon: Briefcase, color: "bg-purple-50 text-purple-600" },
    { label: "Adminlar", value: stats.admins, icon: Shield, color: "bg-amber-50 text-amber-600" },
    { label: "Vakansiyalar", value: stats.vacancies_total, icon: Briefcase, color: "bg-ink/5 text-ink" },
    { label: "Faol vakansiyalar", value: stats.vacancies_active, icon: Eye, color: "bg-green-50 text-green-600" },
    { label: "Jami buyurtmalar", value: stats.orders_total, icon: Package, color: "bg-purple-50 text-purple-600" },
    { label: "Tugallangan", value: stats.orders_completed, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { label: "Yangi (7 kun)", value: stats.new_users_7d, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Xabarlar", value: stats.messages_total, icon: AlertCircle, color: "bg-red-50 text-red-600" },
  ];

  const roleColors = { specialist: "bg-blue-50 text-blue-600", employer: "bg-purple-50 text-purple-600", admin: "bg-amber-50 text-amber-600" };
  const roleLabels = { specialist: "Mutaxassis", employer: "Ish beruvchi", admin: "Admin" };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none";
  const btnPrimary = "px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors";
  const btnSecondary = "px-3 py-1.5 bg-surface text-ink-2 border border-border rounded-lg text-xs font-medium hover:bg-border-soft transition-colors";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-ink/5 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-ink" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Admin panel</h1>
          <p className="text-ink-3 text-sm">TalentHub boshqaruvi</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading && tab === "overview" && <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>}

      {!loading && tab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                <s.icon className="w-[18px] h-[18px]" />
              </div>
              <div className="text-2xl font-bold text-ink">{s.value ?? 0}</div>
              <div className="text-xs text-ink-3 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && !loading && (
        <div>
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Ism yoki email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
            </div>
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha rollar</option>
              <option value="specialist">Mutaxassis</option>
              <option value="employer">Ish beruvchi</option>
              <option value="admin">Admin</option>
            </select>
            <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="blocked">Bloklangan</option>
            </select>
          </div>
          <p className="text-xs text-ink-3 mb-3">{usersTotal} ta foydalanuvchi</p>
          {users.length === 0 ? (
            <div className="text-center py-16 text-ink-3 text-sm">Foydalanuvchi topilmadi</div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Rol</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Reyting</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Sana</th>
                    <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border-soft">
                    {users.map((u) => (
                      <tr key={u.id} className={`hover:bg-surface transition-colors ${u.blocked ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center text-xs font-medium text-ink-2 flex-shrink-0">{u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                            <div className="min-w-0">
                              <div className="font-medium text-ink text-sm flex items-center gap-1"><span className="truncate">{u.name}</span>{!!u.verified && <VerifiedBadge size="sm" />}{!!u.blocked && <span className="text-[10px] text-red-500 font-medium">Bloklangan</span>}</div>
                              <div className="text-xs text-ink-3 sm:hidden">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || ""}`}>{roleLabels[u.role] || u.role}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="flex items-center gap-1 text-sm"><Star className="w-3 h-3 text-ink fill-ink" /> {u.rating} ({u.reviews_count})</span></td>
                        <td className="px-4 py-3 text-xs text-ink-3 hidden lg:table-cell">{u.created_at ? new Date(u.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toggleVerified(u.id, u.verified)} disabled={updatingId === u.id} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${u.verified ? "text-accent bg-accent-soft hover:bg-accent/20" : "text-ink-3 hover:bg-surface"}`} title={u.verified ? "Verifikatsiyani o'chirish" : "Tasdiqlash"}><VerifiedBadge size="sm" /></button>
                            <button onClick={() => toggleBlock(u.id, u.blocked)} disabled={updatingId === u.id} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${u.blocked ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-red-500 bg-red-50 hover:bg-red-100"}`} title={u.blocked ? "Blokdan chiqarish" : "Bloklash"}>{u.blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "vacancies" && (
        <div>
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={vacSearch} onChange={(e) => setVacSearch(e.target.value)} placeholder="Vakansiya qidirish..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
            </div>
            <select value={vacStatusFilter} onChange={(e) => setVacStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha holatlar</option>
              <option value="Faol">Faol</option>
              <option value="Nofaol">Nofaol</option>
            </select>
          </div>
          {vacancies.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Vakansiya topilmadi</div> : (
            <div className="space-y-2">
              {vacancies.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-ink text-sm">{v.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Faol" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{v.status || "Faol"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                        <span>{v.company}</span><span>·</span><span>{v.author_name}</span><span>·</span><span>{v.applications_count} ta ariza</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleVacStatus(v.id, v.status || "Faol")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors">{v.status === "Faol" ? "Yashirish" : "Ko'rsatish"}</button>
                      <button onClick={() => deleteVacancy(v.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["", "Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"].map((f) => (
              <button key={f} onClick={() => setOrderStatusFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${orderStatusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{f || "Barchasi"}</button>
            ))}
          </div>
          {orders.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Buyurtma topilmadi</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Sarlavha</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Ish beruvchi</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Mutaxassis</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Narx</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Sana</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-medium text-ink text-sm">{o.title}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{o.employer_name}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{o.specialist_name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{o.price}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{o.created_at ? new Date(o.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}

      {tab === "finance" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Jami tushum</div>
              <div className="text-xl font-bold text-ink mt-1">{(financeStats.total_income || 0).toLocaleString()} so'm</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Komissiya</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{(financeStats.total_commission || 0).toLocaleString()} so'm</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Qaytarilgan</div>
              <div className="text-xl font-bold text-red-500 mt-1">{(financeStats.total_refunds || 0).toLocaleString()} so'm</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Bugun</div>
              <div className="text-xl font-bold text-ink mt-1">{(financeStats.today_income || 0).toLocaleString()} so'm</div>
            </div>
          </div>
          {financeStats.daily && financeStats.daily.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5 mb-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Kunlik tushum (oxirgi 30 kun)</h3>
              <div className="flex items-end gap-1 h-32">
                {financeStats.daily.map((d, i) => {
                  const max = Math.max(...financeStats.daily.map((x) => x.income || 0), 1);
                  const h = Math.max(((d.income || 0) / max) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${(d.income || 0).toLocaleString()} so'm`}>
                      <div className="w-full bg-accent rounded-t" style={{ height: `${h}%` }} />
                      <div className="text-[9px] text-ink-3">{d.day?.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3 mb-6 flex-wrap">
            <select value={txMethodFilter} onChange={(e) => setTxMethodFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white">
              <option value="">Barcha usullar</option><option value="Payme">Payme</option><option value="Click">Click</option>
            </select>
            <select value={txStatusFilter} onChange={(e) => setTxStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white">
              <option value="">Barcha holatlar</option><option value="Tasdiqlangan">Tasdiqlangan</option><option value="Kutilmoqda">Kutilmoqda</option><option value="Qaytarildi">Qaytarildi</option>
            </select>
            <select value={txPeriod} onChange={(e) => setTxPeriod(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white">
              <option value="">Barcha vaqt</option><option value="today">Bugun</option><option value="week">Bu hafta</option><option value="month">Bu oy</option>
            </select>
          </div>
          {txData.transactions.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Tranzaksiya topilmadi</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Summa</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Usul</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Sana</th>
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amal</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {txData.transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3"><div className="text-sm font-medium text-ink">{t.user_name || "—"}</div><div className="text-xs text-ink-3">{t.user_email}</div></td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{t.amount?.toLocaleString()} so'm</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.method === "Payme" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>{t.method}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{t.created_at ? new Date(t.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {t.status !== "Qaytarildi" && <button onClick={() => processRefund(t.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Refund</button>}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}

      {tab === "tariffs" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-ink-3">{tariffs.length} ta tarif</p>
            <button onClick={() => setShowTariffForm(!showTariffForm)} className={btnPrimary}><Plus className="w-4 h-4 inline mr-1" /> Yangi tarif</button>
          </div>
          {showTariffForm && (
            <div className="bg-white rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-ink">Yangi tarif</h3><button onClick={() => setShowTariffForm(false)}><X className="w-4 h-4 text-ink-3" /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <input value={tariffForm.name} onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })} placeholder="Nomi" className={inputCls} />
                <input value={tariffForm.price} onChange={(e) => setTariffForm({ ...tariffForm, price: e.target.value })} placeholder="Narxi (so'm)" type="number" className={inputCls} />
                <input value={tariffForm.duration_days} onChange={(e) => setTariffForm({ ...tariffForm, duration_days: e.target.value })} placeholder="Muddat (kun)" type="number" className={inputCls} />
                <input value={tariffForm.max_vacancies} onChange={(e) => setTariffForm({ ...tariffForm, max_vacancies: e.target.value })} placeholder="Max vakansiyalar" type="number" className={inputCls} />
                <input value={tariffForm.max_contacts} onChange={(e) => setTariffForm({ ...tariffForm, max_contacts: e.target.value })} placeholder="Max kontaktlar" type="number" className={inputCls} />
              </div>
              <button onClick={createTariff} className={`${btnPrimary} mt-4`}>Saqlash</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tariffs.map((t) => (
              <div key={t.id} className={`bg-white rounded-xl border p-5 transition-all ${t.active ? "border-border hover:shadow-md" : "border-border opacity-60"}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink">{t.name}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{t.active ? "Faol" : "Nofaol"}</span>
                </div>
                <div className="text-2xl font-bold text-ink mb-1">{t.price?.toLocaleString()} <span className="text-sm font-normal text-ink-3">so'm/oy</span></div>
                <div className="text-xs text-ink-3 mb-3">{t.duration_days} kun</div>
                <div className="space-y-1 mb-4">
                  <div className="text-xs text-ink-2">{t.max_vacancies} ta vakansiya</div>
                  <div className="text-xs text-ink-2">{t.max_contacts} ta kontakt</div>
                </div>
                {t.features?.length > 0 && (
                  <div className="space-y-1 mb-4 border-t border-border pt-3">
                    {t.features.map((f, i) => <div key={i} className="text-xs text-ink-3 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {f}</div>)}
                  </div>
                )}
                <div className="flex gap-2 border-t border-border pt-3">
                  <button onClick={() => toggleTariff(t.id, t.active)} className={btnSecondary}>{t.active ? "O'chirish" : "Yoqish"}</button>
                  <button onClick={() => deleteTariff(t.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "promos" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-ink-3">{promos.length} ta promo-kod</p>
            <button onClick={() => setShowPromoForm(!showPromoForm)} className={btnPrimary}><Plus className="w-4 h-4 inline mr-1" /> Yangi promo</button>
          </div>
          {showPromoForm && (
            <div className="bg-white rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-ink">Yangi promo-kod</h3><button onClick={() => setShowPromoForm(false)}><X className="w-4 h-4 text-ink-3" /></button></div>
              <div className="grid grid-cols-2 gap-3">
                <input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} placeholder="Kod (masalan: SUMMER20)" className={inputCls} style={{ textTransform: "uppercase" }} />
                <input value={promoForm.discount_percent} onChange={(e) => setPromoForm({ ...promoForm, discount_percent: e.target.value })} placeholder="Chegirma %" type="number" className={inputCls} />
                <input value={promoForm.max_uses} onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })} placeholder="Maksimal ishlatish" type="number" className={inputCls} />
                <input value={promoForm.expires_at} onChange={(e) => setPromoForm({ ...promoForm, expires_at: e.target.value })} placeholder="Muddati" type="date" className={inputCls} />
              </div>
              <button onClick={createPromo} className={`${btnPrimary} mt-4`}>Saqlash</button>
            </div>
          )}
          <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full"><thead><tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Kod</th>
              <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Chegirma</th>
              <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Ishlatilgan</th>
              <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Muddati</th>
              <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
              <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amal</th>
            </tr></thead><tbody className="divide-y divide-border-soft">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-ink text-sm">{p.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-accent">{p.discount_percent}%</td>
                  <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{p.used_count}/{p.max_uses}</td>
                  <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{p.expires_at || "Cheksiz"}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{p.active ? "Faol" : "O'chirilgan"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => togglePromo(p.id, p.active)} className={btnSecondary}>{p.active ? "O'chirish" : "Yoqish"}</button>
                      <button onClick={() => deletePromo(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div></div>
        </div>
      )}

      {tab === "sms" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Jami SMS</div>
              <div className="text-xl font-bold text-ink mt-1">{smsData.stats?.total || 0}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Yetkazilgan</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{smsData.stats?.delivered || 0}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Xatolik</div>
              <div className="text-xl font-bold text-red-500 mt-1">{smsData.stats?.failed || 0}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="text-xs text-ink-3">Jami xarajat</div>
              <div className="text-xl font-bold text-ink mt-1">{(smsData.stats?.total_cost || 0).toLocaleString()} so'm</div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-ink mb-3">SMS loglari</h3>
          {smsData.logs.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">SMS topilmadi</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden mb-8"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Telefon</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Xabar</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Provayder</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Sana</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {smsData.logs.map((s) => (
                  <tr key={s.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-ink">{s.phone}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 max-w-[200px] truncate">{s.message}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.status === "Yetkazildi" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-xs text-ink-3">{s.provider}</td>
                    <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{s.created_at ? new Date(s.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
          <h3 className="text-sm font-semibold text-ink mb-3">Push bildirishnomalar</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-border p-3 text-center"><div className="text-lg font-bold text-ink">{pushData.stats?.total || 0}</div><div className="text-xs text-ink-3">Jami</div></div>
            <div className="bg-white rounded-xl border border-border p-3 text-center"><div className="text-lg font-bold text-emerald-600">{pushData.stats?.delivered || 0}</div><div className="text-xs text-ink-3">Yetkazilgan</div></div>
            <div className="bg-white rounded-xl border border-border p-3 text-center"><div className="text-lg font-bold text-accent">{pushData.stats?.clicked || 0}</div><div className="text-xs text-ink-3">Bosilgan</div></div>
          </div>
          {pushData.logs.length === 0 ? <div className="text-center py-8 text-ink-3 text-sm">Push topilmadi</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Sarlavha</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Matn</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Sana</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {pushData.logs.map((p) => (
                  <tr key={p.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{p.title}</td>
                    <td className="px-4 py-3 text-sm text-ink-3">{p.body}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === "Yuborildi" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{p.created_at ? new Date(p.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}

      {tab === "health" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-ink">Tizim salomatligi</h3>
            <button onClick={loadHealth} className={btnSecondary}><RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Yangilash</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3"><div className={`w-3 h-3 rounded-full ${health.status === "Faol" ? "bg-emerald-500" : "bg-red-500"}`} /><span className="text-sm font-medium text-ink">Server holati</span></div>
              <div className={`text-2xl font-bold ${health.status === "Faol" ? "text-emerald-600" : "text-red-500"}`}>{health.status || "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Uptime</div>
              <div className="text-2xl font-bold text-ink">{health.uptime ? `${Math.floor(health.uptime / 3600)}s ${Math.floor((health.uptime % 3600) / 60)}d` : "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Socket.io ulanishlar</div>
              <div className="text-2xl font-bold text-accent">{health.socket_connections ?? "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Online foydalanuvchilar</div>
              <div className="text-2xl font-bold text-emerald-600">{health.online_users ?? "—"}</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Xatolik darajasi</div>
              <div className="text-2xl font-bold text-ink">{health.error_rate ?? "—"}%</div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Xotira (RAM)</div>
              <div className="text-2xl font-bold text-ink">{health.memory_used_mb ?? "—"} <span className="text-sm font-normal text-ink-3">/ {health.memory_total_mb} MB</span></div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">DB hajmi</div>
              <div className="text-2xl font-bold text-ink">{health.db_size ?? "—"} <span className="text-sm font-normal text-ink-3">KB</span></div>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="text-xs text-ink-3 mb-1">Node.js</div>
              <div className="text-lg font-bold text-ink">{health.node_version || "—"}</div>
              <div className="text-xs text-ink-3">{health.platform || ""}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "i18n" && (
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <select value={transLang} onChange={(e) => setTransLang(e.target.value)} className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white">
                <option value="uz">O'zbekcha</option><option value="ru">Русский</option><option value="en">English</option>
              </select>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={transSearch} onChange={(e) => setTransSearch(e.target.value)} placeholder="Kalit qidirish..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
              </div>
            </div>
            <button onClick={() => setShowTransForm(!showTransForm)} className={btnPrimary}><Plus className="w-4 h-4 inline mr-1" /> Yangi tarjima</button>
          </div>
          {showTransForm && (
            <div className="bg-white rounded-xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-ink">Yangi tarjima</h3><button onClick={() => setShowTransForm(false)}><X className="w-4 h-4 text-ink-3" /></button></div>
              <div className="grid grid-cols-3 gap-3">
                <input value={transForm.key} onChange={(e) => setTransForm({ ...transForm, key: e.target.value })} placeholder="Kalit (masalan: home.title)" className={inputCls} />
                <select value={transForm.lang} onChange={(e) => setTransForm({ ...transForm, lang: e.target.value })} className={inputCls}>
                  <option value="uz">uz</option><option value="ru">ru</option><option value="en">en</option>
                </select>
                <input value={transForm.value} onChange={(e) => setTransForm({ ...transForm, value: e.target.value })} placeholder="Tarjima" className={inputCls} />
              </div>
              <button onClick={createTranslation} className={`${btnPrimary} mt-4`}>Saqlash</button>
            </div>
          )}
          {translations.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Tarjima topilmadi</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Kalit</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Til</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Qiymat</th>
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amal</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {translations.map((t) => (
                  <tr key={t.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{t.key}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{t.lang}</span></td>
                    <td className="px-4 py-3 text-sm text-ink-3">{t.value}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => deleteTranslation(t.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mx-auto"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}

      {tab === "flags" && (
        <div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h3 className="text-sm font-semibold text-ink">AI Moderatsiya</h3>
            <div className="flex gap-2 ml-auto">
              {["", "Ko'rib chiqilmoqda", "Tasdiqlangan", "Rad etilgan"].map((f) => (
                <button key={f} onClick={() => setFlagStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${flagStatusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{f || "Barchasi"}</button>
              ))}
            </div>
          </div>
          {flags.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Flag topilmadi</div> : (
            <div className="space-y-2">
              {flags.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.severity === "Yuqori" ? "bg-red-50 text-red-600" : f.severity === "Orta" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{f.severity}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{f.target_type}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : f.status === "Rad etilgan" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{f.status}</span>
                        {f.auto_detected ? <span className="text-[10px] text-accent font-medium">AI aniqlagan</span> : null}
                      </div>
                      <p className="text-sm text-ink mt-2">{f.reason || "Sabab ko'rsatilmagan"}</p>
                      <p className="text-xs text-ink-3 mt-1">Target: #{f.target_id} {f.reviewer_name ? `· Ko'rib chiqdi: ${f.reviewer_name}` : ""}</p>
                    </div>
                    {f.status === "Ko'rib chiqilmoqda" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => updateFlag(f.id, "Tasdiqlangan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">Tasdiqlash</button>
                        <button onClick={() => updateFlag(f.id, "Rad etilgan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Rad etish</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
