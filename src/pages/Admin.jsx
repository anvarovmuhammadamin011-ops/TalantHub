import { useState, useEffect } from "react";
import { Shield, Users, Briefcase, Package, TrendingUp, CheckCircle, AlertCircle, Search, Eye, EyeOff, Trash2, UserX, UserCheck, Clock, Star } from "lucide-react";
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

  useEffect(() => { loadTab(); }, [tab]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (tab === "vacancies") loadVacancies();
  }, [vacSearch, vacStatusFilter]);

  useEffect(() => {
    if (tab === "orders") loadOrders();
  }, [orderStatusFilter]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const data = await api("/admin/stats");
        setStats(data);
      } else if (tab === "users") {
        await loadUsers();
      } else if (tab === "vacancies") {
        await loadVacancies();
      } else if (tab === "orders") {
        await loadOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const params = new URLSearchParams();
    if (userSearch) params.set("search", userSearch);
    if (userRoleFilter) params.set("role", userRoleFilter);
    if (userStatusFilter) params.set("status", userStatusFilter);
    const data = await api(`/admin/users?${params.toString()}`);
    setUsers(data.users);
    setUsersTotal(data.total);
  };

  const loadVacancies = async () => {
    const params = new URLSearchParams();
    if (vacSearch) params.set("search", vacSearch);
    if (vacStatusFilter) params.set("status", vacStatusFilter);
    const data = await api(`/admin/vacancies?${params.toString()}`);
    setVacancies(data.vacancies);
  };

  const loadOrders = async () => {
    const params = new URLSearchParams();
    if (orderStatusFilter) params.set("status", orderStatusFilter);
    const data = await api(`/admin/orders?${params.toString()}`);
    setOrders(data.orders);
  };

  const toggleVerified = async (id, current) => {
    setUpdatingId(id);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: { verified: !current } });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, verified: current ? 0 : 1 } : u));
    } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const toggleBlock = async (id, current) => {
    if (!confirm(current ? "Foydalanuvchini bloklashni xohlaysizmi?" : "Bloklashni bekor qilishni xohlaysizmi?")) return;
    setUpdatingId(id);
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: { blocked: !current, blocked_reason: current ? "" : "Admin tomonidan bloklangan" } });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, blocked: current ? 0 : 1 } : u));
    } catch (err) { console.error(err); }
    setUpdatingId(null);
  };

  const toggleVacStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Faol" ? "Nofaol" : "Faol";
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: newStatus } });
      setVacancies((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v));
    } catch (err) { console.error(err); }
  };

  const deleteVacancy = async (id) => {
    if (!confirm("Vakansiyani o'chirishni xohlaysizmi?")) return;
    try {
      await api(`/admin/vacancies/${id}`, { method: "DELETE" });
      setVacancies((prev) => prev.filter((v) => v.id !== id));
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: "overview", label: "Umumiy", icon: TrendingUp },
    { id: "users", label: "Foydalanuvchilar", icon: Users },
    { id: "vacancies", label: "Vakansiyalar", icon: Briefcase },
    { id: "orders", label: "Buyurtmalar", icon: Package },
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

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-20 text-ink-3 text-sm">Yuklanmoqda...</div>}

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

      {!loading && tab === "users" && (
        <div>
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Ism yoki email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
            </div>
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha rollar</option>
              <option value="specialist">Mutaxassis</option>
              <option value="employer">Ish beruvchi</option>
              <option value="admin">Admin</option>
            </select>
            <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
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
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Email</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Rol</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Reyting</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Sana</th>
                      <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {users.map((u) => (
                      <tr key={u.id} className={`hover:bg-surface transition-colors ${u.blocked ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center text-xs font-medium text-ink-2 flex-shrink-0">
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-ink text-sm flex items-center gap-1">
                                <span className="truncate">{u.name}</span>
                                {!!u.verified && <VerifiedBadge size="sm" />}
                                {!!u.blocked && <span className="text-[10px] text-red-500 font-medium">Bloklangan</span>}
                              </div>
                              <div className="text-xs text-ink-3 sm:hidden">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{u.email}</td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || ""}`}>{roleLabels[u.role] || u.role}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="flex items-center gap-1 text-sm"><Star className="w-3 h-3 text-ink fill-ink" /> {u.rating} ({u.reviews_count})</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-3 hidden lg:table-cell">{u.created_at ? new Date(u.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toggleVerified(u.id, u.verified)} disabled={updatingId === u.id}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                                u.verified ? "text-accent bg-accent-soft hover:bg-accent/20" : "text-ink-3 hover:bg-surface"
                              }`} title={u.verified ? "Verifikatsiyani o'chirish" : "Tasdiqlash"}>
                              <VerifiedBadge size="sm" />
                            </button>
                            <button onClick={() => toggleBlock(u.id, u.blocked)} disabled={updatingId === u.id}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                                u.blocked ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-red-500 bg-red-50 hover:bg-red-100"
                              }`} title={u.blocked ? "Blokdan chiqarish" : "Bloklash"}>
                              {u.blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
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

      {!loading && tab === "vacancies" && (
        <div>
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={vacSearch} onChange={(e) => setVacSearch(e.target.value)} placeholder="Vakansiya qidirish..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
            </div>
            <select value={vacStatusFilter} onChange={(e) => setVacStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-ink/30 outline-none">
              <option value="">Barcha holatlar</option>
              <option value="Faol">Faol</option>
              <option value="Nofaol">Nofaol</option>
            </select>
          </div>
          {vacancies.length === 0 ? (
            <div className="text-center py-16 text-ink-3 text-sm">Vakansiya topilmadi</div>
          ) : (
            <div className="space-y-2">
              {vacancies.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-border p-4 hover:border-ink/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-ink text-sm">{v.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          v.status === "Faol" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                        }`}>{v.status || "Faol"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-3">
                        <span>{v.company}</span>
                        <span>·</span>
                        <span>{v.author_name}</span>
                        <span>·</span>
                        <span>{v.applications_count} ta ariza</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleVacStatus(v.id, v.status || "Faol")}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface text-ink-2 hover:bg-border-soft transition-colors">
                        {v.status === "Faol" ? "Yashirish" : "Ko'rsatish"}
                      </button>
                      <button onClick={() => deleteVacancy(v.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "orders" && (
        <div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["", "Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"].map((f) => (
              <button key={f} onClick={() => setOrderStatusFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  orderStatusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
                }`}>
                {f || "Barchasi"}
              </button>
            ))}
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-16 text-ink-3 text-sm">Buyurtma topilmadi</div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Sarlavha</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Ish beruvchi</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Mutaxassis</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Narx</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                      <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
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
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
