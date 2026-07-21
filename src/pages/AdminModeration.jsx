import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, RotateCcw, Clock, X, ScanSearch, ExternalLink, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import FilterPills from "../components/admin/FilterPills";
import EmptyState from "../components/ui/EmptyState";
import { useAdminRealtime } from "../hooks/useAdminRealtime";
import { useT } from "../context/I18nContext";

function truncate(text, n) {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n)}...` : text;
}

function getFlagFilters(t) {
  return [
    { value: "", label: t("common.all") },
    { value: "Ko'rib chiqilmoqda", label: t("status.Ko'rib chiqilmoqda") },
    { value: "Tasdiqlangan", label: t("status.Tasdiqlangan") },
    { value: "Rad etilgan", label: t("status.Rad etilgan") },
  ];
}

function flagTargetLink(f) {
  if (f.target_type === "user" || f.target_type === "profile") return `/admin/users/${f.target_id}`;
  if (f.target_type === "specialist") return `/specialists/${f.target_id}`;
  if (f.target_type === "vacancy") return `/vacancies/${f.target_id}`;
  return null;
}

function PendingVacanciesTab() {
  const { t } = useT();
  const [vacancies, setVacancies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const load = async () => {
    setError("");
    try {
      const [vacData, statsData] = await Promise.all([
        api("/admin/vacancies?status=Kutilmoqda"),
        api("/admin/stats"),
      ]);
      setVacancies(vacData.vacancies);
      setStats(statsData);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useAdminRealtime(load);

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api("/admin/moderation/scan", { method: "POST" });
      setScanResult(result);
    } catch (err) {
      setScanResult({ error: err.message || t("common.error") });
    } finally {
      setScanning(false);
    }
  };

  const approve = async (id) => {
    setUpdatingId(id);
    try {
      await api(`/admin/vacancies/${id}/status`, { method: "PATCH", body: { status: "Faol" } });
      setVacancies((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return;
    setUpdatingId(rejecting.id);
    try {
      await api(`/admin/vacancies/${rejecting.id}/status`, { method: "PATCH", body: { status: "Tuzatish kerak", reject_reason: rejectReason.trim() } });
      setVacancies((prev) => prev.filter((v) => v.id !== rejecting.id));
      setRejecting(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = stats ? [
    { label: t("status.Kutilmoqda"), value: stats.vacancies_pending, color: "bg-[#FEF3C7] text-[#B45309]" },
    { label: t("status.Faol"), value: stats.vacancies_active, color: "bg-success-soft text-success" },
    { label: t("pages.adminModeration.statLabelInRevision"), value: stats.vacancies_needs_fix, color: "bg-danger-soft text-danger" },
    { label: t("pages.adminModeration.statLabelTotal"), value: stats.vacancies_total, color: "bg-surface text-ink-2" },
  ] : [];

  if (loading) {
    return <div className="py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
            <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${s.color}`}>{s.label}</div>
            <div className="text-2xl font-semibold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">{t("pages.adminModeration.bulkScanTitle")}</h2>
            <p className="text-xs text-ink-3 mt-0.5">{t("pages.adminModeration.bulkScanDescription")}</p>
          </div>
          <button onClick={runScan} disabled={scanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 flex-shrink-0">
            <ScanSearch className="w-3.5 h-3.5" />
            {scanning ? t("pages.adminModeration.scanningInProgress") : t("pages.adminModeration.startScan")}
          </button>
        </div>
        {scanResult && (
          <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${scanResult.error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
            {scanResult.error || t("pages.adminModeration.scanResultSummary", { scannedWords: scanResult.scannedWords, flagged: scanResult.flagged })}
          </div>
        )}
      </div>

      <h2 className="font-semibold text-ink text-sm mb-4">{t("pages.adminModeration.pendingListHeading")}</h2>
      {vacancies.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-4">
            <ClipboardCheck className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-ink-3">{t("pages.adminModeration.emptyPending")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacancies.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <Link to={`/admin/vacancies/${v.id}`} className="font-medium text-ink text-sm hover:underline">{v.title}</Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-ink-3">
                    <span>{v.author_name}</span>
                    {(v.directions || []).length > 0 && <><span>·</span><span>{v.directions.join(", ")}</span></>}
                    <span>·</span><span>{v.experience}</span>
                  </div>
                  <p className="text-xs text-ink-3 mt-2">{truncate(v.description, 60)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button onClick={() => setViewing(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-ink-2 hover:bg-border-soft transition-colors flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {t("common.view")}
                </button>
                <button onClick={() => approve(v.id)} disabled={updatingId === v.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-success-soft text-success hover:opacity-80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t("common.approve")}
                </button>
                <button onClick={() => { setRejecting(v); setRejectReason(""); }} disabled={updatingId === v.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-soft text-danger hover:opacity-80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> {t("pages.adminModeration.returnForRevision")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-base">{viewing.title}</h3>
              <button onClick={() => setViewing(null)} className="text-ink-3 hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-xs text-ink-3 mb-4">{viewing.author_name} · {viewing.experience} · {viewing.location}</div>
            <p className="text-sm text-ink-2 whitespace-pre-line">{viewing.description}</p>
          </div>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejecting(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink text-base mb-1">{t("pages.adminModeration.returnForRevision")}</h3>
            <p className="text-xs text-ink-3 mb-4">{t("pages.adminModeration.rejectReasonPrompt", { title: rejecting.title })}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder={t("pages.adminModeration.rejectReasonPlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setRejecting(null)} className="flex-1 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">{t("common.cancel")}</button>
              <button onClick={submitReject} disabled={!rejectReason.trim() || updatingId === rejecting.id}
                className="flex-1 py-2.5 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                {t("common.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlagsQueueTab() {
  const { t } = useT();
  const [flags, setFlags] = useState([]);
  const [status, setStatus] = useState("Ko'rib chiqilmoqda");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      const data = await api(`/admin/flags?${p.toString()}`);
      setFlags(data.flags || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);
  useAdminRealtime(load);

  const updateFlag = async (flag, newStatus) => {
    let block = false;
    if (newStatus === "Tasdiqlangan" && flag.target_type === "user") {
      block = window.confirm(t("pages.adminModeration.confirmBlockUserOnApprove"));
    }
    try {
      await api(`/admin/flags/${flag.id}`, { method: "PATCH", body: { status: newStatus, block, resolution_note: "" } });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  const deleteFlag = async (id) => {
    if (!window.confirm(t("pages.adminModeration.confirmDeleteFlag"))) return;
    try {
      await api(`/admin/flags/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err.message || t("common.error"));
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  const flagFilters = getFlagFilters(t);

  return (
    <div>
      {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      <div className="mb-5"><FilterPills options={flagFilters} value={status} onChange={setStatus} /></div>

      {flags.length === 0 ? (
        <EmptyState icon="🚩" title={t("pages.adminModeration.flagsEmptyTitle")} description={t("pages.adminModeration.flagsEmptyDescription")} />
      ) : (
        <div className="space-y-2.5">
          {flags.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.severity === "Yuqori" ? "bg-danger-soft text-danger" : f.severity === "O'rta" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-accent-soft text-accent"}`}>{f.severity}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-ink-2">{f.target_type} #{f.target_id}</span>
                    {!!f.auto_detected && <span className="text-[10px] text-accent font-medium">{t("pages.adminModeration.aiDetected")}</span>}
                  </div>
                  <p className="text-sm text-ink mt-2">{f.reason || t("pages.adminModeration.reasonNotProvided")}</p>
                  <p className="text-xs text-ink-3 mt-1">
                    {f.reporter_name ? `${t("pages.adminModeration.reporterLabel", { name: f.reporter_name, email: f.reporter_email })} · ` : ""}
                    {f.reviewed_by_name ? t("pages.adminModeration.reviewedByLabel", { name: f.reviewed_by_name }) : ""}
                  </p>
                  {flagTargetLink(f) && (
                    <Link to={flagTargetLink(f)} className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> {t("pages.adminModeration.viewTarget")}
                    </Link>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {f.status === "Ko'rib chiqilmoqda" && (
                    <>
                      <button onClick={() => updateFlag(f, "Tasdiqlangan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-success-soft text-success hover:opacity-80 transition-colors">{t("pages.adminModeration.validFlag")}</button>
                      <button onClick={() => updateFlag(f, "Rad etilgan")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger-soft text-danger hover:opacity-80 transition-colors">{t("pages.adminModeration.invalidFlag")}</button>
                    </>
                  )}
                  <button onClick={() => deleteFlag(f.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminModeration() {
  const { t } = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(location.pathname === "/admin/flags" ? "flags" : "vacancies");

  const switchTab = (nextTab) => {
    setTab(nextTab);
    navigate(nextTab === "flags" ? "/admin/flags" : "/admin/moderation", { replace: true });
  };

  return (
    <div>
      <AdminHeader title={t("admin.moderation")} />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="inline-flex items-center bg-surface rounded-lg p-0.5 border border-border mb-6">
          <button
            onClick={() => switchTab("vacancies")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "vacancies" ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
          >
            {t("pages.adminModeration.tabPendingVacancies")}
          </button>
          <button
            onClick={() => switchTab("flags")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "flags" ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
          >
            {t("pages.adminModeration.tabFlagsQueue")}
          </button>
        </div>
        {tab === "vacancies" ? <PendingVacanciesTab /> : <FlagsQueueTab />}
      </div>
    </div>
  );
}
