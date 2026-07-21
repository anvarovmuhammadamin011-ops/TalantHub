import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import Pagination from "../components/admin/Pagination";
import EmptyState from "../components/ui/EmptyState";
import { useT } from "../context/I18nContext";

const PAGE_SIZE = 20;

function parseCategories(raw) {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function AdminSpecialistsPage() {
  const { t } = useT();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams({ role: "specialist", page: String(page), limit: String(PAGE_SIZE) });
      if (search) p.set("search", search);
      const data = await api(`/admin/users?${p.toString()}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);

  const toggleBlock = async (u) => {
    setBusyId(u.id);
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body: { blocked: !u.blocked } });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, blocked: !u.blocked } : x)));
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminHeader
        title={t("nav.specialists")}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("pages.adminSpecialists.searchPlaceholder")}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-16 text-ink-3 text-sm">{t("common.loading")}</div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            <button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button>
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon="🎓" title={t("pages.adminSpecialists.notFoundTitle")} description={t("pages.adminCompanies.notFoundDescription")} />
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                    <th className="px-5 py-3 font-medium">{t("pages.adminSpecialists.colSpecialist")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminSpecialists.colProfession")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminCompanies.colCity")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminSpecialists.colRating")}</th>
                    <th className="px-3 py-3 font-medium">{t("common.status")}</th>
                    <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const categories = parseCategories(u.categories);
                    return (
                      <tr key={u.id} className={`border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors ${u.blocked ? "opacity-60" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 overflow-hidden">
                              {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">{u.name}</p>
                              <p className="text-xs text-ink-3 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-ink-2 max-w-[12rem] truncate">{categories.length ? categories.join(", ") : "—"}</td>
                        <td className="px-3 py-3 text-ink-2 whitespace-nowrap">{u.city || "—"}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 text-ink-2">
                            <Star className="w-3.5 h-3.5 text-[#B45309] fill-[#B45309]" />
                            {u.rating ? u.rating.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${u.blocked ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                            {u.blocked ? t("pages.adminUsers.blocked") : t("status.Faol")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-3">
                            <Link to={`/admin/users/${u.id}`} className="text-xs font-medium text-ink-2 hover:text-ink">{t("common.view")}</Link>
                            <button
                              onClick={() => toggleBlock(u)}
                              disabled={busyId === u.id}
                              className={`text-xs font-medium disabled:opacity-50 ${u.blocked ? "text-success hover:underline" : "text-danger hover:underline"}`}
                            >
                              {u.blocked ? t("pages.adminUsers.unblock") : t("pages.adminUsers.block")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5">
              <Pagination page={page} limit={PAGE_SIZE} total={total} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
