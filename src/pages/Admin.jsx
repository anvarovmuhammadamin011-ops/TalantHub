import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, Briefcase, Package, ClipboardList, ScrollText,
  Search, UserCheck, UserX, BadgeCheck, Trash2, Shield, TrendingUp,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";

const TABS = [
  { id: "stats", label: "Statistika", icon: BarChart3 },
  { id: "users", label: "Foydalanuvchilar", icon: Users },
  { id: "vacancies", label: "Vakansiyalar", icon: Briefcase },
  { id: "orders", label: "Buyurtmalar", icon: Package },
  { id: "applications", label: "Arizalar", icon: ClipboardList },
  { id: "logs", label: "Loglar", icon: ScrollText },
];

export default function Admin() {
  const [tab, setTab] = useState("stats");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">Admin panel</h1>
          <p className="text-ink-3 text-sm">Platformani boshqarish va nazorat qilish</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "vacancies" && <VacanciesTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "applications" && <ApplicationsTab />}
      {tab === "logs" && <LogsTab />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-lg font-bold text-ink">{value}</div>
          <div className="text-xs text-ink-3">{label}</div>
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/stats").then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  if (!stats) return <EmptyState icon="⚠️" title="Statistikani yuklab bo'lmadi" description="Qaytadan urinib ko'ring" />;

  const cards = [
    { label: "Jami foydalanuvchilar", value: stats.users_total, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Mutaxassislar", value: stats.specialists, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { label: "Ish beruvchilar", value: stats.employers, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Adminlar", value: stats.admins, icon: Shield, color: "bg-amber-50 text-amber-600" },
    { label: "Jami vakansiyalar", value: stats.vacancies_total, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Faol vakansiyalar", value: stats.vacancies_active, icon: Briefcase, color: "bg-emerald-50 text-emerald-600" },
    { label: "Jami buyurtmalar", value: stats.orders_total, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Faol buyurtmalar", value: stats.orders_active, icon: Package, color: "bg-amber-50 text-amber-600" },
    { label: "Tugallangan buyurtmalar", value: stats.orders_completed, icon: Package, color: "bg-emerald-50 text-emerald-600" },
    { label: "Jami arizalar", value: stats.applications_total, icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
    { label: "Jami xabarlar", value: stats.messages_total, icon: ClipboardList, color: "bg-purple-50 text-purple-600" },
    { label: "So'nggi 7 kunlik o'sish", value: stats.new_users_7d, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, ...(search && { search }), ...(role && { role }), ...(status && { status }) });
    api(`/admin/users?${params}`)
      .then((data) => { setUsers(data.users); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, role, status]);

  useEffect(() => { load(); }, [load]);

  const patchUser = async (id, body) => {
    setUpdatingId(id);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body });
      load();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleVerified = (u) => patchUser(u.id, { verified: !u.verified });

  const toggleBlock = (u) => {
    if (u.blocked) {
      patchUser(u.id, { blocked: false, blocked_reason: "" });
    } else {
      const reason = prompt("Bloklash sababini kiriting:") || "Qoidabuzarlik";
      patchUser(u.id, { blocked: true, blocked_reason: reason });
    }
  };

  const changeRole = (u, newRole) => {
    if (newRole === u.role) return;
    patchUser(u.id, { role: newRole });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Ism yoki email bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
          />
        </div>
        <select value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}
          className="px-3 py-2.5 rounded-lg border border-border outline-none text-sm bg-white">
          <option value="">Barcha rollar</option>
          <option value="specialist">Mutaxassis</option>
          <option value="employer">Ish beruvchi</option>
          <option value="admin">Admin</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="px-3 py-2.5 rounded-lg border border-border outline-none text-sm bg-white">
          <option value="">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="blocked">Bloklangan</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>
      ) : users.length === 0 ? (
        <EmptyState icon="👤" title="Foydalanuvchi topilmadi" description="Qidiruv yoki filtrni o'zgartirib ko'ring" />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Rol</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Reyting</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Ro'yxatdan o'tgan</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isUpdating = updatingId === u.id;
                  return (
                    <tr key={u.id} className={`hover:bg-surface transition-colors ${u.blocked ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink text-sm">{u.name}</span>
                          {!!u.verified && <BadgeCheck className="w-3.5 h-3.5 text-accent" />}
                        </div>
                        <div className="text-xs text-ink-3">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || isUpdating}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="text-xs px-2 py-1 rounded-md border border-border bg-white disabled:opacity-50"
                        >
                          <option value="specialist">Mutaxassis</option>
                          <option value="employer">Ish beruvchi</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-2">{u.rating?.toFixed ? u.rating.toFixed(1) : u.rating} ({u.reviews_count})</td>
                      <td className="px-4 py-3">
                        {u.blocked ? (
                          <span className="text-[11px] text-red-500 font-medium">Bloklangan{u.blocked_reason ? `: ${u.blocked_reason}` : ""}</span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Faol</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-3">{timeAgo(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleVerified(u)}
                            disabled={isUpdating}
                            title={u.verified ? "Verifikatsiyani olib tashlash" : "Verifikatsiya berish"}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
                              u.verified ? "text-accent bg-accent-soft hover:bg-accent/10" : "text-ink-3 bg-surface hover:bg-border-soft"
                            }`}
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleBlock(u)}
                            disabled={isUpdating || isSelf}
                            title={isSelf ? "O'zingizni bloklay olmaysiz" : u.blocked ? "Blokdan chiqarish" : "Bloklash"}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
                              u.blocked ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-red-500 bg-red-50 hover:bg-red-100"
                            }`}
                          >
                            {u.blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-ink-3">
            <span>{total} ta foydalanuvchidan {(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-surface transition-colors">Oldingi</button>
              <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-surface transition-colors">Keyingi</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VacanciesTab() {
  const [vacancies, setVacancies] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
    api(`/admin/vacancies?${params}`)
      .then((data) => setVacancies(data.vacancies))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (v) => {
    setUpdatingId(v.id);
    try {
      await api(`/admin/vacancies/${v.id}/status`, { method: "PATCH", body: { status: v.status === "Faol" ? "Nofaol" : "Faol" } });
      load();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeVacancy = async (v) => {
    if (!confirm(`"${v.title}" vakansiyasini butunlay o'chirishni xohlaysizmi?`)) return;
    setUpdatingId(v.id);
    try {
      await api(`/admin/vacancies/${v.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sarlavha yoki kompaniya bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border outline-none text-sm bg-white">
          <option value="">Barcha holatlar</option>
          <option value="Faol">Faol</option>
          <option value="Nofaol">Nofaol</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>
      ) : vacancies.length === 0 ? (
        <EmptyState icon="💼" title="Vakansiya topilmadi" description="Qidiruv yoki filtrni o'zgartirib ko'ring" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Vakansiya</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Muallif</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Arizalar</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {vacancies.map((v) => (
                <tr key={v.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink text-sm">{v.title}</div>
                    <div className="text-xs text-ink-3">{v.company}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-3">{v.author_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink-2">{v.applications_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium ${v.status === "Faol" ? "text-emerald-600" : "text-ink-3"}`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleStatus(v)}
                        disabled={updatingId === v.id}
                        className="px-2.5 py-1 text-[11px] font-medium bg-surface text-ink-2 rounded-md hover:bg-border-soft transition-colors disabled:opacity-50"
                      >
                        {v.status === "Faol" ? "Yashirish" : "Faollashtirish"}
                      </button>
                      <button
                        onClick={() => removeVacancy(v)}
                        disabled={updatingId === v.id}
                        title="O'chirish"
                        className="w-7 h-7 flex items-center justify-center rounded-md text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ORDER_STATUSES = ["Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi"];

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(status && { status }) });
    api(`/admin/orders?${params}`)
      .then((data) => setOrders(data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border outline-none text-sm bg-white">
          <option value="">Barcha holatlar</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="Buyurtma topilmadi" description="Filtrni o'zgartirib ko'ring" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Buyurtma</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Ish beruvchi</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Mutaxassis</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Narx</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-medium text-ink text-sm">{o.title}</td>
                  <td className="px-4 py-3 text-sm text-ink-3">{o.employer_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink-3">{o.specialist_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink-2">{o.price}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-sm text-ink-3">{timeAgo(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const APPLICATION_STATUSES = ["Yuborildi", "Ko'rib chiqilmoqda", "Interview", "Qabul qilindi", "Rad etildi"];

function ApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
    api(`/admin/applications?${params}`)
      .then((data) => setApplications(data.applications))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (a, newStatus) => {
    if (newStatus === a.status) return;
    setUpdatingId(a.id);
    try {
      await api(`/admin/applications/${a.id}/status`, { method: "PATCH", body: { status: newStatus } });
      load();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeApplication = async (a) => {
    if (!confirm("Ushbu arizani butunlay o'chirishni xohlaysizmi?")) return;
    setUpdatingId(a.id);
    try {
      await api(`/admin/applications/${a.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vakansiya yoki mutaxassis bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border outline-none text-sm bg-white">
          <option value="">Barcha holatlar</option>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>
      ) : applications.length === 0 ? (
        <EmptyState icon="📋" title="Ariza topilmadi" description="Qidiruv yoki filtrni o'zgartirib ko'ring" />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Vakansiya</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Mutaxassis</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Sana</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 font-medium text-ink text-sm">{a.vacancy_title}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink-2">{a.specialist_name}</div>
                    <div className="text-xs text-ink-3">{a.specialist_email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-3">{timeAgo(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      disabled={updatingId === a.id}
                      onChange={(e) => changeStatus(a, e.target.value)}
                      className="text-xs px-2 py-1 rounded-md border border-border bg-white disabled:opacity-50"
                    >
                      {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeApplication(a)}
                      disabled={updatingId === a.id}
                      title="O'chirish"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/logs").then((data) => setLogs(data.logs)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  if (logs.length === 0) return <EmptyState icon="📜" title="Loglar yo'q" description="Admin harakatlari shu yerda ko'rinadi" />;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Admin</th>
            <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Harakat</th>
            <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Tafsilot</th>
            <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Vaqt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-surface transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-ink">{l.admin_name || "—"}</td>
              <td className="px-4 py-3 text-sm text-ink-2">{l.action}{l.target_type ? ` · ${l.target_type}#${l.target_id}` : ""}</td>
              <td className="px-4 py-3 text-sm text-ink-3">{l.details || "—"}</td>
              <td className="px-4 py-3 text-sm text-ink-3">{timeAgo(l.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
