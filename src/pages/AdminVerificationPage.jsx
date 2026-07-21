import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import FilterPills from "../components/admin/FilterPills";
import EmptyState from "../components/ui/EmptyState";
import { useT } from "../context/I18nContext";

export default function AdminVerificationPage() {
  const { t } = useT();
  const FILTERS = [
    { value: "Kutilmoqda", label: t("status.Kutilmoqda") },
    { value: "Tasdiqlangan", label: t("status.Tasdiqlangan") },
    { value: "Rad etildi", label: t("status.Rad etildi") },
    { value: "", label: t("common.all") },
  ];
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("Kutilmoqda");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      const data = await api(`/admin/verification?${p.toString()}`);
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const review = async (id, newStatus) => {
    let reject_reason = "";
    if (newStatus === "Rad etildi") {
      reject_reason = window.prompt(t("pages.adminVerification.rejectReasonPrompt")) || "";
      if (!reject_reason.trim()) return;
    }
    setBusyId(id);
    try {
      await api(`/admin/verification/${id}`, { method: "PATCH", body: { status: newStatus, reject_reason } });
      load();
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
      <AdminHeader title={t("admin.verification")} />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {error && <div className="bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
        <div className="mb-5"><FilterPills options={FILTERS} value={status} onChange={setStatus} /></div>

        {requests.length === 0 ? (
          <EmptyState icon="🪪" title={t("pages.adminVerification.emptyTitle")} description={t("pages.adminVerification.emptyDescription")} />
        ) : (
          <div className="space-y-2.5">
            {requests.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-ink-2">{v.user_role === "specialist" ? t("role.specialist") : t("role.employer")}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Tasdiqlangan" ? "bg-success-soft text-success" : v.status === "Rad etildi" ? "bg-danger-soft text-danger" : "bg-[#FEF3C7] text-[#B45309]"}`}>{t(`status.${v.status}`)}</span>
                    </div>
                    <p className="text-sm font-medium text-ink mt-2">
                      {v.user_name} <span className="text-ink-3 font-normal">({v.user_email})</span>
                    </p>
                    {v.institution && <p className="text-xs text-ink-3 mt-1">{v.institution} {v.specialty ? `· ${v.specialty}` : ""} {v.year ? `· ${v.year}` : ""}</p>}
                    {v.document_url && (
                      <a href={v.document_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> {v.document_name || t("pages.adminVerification.documentLinkFallback")}
                      </a>
                    )}
                    {v.stir && <p className="text-xs text-ink-3 mt-1">{t("pages.adminVerification.stirLabel")} <span className="font-mono">{v.stir}</span></p>}
                    {v.reject_reason && <p className="text-xs text-danger mt-1">{t("pages.adminVerification.rejectReasonLabel")} {v.reject_reason}</p>}
                    {v.reviewed_by_name && <p className="text-xs text-ink-3 mt-1">{t("pages.adminVerification.reviewedByLabel")} {v.reviewed_by_name}</p>}
                  </div>
                  {v.status === "Kutilmoqda" && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => review(v.id, "Tasdiqlangan")} disabled={busyId === v.id} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-success-soft text-success hover:opacity-80 transition-colors disabled:opacity-50">{t("common.approve")}</button>
                      <button onClick={() => review(v.id, "Rad etildi")} disabled={busyId === v.id} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-danger-soft text-danger hover:opacity-80 transition-colors disabled:opacity-50">{t("common.reject")}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
