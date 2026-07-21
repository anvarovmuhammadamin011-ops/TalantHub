import { useState, useEffect } from "react";
import { Flag, CheckCircle2, X } from "lucide-react";
import { api } from "../lib/api";
import { useT } from "../context/I18nContext";

const STATUS_FILTERS = ["", "Ochiq", "Hal qilindi"];

export default function AdminDisputes() {
  const { t } = useT();
  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const data = await api(`/admin/disputes?${params.toString()}`);
      setDisputes(data.disputes);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openResolve = (dispute) => {
    setResolving(dispute);
    setResolutionText(dispute.resolution || "");
  };

  const submitResolve = async () => {
    setUpdatingId(resolving.id);
    try {
      await api(`/admin/disputes/${resolving.id}`, {
        method: "PATCH",
        body: { resolution: resolutionText.trim(), status: "Hal qilindi" },
      });
      setResolving(null);
      setResolutionText("");
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const reopen = async (dispute) => {
    setUpdatingId(dispute.id);
    try {
      await api(`/admin/disputes/${dispute.id}`, { method: "PATCH", body: { status: "Ochiq" } });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">{t("admin.disputes")}</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === f ? "bg-ink text-white" : "bg-white text-ink-2 border border-border hover:bg-surface"
            }`}>{f ? t(`status.${f}`) : t("common.all")}</button>
        ))}
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-4">
            <Flag className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-ink-3">{t("pages.adminDisputes.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-ink text-sm">{d.order_title || t("pages.adminDisputes.orderFallback", { id: d.order_id })}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                      d.status === "Hal qilindi" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}>{t(`status.${d.status}`)}</span>
                  </div>
                  <div className="text-xs text-ink-3 mt-1">{t("pages.adminDisputes.openedBy", { name: d.opened_by_name, price: d.order_price })}</div>
                  {!!d.reason && <p className="text-sm text-ink-2 mt-2">{d.reason}</p>}
                  {!!d.resolution && (
                    <div className="mt-3 pt-3 border-t border-border-soft">
                      <div className="text-[10px] font-medium text-ink-3 uppercase tracking-wide mb-1">{t("pages.adminDisputes.resolutionLabel")}</div>
                      <p className="text-sm text-ink-2">{d.resolution}</p>
                      {!!d.resolved_by_name && <p className="text-xs text-ink-3 mt-1">{t("pages.adminDisputes.resolvedBy", { name: d.resolved_by_name })}</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={() => openResolve(d)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-ink-2 hover:bg-border-soft transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {d.resolution ? t("pages.adminDisputes.editResolution") : t("pages.adminDisputes.resolve")}
                </button>
                {d.status === "Hal qilindi" && (
                  <button onClick={() => reopen(d)} disabled={updatingId === d.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-soft text-danger hover:opacity-80 transition-colors disabled:opacity-50">
                    {t("pages.adminDisputes.reopen")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolving && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setResolving(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-ink text-base">{resolving.order_title || t("pages.adminDisputes.orderFallback", { id: resolving.order_id })}</h3>
              <button onClick={() => setResolving(null)} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-ink-3 mb-4">{t("pages.adminDisputes.reasonLabel", { reason: resolving.reason })}</p>
            <textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} rows={4}
              placeholder={t("pages.adminDisputes.resolutionPlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setResolving(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={submitResolve} disabled={!resolutionText.trim() || updatingId === resolving.id}
                className="flex-1 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("pages.adminDisputes.markResolved")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
