import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Users, Briefcase, Package, TrendingUp, CheckCircle, AlertCircle, Search, Eye, Trash2, UserX, UserCheck, Clock, Star, Flag, Plus, X, ClipboardCheck, Megaphone, FolderTree, ScrollText, CheckSquare, Square, ExternalLink, Pin, PinOff } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";

// Har bir bo'lim qaysi admin_role'larga ko'rinishini belgilaydi (backenddagi SECTION_ROLES bilan mos).
// super_admin har doim hammasini ko'radi.
const TAB_SECTION_ROLES = {
  overview: ["super_admin"],
  users: ["super_admin", "support"],
  vacancies: ["super_admin", "moderator"],
  orders: ["super_admin"],
  flags: ["super_admin", "moderator"],
  verification: ["super_admin", "moderator"],
  categories: ["super_admin", "moderator"],
  broadcast: ["super_admin", "support"],
  logs: ["super_admin"],
};

function canSeeTab(adminRole, tabId) {
  const allowed = TAB_SECTION_ROLES[tabId] || ["super_admin"];
  return adminRole === "super_admin" || !adminRole || allowed.includes(adminRole);
}

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

  const [flags, setFlags] = useState([]);
  const [flagStatusFilter, setFlagStatusFilter] = useState("");

  const [verifications, setVerifications] = useState([]);
  const [verifStatusFilter, setVerifStatusFilter] = useState("Kutilmoqda");

  const [broadcastForm, setBroadcastForm] = useState({ title: "", description: "", link: "", audience: "" });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoryTypeTab, setCategoryTypeTab] = useState("category");
  const [newCategory, setNewCategory] = useState({ group_name: "IT", name: "" });

  const [logs, setLogs] = useState([]);
  const [logActions, setLogActions] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  const adminRole = user?.admin_role || "super_admin";

  useEffect(() => { loadTab(); }, [tab]);

  useEffect(() => { if (tab === "users") loadUsers(); }, [userSearch, userRoleFilter, userStatusFilter]);
  useEffect(() => { if (tab === "vacancies") loadVacancies(); }, [vacSearch, vacStatusFilter]);
  useEffect(() => { if (tab === "orders") loadOrders(); }, [orderStatusFilter]);
  useEffect(() => { if (tab === "flags") loadFlags(); }, [tab, flagStatusFilter]);
  useEffect(() => { if (tab === "verification") loadVerifications(); }, [tab, verifStatusFilter]);
  useEffect(() => { if (tab === "categories") loadCategories(); }, [tab, categoryTypeTab]);
  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab, logSearch, logActionFilter]);

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

  const loadFlags = async () => {
    const p = new URLSearchParams();
    if (flagStatusFilter) p.set("status", flagStatusFilter);
    try { const d = await api(`/admin/flags?${p.toString()}`); setFlags(d.flags); } catch {}
  };

  const loadVerifications = async () => {
    const p = new URLSearchParams();
    if (verifStatusFilter) p.set("status", verifStatusFilter);
    try { const d = await api(`/admin/verification?${p.toString()}`); setVerifications(d.requests); } catch {}
  };

  const reviewVerification = async (id, status) => {
    let reject_reason = "";
    if (status === "Rad etildi") {
      reject_reason = prompt("Rad etish sababini kiriting:") || "";
      if (!reject_reason.trim()) return;
    }
    try { await api(`/admin/verification/${id}`, { method: "PATCH", body: { status, reject_reason } }); loadVerifications(); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const loadCategories = async () => {
    const p = new URLSearchParams({ type: categoryTypeTab });
    try { const d = await api(`/admin/categories?${p.toString()}`); setCategories(d.categories); } catch {}
  };

  const createCategory = async () => {
    if (!newCategory.name.trim()) return;
    try {
      await api("/admin/categories", { method: "POST", body: { ...newCategory, type: categoryTypeTab } });
      setNewCategory({ group_name: "IT", name: "" });
      loadCategories();
    } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const toggleCategoryActive = async (c) => {
    try { await api(`/admin/categories/${c.id}`, { method: "PATCH", body: { active: !c.active } }); loadCategories(); } catch (err) { console.error(err); }
  };

  const deleteCategory = async (id) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/categories/${id}`, { method: "DELETE" }); loadCategories(); } catch (err) { console.error(err); }
  };

  const loadLogs = async () => {
    const p = new URLSearchParams();
    if (logSearch) p.set("search", logSearch);
    if (logActionFilter) p.set("action", logActionFilter);
    try { const d = await api(`/admin/logs?${p.toString()}`); setLogs(d.logs); setLogActions(d.actions || []); } catch {}
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title.trim()) return;
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const d = await api("/admin/broadcast", { method: "POST", body: broadcastForm });
      setBroadcastResult({ success: true, recipients: d.recipients });
      setBroadcastForm({ title: "", description: "", link: "", audience: "" });
    } catch (err) {
      setBroadcastResult({ success: false, error: err.message || "Xatolik yuz berdi" });
    } finally {
      setBroadcastSending(false);
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAllUsers = () => {
    setSelectedUserIds((prev) => prev.length === users.length ? [] : users.map((u) => u.id));
  };

  const runBulkAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    let reason;
    if (action === "block") {
      reason = prompt("Bloklash sababini kiriting:") || "Ommaviy bloklash";
    }
    if (!confirm(`${selectedUserIds.length} ta foydalanuvchi uchun "${action}" amalini bajarishni xohlaysizmi?`)) return;
    setBulkRunning(true);
    try {
      await api("/admin/users/bulk", { method: "PATCH", body: { ids: selectedUserIds, action, reason } });
      setSelectedUserIds([]);
      loadUsers();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setBulkRunning(false);
    }
  };

  const toggleVerified = async (id, current) => {
    setUpdatingId(id);
    try { await api(`/admin/users/${id}`, { method: "PATCH", body: { verified: !current } }); setUsers((prev) => prev.map((u) => u.id === id ? { ...u, verified: current ? 0 : 1 } : u)); } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const toggleFeatured = async (id, current) => {
    setUpdatingId(id);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: { featured: !current } });
      setUsers((prev) => {
        const next = prev.map((u) => u.id === id ? { ...u, featured: current ? 0 : 1 } : u);
        return next.slice().sort((a, b) => (b.featured || 0) - (a.featured || 0));
      });
    } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
    setUpdatingId(null);
  };

  const toggleBlock = async (id, current) => {
    if (!confirm(current ? "Foydalanuvchini bloklashni xohlaysizmi?" : "Bloklashni bekor qilishni xohlaysizmi?")) return;
    setUpdatingId(id);
    try { await api(`/admin/users/${id}`, { method: "PATCH", body: { blocked: !current, blocked_reason: current ? "" : "Admin tomonidan bloklangan" } }); setUsers((prev) => prev.map((u) => u.id === id ? { ...u, blocked: current ? 0 : 1 } : u)); } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const changeUserRole = async (u, newRole) => {
    if (newRole === u.role) return;
    if (!confirm(`${u.name} uchun rolni "${roleLabels[newRole]}" ga o'zgartirishni xohlaysizmi?`)) return;
    setUpdatingId(u.id);
    try { await api(`/admin/users/${u.id}`, { method: "PATCH", body: { role: newRole } }); loadUsers(); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
    setUpdatingId(null);
  };

  const changeAdminRole = async (u, newAdminRole) => {
    if (newAdminRole === u.admin_role) return;
    setUpdatingId(u.id);
    try { await api(`/admin/users/${u.id}`, { method: "PATCH", body: { admin_role: newAdminRole } }); loadUsers(); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
    setUpdatingId(null);
  };

  const changeOrderStatus = async (id, status) => {
    try { await api(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }); setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o)); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Buyurtmani butunlay o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/orders/${id}`, { method: "DELETE" }); setOrders((prev) => prev.filter((o) => o.id !== id)); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const deleteFlag = async (id) => {
    if (!confirm("Shikoyatni o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/flags/${id}`, { method: "DELETE" }); loadFlags(); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const renameCategory = async (c) => {
    const name = prompt("Yangi nom:", c.name);
    if (!name || !name.trim() || name.trim() === c.name) return;
    try { await api(`/admin/categories/${c.id}`, { method: "PATCH", body: { name: name.trim() } }); loadCategories(); } catch (err) { alert(err.message || "Xatolik yuz berdi"); }
  };

  const setVacStatus = async (id, status, reject_reason) => {
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status, reject_reason } });
      setVacancies((prev) => prev.map((v) => v.id === id ? { ...v, status, reject_reason: reject_reason || "" } : v));
    } catch (err) { console.error(err); }
  };

  const toggleVacStatus = (id, currentStatus) => setVacStatus(id, currentStatus === "Faol" ? "Nofaol" : "Faol");

  const rejectVacancy = (id) => {
    const reason = prompt("Rad etish sababi:");
    if (reason === null) return;
    setVacStatus(id, "Tuzatish kerak", reason);
  };

  const deleteVacancy = async (id) => {
    if (!confirm("Vakansiyani o'chirishni xohlaysizmi?")) return;
    try { await api(`/admin/vacancies/${id}`, { method: "DELETE" }); setVacancies((prev) => prev.filter((v) => v.id !== id)); } catch (err) { console.error(err); }
  };

  const updateFlag = async (flag, status) => {
    let block = false;
    let resolution_note = "";
    if (status === "Tasdiqlangan" && flag.target_type === "user") {
      block = confirm("Shikoyat asosli deb belgilanmoqda. Foydalanuvchini ham bloklaysizmi?");
    }
    try { await api(`/admin/flags/${flag.id}`, { method: "PATCH", body: { status, block, resolution_note } }); loadFlags(); } catch (err) { console.error(err); }
  };

  const allTabs = [
    { id: "overview", label: "Umumiy", icon: TrendingUp },
    { id: "users", label: "Foydalanuvchilar", icon: Users },
    { id: "vacancies", label: "Vakansiyalar", icon: Briefcase },
    { id: "orders", label: "Buyurtmalar", icon: Package },
    { id: "flags", label: "Shikoyatlar", icon: Flag },
    { id: "verification", label: "Verifikatsiya", icon: ClipboardCheck },
    { id: "categories", label: "Kategoriyalar", icon: FolderTree },
    { id: "broadcast", label: "Xabarnoma", icon: Megaphone },
    { id: "logs", label: "Loglar", icon: ScrollText },
  ];
  const tabs = allTabs.filter((t) => canSeeTab(adminRole, t.id));

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
    { label: "Tasdiqlangan foydalanuvchilar", value: stats.verified_users, icon: UserCheck, color: "bg-accent-soft text-accent" },
    { label: "Bloklangan foydalanuvchilar", value: stats.blocked_users, icon: UserX, color: "bg-red-50 text-red-600" },
    { label: "Birinchiga chiqarilganlar", value: stats.featured_users, icon: Pin, color: "bg-amber-50 text-amber-600" },
  ];

  const roleColors = { specialist: "bg-blue-50 text-blue-600", employer: "bg-purple-50 text-purple-600", admin: "bg-amber-50 text-amber-600" };
  const roleLabels = { specialist: "Mutaxassis", employer: "Ish beruvchi", admin: "Admin" };

  const flagTargetLink = (f) => {
    if (f.target_type === "user" || f.target_type === "profile") return `/admin/users/${f.target_id}`;
    if (f.target_type === "specialist") return `/specialists/${f.target_id}`;
    if (f.target_type === "vacancy") return `/vacancies/${f.target_id}`;
    return null;
  };

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
        <div>
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

          <div className="grid lg:grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Ro'yxatdan o'tishlar (so'nggi 14 kun)</h3>
              {(stats.signups_series || []).every((d) => d.count === 0) ? (
                <div className="text-center py-10 text-ink-3 text-sm">Ma'lumot yo'q</div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(stats.signups_series || []).map((d) => ({ ...d, label: d.date.slice(5) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F1" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#8A8A93" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#8A8A93" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E7E7EA", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Bar dataKey="count" name="Yangi foydalanuvchilar" fill="#3730A3" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">Shaharlar bo'yicha foydalanuvchilar (top 5)</h3>
              {(stats.users_by_city || []).length === 0 ? (
                <div className="text-center py-10 text-ink-3 text-sm">Ma'lumot yo'q</div>
              ) : (
                <div className="space-y-3">
                  {stats.users_by_city.map((c) => {
                    const max = Math.max(...stats.users_by_city.map((x) => x.count), 1);
                    return (
                      <div key={c.city}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink-2 font-medium">{c.city}</span>
                          <span className="text-ink-3">{c.count}</span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-ink rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
              <option value="featured">Birinchiga chiqarilgan</option>
            </select>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-ink-3">{usersTotal} ta foydalanuvchi{selectedUserIds.length > 0 ? ` · ${selectedUserIds.length} tanlandi` : ""}</p>
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => runBulkAction("verify")} disabled={bulkRunning} className="px-3 py-1.5 text-xs font-medium rounded-lg text-accent bg-accent-soft hover:bg-accent/20 transition-colors disabled:opacity-50">Ommaviy tasdiqlash</button>
                <button onClick={() => runBulkAction("unverify")} disabled={bulkRunning} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors disabled:opacity-50">Tasdiqni olish</button>
                <button onClick={() => runBulkAction("block")} disabled={bulkRunning} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">Ommaviy bloklash</button>
                <button onClick={() => runBulkAction("unblock")} disabled={bulkRunning} className="px-3 py-1.5 text-xs font-medium rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">Blokdan chiqarish</button>
              </div>
            )}
          </div>
          {users.length === 0 ? (
            <div className="text-center py-16 text-ink-3 text-sm">Foydalanuvchi topilmadi</div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-border">
                    <th className="px-4 py-3 w-8"><button onClick={toggleSelectAllUsers} className="flex items-center text-ink-3 hover:text-ink">{selectedUserIds.length === users.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}</button></th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Rol</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Reyting</th>
                    <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Sana</th>
                    <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border-soft">
                    {users.map((u) => (
                      <tr key={u.id} className={`hover:bg-surface transition-colors ${u.blocked ? "opacity-60" : ""} ${u.featured ? "bg-amber-50/40" : ""}`}>
                        <td className="px-4 py-3"><button onClick={() => toggleSelectUser(u.id)} className="flex items-center text-ink-3 hover:text-ink">{selectedUserIds.includes(u.id) ? <CheckSquare className="w-4 h-4 text-ink" /> : <Square className="w-4 h-4" />}</button></td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/users/${u.id}`} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center text-xs font-medium text-ink-2 flex-shrink-0">{u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                            <div className="min-w-0">
                              <div className="font-medium text-ink text-sm flex items-center gap-1">
                                <span className="truncate group-hover:underline">{u.name}</span>
                                {!!u.featured && <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium"><Pin className="w-3 h-3 fill-amber-500" /> TOP</span>}
                                {!!u.verified && <VerifiedBadge size="sm" />}
                                {!!u.blocked && <span className="text-[10px] text-red-500 font-medium">Bloklangan</span>}
                              </div>
                              <div className="text-xs text-ink-3 sm:hidden">{u.email}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3">
                          {adminRole === "super_admin" ? (
                            <div className="flex flex-col gap-1">
                              <select value={u.role} disabled={u.id === user?.id || updatingId === u.id}
                                onChange={(e) => changeUserRole(u, e.target.value)}
                                className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md border border-border bg-white disabled:opacity-50 ${roleColors[u.role] || ""}`}>
                                <option value="specialist">Mutaxassis</option>
                                <option value="employer">Ish beruvchi</option>
                                <option value="admin">Admin</option>
                              </select>
                              {u.role === "admin" && (
                                <select value={u.admin_role || "super_admin"} disabled={u.id === user?.id || updatingId === u.id}
                                  onChange={(e) => changeAdminRole(u, e.target.value)}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-border bg-white disabled:opacity-50 text-ink-3">
                                  <option value="super_admin">Super Admin</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="support">Support</option>
                                </select>
                              )}
                            </div>
                          ) : (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || ""}`}>{roleLabels[u.role] || u.role}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="flex items-center gap-1 text-sm"><Star className="w-3 h-3 text-ink fill-ink" /> {u.rating} ({u.reviews_count})</span></td>
                        <td className="px-4 py-3 text-xs text-ink-3 hidden lg:table-cell">{u.created_at ? new Date(u.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/admin/users/${u.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-surface transition-colors" title="Batafsil"><ExternalLink className="w-4 h-4" /></Link>
                            <button onClick={() => toggleFeatured(u.id, u.featured)} disabled={updatingId === u.id} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${u.featured ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-ink-3 hover:bg-surface"}`} title={u.featured ? "Birinchi o'rindan olib tashlash" : "Ro'yxat boshiga chiqarish"}>{u.featured ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}</button>
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
              <option value="Qoralama">Qoralama</option>
              <option value="Kutilmoqda">Kutilmoqda</option>
              <option value="Tuzatish kerak">Tuzatish kerak</option>
              <option value="Faol">Faol</option>
              <option value="Nofaol">Nofaol</option>
              <option value="Arxivlangan">Arxivlangan</option>
            </select>
          </div>
          {vacancies.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Vakansiya topilmadi</div> : (
            <div className="space-y-2">
              {vacancies.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/admin/vacancies/${v.id}`} className="font-medium text-ink text-sm hover:underline">{v.title}</Link>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Faol" ? "bg-emerald-50 text-emerald-600" : v.status === "Kutilmoqda" ? "bg-amber-50 text-amber-600" : v.status === "Tuzatish kerak" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>{v.status || "Faol"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                        <span>{v.company}</span><span>·</span><span>{v.author_name}</span><span>·</span><span>{v.applications_count} ta ariza</span><span>·</span><span>{v.views || 0} ko'rish</span>
                      </div>
                      {v.status === "Tuzatish kerak" && v.reject_reason && (
                        <div className="text-xs text-red-500 mt-1">Sabab: {v.reject_reason}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {v.status === "Kutilmoqda" && (
                        <>
                          <button onClick={() => setVacStatus(v.id, "Faol")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">Tasdiqlash</button>
                          <button onClick={() => rejectVacancy(v.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Rad etish</button>
                        </>
                      )}
                      {(v.status === "Faol" || v.status === "Nofaol") && (
                        <button onClick={() => toggleVacStatus(v.id, v.status || "Faol")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors">{v.status === "Faol" ? "Yashirish" : "Ko'rsatish"}</button>
                      )}
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
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amal</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 font-medium text-ink text-sm">{o.title}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{o.employer_name}</td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{o.specialist_name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{o.price}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={(e) => changeOrderStatus(o.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-md border border-border bg-white">
                        {["Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-3 hidden md:table-cell">{o.created_at ? new Date(o.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteOrder(o.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
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
            <h3 className="text-sm font-semibold text-ink">Shikoyatlar navbati</h3>
            <div className="flex gap-2 ml-auto">
              {["", "Ko'rib chiqilmoqda", "Tasdiqlangan", "Rad etilgan"].map((f) => (
                <button key={f} onClick={() => setFlagStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${flagStatusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{f || "Barchasi"}</button>
              ))}
            </div>
          </div>
          {flags.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Shikoyat topilmadi</div> : (
            <div className="space-y-2">
              {flags.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.severity === "Yuqori" ? "bg-red-50 text-red-600" : f.severity === "Orta" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{f.severity}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{f.target_type} #{f.target_id}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : f.status === "Rad etilgan" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{f.status}</span>
                        {f.auto_detected ? <span className="text-[10px] text-accent font-medium">AI aniqlagan</span> : null}
                      </div>
                      <p className="text-sm text-ink mt-2">{f.reason || "Sabab ko'rsatilmagan"}</p>
                      <p className="text-xs text-ink-3 mt-1">
                        {f.reporter_name ? `Shikoyatchi: ${f.reporter_name} (${f.reporter_email}) · ` : ""}
                        {(f.reviewed_by_name || f.reviewer_name) ? `Ko'rib chiqdi: ${f.reviewed_by_name || f.reviewer_name}` : ""}
                      </p>
                      {flagTargetLink(f) && (
                        <Link to={flagTargetLink(f)} className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> Nishonni ko'rish</Link>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {f.status === "Ko'rib chiqilmoqda" && (
                        <>
                          <button onClick={() => updateFlag(f, "Tasdiqlangan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">Asosli</button>
                          <button onClick={() => updateFlag(f, "Rad etilgan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Asossiz</button>
                        </>
                      )}
                      <button onClick={() => deleteFlag(f.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "verification" && (
        <div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h3 className="text-sm font-semibold text-ink">Verifikatsiya navbati</h3>
            <div className="flex gap-2 ml-auto">
              {["Kutilmoqda", "Tasdiqlangan", "Rad etildi", ""].map((f) => (
                <button key={f} onClick={() => setVerifStatusFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${verifStatusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>{f || "Barchasi"}</button>
              ))}
            </div>
          </div>
          {verifications.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">So'rov topilmadi</div> : (
            <div className="space-y-2">
              {verifications.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{v.type === "specialist" ? "Mutaxassis" : "Ish beruvchi"}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : v.status === "Rad etildi" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{v.status}</span>
                      </div>
                      <p className="text-sm font-medium text-ink mt-2">{v.user_name} <span className="text-ink-3 font-normal">({v.user_email})</span></p>
                      {v.document_url && <a href={v.document_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> {v.document_name || "Hujjat havolasi"}</a>}
                      {v.stir && <p className="text-xs text-ink-3 mt-1">STIR: <span className="font-mono">{v.stir}</span></p>}
                      {v.reject_reason && <p className="text-xs text-red-500 mt-1">Rad etish sababi: {v.reject_reason}</p>}
                      {v.reviewed_by_name && <p className="text-xs text-ink-3 mt-1">Ko'rib chiqdi: {v.reviewed_by_name}</p>}
                    </div>
                    {v.status === "Kutilmoqda" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => reviewVerification(v.id, "Tasdiqlangan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">Tasdiqlash</button>
                        <button onClick={() => reviewVerification(v.id, "Rad etildi")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Rad etish</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "categories" && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setCategoryTypeTab("category")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryTypeTab === "category" ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>Yo'nalishlar</button>
            <button onClick={() => setCategoryTypeTab("skill")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryTypeTab === "skill" ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"}`}>Ko'nikmalar</button>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 mb-6">
            <h3 className="text-sm font-semibold text-ink mb-4">{categoryTypeTab === "category" ? "Yangi yo'nalish qo'shish" : "Yangi ko'nikma qo'shish"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categoryTypeTab === "category" && (
                <select value={newCategory.group_name} onChange={(e) => setNewCategory({ ...newCategory, group_name: e.target.value })} className={inputCls}>
                  <option value="IT">IT</option>
                  <option value="Ta'lim">Ta'lim</option>
                </select>
              )}
              <input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder={categoryTypeTab === "category" ? "Yo'nalish nomi (masalan: Data Science)" : "Ko'nikma nomi (masalan: Kubernetes)"} className={`${inputCls} sm:col-span-2`} />
            </div>
            <button onClick={createCategory} className={`${btnPrimary} mt-4`}><Plus className="w-4 h-4 inline mr-1" /> Qo'shish</button>
          </div>
          {categories.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Hozircha bo'sh</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                {categoryTypeTab === "category" && <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Yo'nalish</th>}
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Nomi</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amal</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-surface transition-colors">
                    {categoryTypeTab === "category" && <td className="px-4 py-3 text-sm text-ink-3">{c.group_name}</td>}
                    <td className="px-4 py-3 text-sm font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{c.active ? "Ko'rinadi" : "Yashirilgan"}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => renameCategory(c)} className={btnSecondary}>Nomini o'zgartirish</button>
                        <button onClick={() => toggleCategoryActive(c)} className={btnSecondary}>{c.active ? "Yashirish" : "Ko'rsatish"}</button>
                        <button onClick={() => deleteCategory(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}

      {tab === "broadcast" && (
        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Ommaviy xabarnoma yuborish</h3>
            <div className="space-y-3">
              <select value={broadcastForm.audience} onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })} className={inputCls}>
                <option value="">Barcha foydalanuvchilar</option>
                <option value="specialist">Faqat mutaxassislar</option>
                <option value="employer">Faqat ish beruvchilar (HR)</option>
              </select>
              <input value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} placeholder="Sarlavha" className={inputCls} />
              <textarea value={broadcastForm.description} onChange={(e) => setBroadcastForm({ ...broadcastForm, description: e.target.value })} placeholder="Matn" rows={4} className={inputCls} />
              <input value={broadcastForm.link} onChange={(e) => setBroadcastForm({ ...broadcastForm, link: e.target.value })} placeholder="Havola (ixtiyoriy, masalan /vacancies)" className={inputCls} />
            </div>
            {broadcastResult && (
              <p className={`text-sm mt-3 ${broadcastResult.success ? "text-emerald-600" : "text-red-500"}`}>
                {broadcastResult.success ? `Yuborildi — ${broadcastResult.recipients} ta foydalanuvchiga yetkazildi` : broadcastResult.error}
              </p>
            )}
            <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastForm.title.trim()} className={`${btnPrimary} mt-4 disabled:opacity-50`}>
              {broadcastSending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-ink">Audit log — admin harakatlari</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={logSearch} onChange={(e) => setLogSearch(e.target.value)} placeholder="Admin yoki tafsilot bo'yicha qidirish..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white w-64" />
              </div>
              <select value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm bg-white">
                <option value="">Barcha harakatlar</option>
                {logActions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          {logs.length === 0 ? <div className="text-center py-16 text-ink-3 text-sm">Loglar yo'q</div> : (
            <div className="bg-white rounded-xl border border-border overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full"><thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Admin</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Harakat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Tafsilot</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Vaqt</th>
              </tr></thead><tbody className="divide-y divide-border-soft">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-surface transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{l.admin_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink-2">{l.action}{l.target_type ? ` · ${l.target_type}#${l.target_id}` : ""}</td>
                    <td className="px-4 py-3 text-sm text-ink-3">{l.details || "—"}</td>
                    <td className="px-4 py-3 text-xs text-ink-3">{l.created_at ? new Date(l.created_at + "Z").toLocaleString("uz-UZ") : "—"}</td>
                  </tr>
                ))}
              </tbody></table>
            </div></div>
          )}
        </div>
      )}
    </div>
  );
}
