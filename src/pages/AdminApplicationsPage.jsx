import { useState, useEffect, useMemo } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import FilterPills from "../components/admin/FilterPills";
import Pagination from "../components/admin/Pagination";
import EmptyState from "../components/ui/EmptyState";
import { formatDate } from "../lib/format";
import { useAdminRealtime } from "../hooks/useAdminRealtime";
import { useT } from "../context/I18nContext";

const APPLICATION_STATUSES = ["Yuborildi", "Ko'rib chiqilmoqda", "Interview", "Qabul qilindi", "Rad etildi"];
const PAGE_SIZE = 20;

export default function AdminApplicationsPage() {
  const { t } = useT();
  const FILTERS = useMemo(
    () => [{ value: "", label: t("common.all") }, ...APPLICATION_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))],
    [t]
  );
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const data = await api("/admin/applications");
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useAdminRealtime(load);

  const filtered = useMemo(() => {
    let list = applications;
    if (status) list = list.filter((a) => a.status === status);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.vacancy_title?.toLowerCase().includes(q) || a.specialist_name?.toLowerCase().includes(q));
    }
    return list;
  }, [applications, status, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateStatus = async (id, newStatus) => {
    setBusyId(id);
    try {
      await api(`/admin/applications/${id}/status`, { method: "PATCH", body: { status: newStatus } });
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("pages.adminApplications.deleteConfirm"))) return;
    setBusyId(id);
    try {
      await api(`/admin/applications/${id}`, { method: "DELETE" });
      setApplications((prev) => prev.filter((a) => a.id !== id));
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
        title={t("nav.applications")}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("pages.adminApplications.searchPlaceholder")}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-5 border-b border-border-soft">
            <FilterPills options={FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="📋" title={t("pages.adminApplications.emptyTitle")} description={t("pages.adminApplications.emptyDescription")} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                      <th className="px-5 py-2.5 font-medium">{t("role.specialist")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("pages.adminApplications.colVacancy")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("pages.adminApplications.colMatch")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("common.status")}</th>
                      <th className="px-3 py-2.5 font-medium">{t("common.date")}</th>
                      <th className="px-5 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((a) => (
                      <tr key={a.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-ink truncate max-w-[10rem]">{a.specialist_name}</p>
                          <p className="text-xs text-ink-3 truncate max-w-[10rem]">{a.specialist_email}</p>
                        </td>
                        <td className="px-3 py-3 text-ink-2 truncate max-w-[12rem]">{a.vacancy_title}</td>
                        <td className="px-3 py-3 text-ink-2">{a.match_percent ? `${a.match_percent}%` : "—"}</td>
                        <td className="px-3 py-3">
                          <select
                            value={a.status}
                            disabled={busyId === a.id}
                            onChange={(e) => updateStatus(a.id, e.target.value)}
                            className="text-xs border border-border rounded-md px-2 py-1 bg-white text-ink-2 focus:outline-none focus:border-accent disabled:opacity-50"
                          >
                            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-ink-3 whitespace-nowrap">{formatDate(a.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => remove(a.id)} disabled={busyId === a.id} className="text-xs font-medium text-danger hover:underline disabled:opacity-50">
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
