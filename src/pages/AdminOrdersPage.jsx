import { useState, useEffect, useMemo } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import FilterPills from "../components/admin/FilterPills";
import Pagination from "../components/admin/Pagination";
import EmptyState from "../components/ui/EmptyState";
import { formatDate } from "../lib/format";
import { useT } from "../context/I18nContext";

const ORDER_STATUSES = ["Yangi", "Qabul qilindi", "Jarayonda", "Tugatildi", "Bekor qilindi"];
const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const { t } = useT();
  const FILTERS = useMemo(
    () => [{ value: "", label: t("common.all") }, ...ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))],
    [t]
  );
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const data = await api("/admin/orders");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (status) list = list.filter((o) => o.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => o.title?.toLowerCase().includes(q) || o.employer_name?.toLowerCase().includes(q) || o.specialist_name?.toLowerCase().includes(q));
    }
    return list;
  }, [orders, status, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateStatus = async (id, newStatus) => {
    setBusyId(id);
    try {
      await api(`/admin/orders/${id}/status`, { method: "PATCH", body: { status: newStatus } });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("pages.adminOrders.confirmDelete"))) return;
    setBusyId(id);
    try {
      await api(`/admin/orders/${id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-8 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  return (
    <div>
      <AdminHeader
        title={t("nav.orders")}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("pages.adminOrders.searchPlaceholder")}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-5 border-b border-border-soft">
            <FilterPills options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="📦" title={t("pages.adminOrders.notFoundTitle")} description={t("pages.adminOrders.notFoundDescription")} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                      <th className="px-5 py-2.5 font-medium">{t("pages.adminOrders.colOrder")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("role.employer")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("role.specialist")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("pages.adminOrders.colPrice")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("common.status")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("common.date")}</th>
                      <th className="px-5 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((o) => (
                      <tr key={o.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                        <td className="px-5 py-3 text-ink font-medium truncate max-w-[12rem]">{o.title}</td>
                        <td className="px-3 py-3 text-ink-2 truncate max-w-[9rem]">{o.employer_name}</td>
                        <td className="px-3 py-3 text-ink-2 truncate max-w-[9rem]">{o.specialist_name}</td>
                        <td className="px-3 py-3 text-ink-2 whitespace-nowrap">{o.price || "—"}</td>
                        <td className="px-3 py-3">
                          <select
                            value={o.status}
                            disabled={busyId === o.id}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="text-xs border border-border rounded-md px-2 py-1 bg-white text-ink-2 focus:outline-none focus:border-accent disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-ink-3 whitespace-nowrap">{formatDate(o.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => remove(o.id)} disabled={busyId === o.id} className="text-xs font-medium text-danger hover:underline disabled:opacity-50">
                            {t("common.delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 pb-4">
                <Pagination page={page} limit={PAGE_SIZE} total={filtered.length} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
