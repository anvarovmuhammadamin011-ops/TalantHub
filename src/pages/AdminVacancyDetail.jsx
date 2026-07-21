import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Users, Building2 } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import { useT } from "../context/I18nContext";

export default function AdminVacancyDetail() {
  const { id } = useParams();
  const { t } = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api(`/admin/vacancies/${id}/detail`)
      .then(setData)
      .catch((err) => setError(err.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  if (error || !data) return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><EmptyState icon="⚠️" title={t("pages.adminVacancyDetail.notFoundTitle")} description={error || t("pages.adminVacancyDetail.notFoundDescription")} /></div>;

  const { vacancy: v, applications } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("pages.adminVacancyDetail.backToAdmin")}
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-ink">{v.title}</h1>
              <StatusBadge status={v.status || "Faol"} />
            </div>
            <p className="text-sm text-ink-3 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {v.company}
              {v.author_name && <>· <Link to={`/admin/users/${v.employer_id}`} className="hover:underline text-ink-2">{v.author_name}</Link></>}
            </p>
            {v.reject_reason && v.status === "Tuzatish kerak" && (
              <div className="text-xs text-danger mt-2 bg-danger-soft rounded-lg px-3 py-2 inline-block">{t("pages.adminVacancyDetail.reasonLabel")} {v.reject_reason}</div>
            )}
          </div>
          <div className="text-right text-xs text-ink-3 space-y-1">
            <div className="flex items-center gap-1 justify-end"><Eye className="w-3.5 h-3.5" /> {t("pages.adminVacancyDetail.viewsCount", { count: v.views || 0 })}</div>
            <div className="flex items-center gap-1 justify-end"><Users className="w-3.5 h-3.5" /> {t("pages.adminVacancyDetail.applicationsCount", { count: applications.length })}</div>
            <div>{t("pages.adminVacancyDetail.createdLabel")} {timeAgo(v.created_at)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {[v.format, v.experience, v.employment_type, v.english_level, ...(v.directions || [])].filter(Boolean).map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border">{tag}</span>
          ))}
        </div>

        {v.description && (
          <p className="text-sm text-ink-2 mt-4 border-t border-border pt-4 whitespace-pre-line">{v.description}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.adminVacancyDetail.applicationsHeader", { count: applications.length })}</h2>
        {applications.length === 0 ? (
          <p className="text-xs text-ink-3">{t("pages.adminVacancyDetail.noApplications")}</p>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                <Link to={`/admin/users/${a.user_id}`} className="text-ink-2 hover:underline truncate">{a.specialist_name}</Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-ink-3">{timeAgo(a.created_at)}</span>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
