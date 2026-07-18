import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Users as UsersIcon } from "lucide-react";
import { api } from "../lib/api";

const ROLE_OPTIONS = [
  { value: "", label: "Hammasi" },
  { value: "specialist", label: "Ish qidiruvchi" },
  { value: "employer", label: "Ish beruvchi" },
  { value: "admin", label: "Admin" },
];
const roleLabels = { specialist: "Ish qidiruvchi", employer: "Ish beruvchi", admin: "Admin" };
const roleColors = { specialist: "bg-blue-50 text-blue-600", employer: "bg-purple-50 text-purple-600", admin: "bg-amber-50 text-amber-600" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams({ limit: "100" });
      if (search) p.set("search", search);
      if (roleFilter) p.set("role", roleFilter);
      const data = await api(`/admin/users?${p.toString()}`);
      setUsers(data.users);
      setTotal(data.total ?? data.users.length);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const toggleBlock = async (u) => {
    setUpdatingId(u.id);
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body: { blocked: !u.blocked } });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, blocked: !u.blocked } : x));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">Foydalanuvchilar</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ism yoki email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none bg-white" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white focus:border-accent outline-none">
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-ink-3 text-sm">Yuklanmoqda...</div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">Qayta urinish</button></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-4">
            <UsersIcon className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-ink-3">Foydalanuvchi topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Foydalanuvchi</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Rol</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Ro'yxatdan o'tgan</th>
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Holat</th>
                  <th className="text-right text-xs font-medium text-ink-3 uppercase tracking-wide px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-surface transition-colors ${u.blocked ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                          {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-ink text-sm truncate">{u.name}</div>
                          <div className="text-xs text-ink-3 sm:hidden">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${roleColors[u.role] || ""}`}>{roleLabels[u.role] || u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-3 hidden md:table-cell">{new Date(u.created_at).toLocaleDateString("uz-UZ")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${u.blocked ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                        {u.blocked ? "Bloklangan" : "Faol"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/users/${u.id}`} className="text-xs font-medium text-ink-2 hover:text-ink">Ko'rish</Link>
                        <button onClick={() => toggleBlock(u)} disabled={updatingId === u.id}
                          className={`text-xs font-medium disabled:opacity-50 ${u.blocked ? "text-success hover:underline" : "text-danger hover:underline"}`}>
                          {u.blocked ? "Blokdan chiqarish" : "Bloklash"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-ink-3">{total} ta foydalanuvchi</div>
        </div>
      )}
    </div>
  );
}
