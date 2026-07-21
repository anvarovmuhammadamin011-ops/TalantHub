import { useState, useEffect } from "react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import EmptyState from "../components/ui/EmptyState";
import { formatDateTime } from "../lib/format";
import { useT } from "../context/I18nContext";

export default function AdminLogsPage() {
  const { t } = useT();
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (actionFilter) p.set("action", actionFilter);
      const data = await api(`/admin/logs?${p.toString()}`);
      setLogs(data.logs || []);
      setActions(data.actions || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, actionFilter]);

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-8 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  return (
    <div>
      <AdminHeader
        title={t("admin.logs")}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("pages.adminLogs.searchPlaceholder")}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="mb-5">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm bg-white">
            <option value="">{t("pages.adminLogs.allActions")}</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {logs.length === 0 ? (
          <EmptyState icon="📜" title={t("pages.adminLogs.emptyTitle")} description={t("pages.adminLogs.emptyDescription")} />
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                    <th className="px-5 py-3 font-medium">{t("pages.adminLogs.colAdmin")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminLogs.colAction")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminLogs.colDetails")}</th>
                    <th className="px-5 py-3 font-medium">{t("pages.adminLogs.colTime")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-3 text-ink font-medium">{l.admin_name || "—"}</td>
                      <td className="px-3 py-3 text-ink-2">{l.action}{l.target_type ? ` · ${l.target_type}#${l.target_id}` : ""}</td>
                      <td className="px-3 py-3 text-ink-3">{l.details || "—"}</td>
                      <td className="px-5 py-3 text-ink-3 whitespace-nowrap">{l.created_at ? formatDateTime(l.created_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
