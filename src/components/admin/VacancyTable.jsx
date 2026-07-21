import { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Check, X as XIcon } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import EmptyState from "../ui/EmptyState";
import Pagination from "./Pagination";
import { formatDate } from "../../lib/format";
import CompanyLogo from "../ui/CompanyLogo";
import { useT } from "../../context/I18nContext";

export default function VacancyTable({ vacancies, page, pageSize, total, onPageChange, onApprove, onReject, onDelete, busyId }) {
  const { t } = useT();
  const [openMenuId, setOpenMenuId] = useState(null);

  if (vacancies.length === 0) {
    return <EmptyState icon="🗂️" title={t("vacancyTable.notFound")} description={t("vacancyTable.notFoundDescription")} />;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
              <th className="px-5 py-2.5 font-medium">{t("vacancyTable.company")}</th>
              <th className="px-3 py-2.5 font-medium">{t("vacancyTable.position")}</th>
              <th className="px-3 py-2.5 font-medium">{t("vacancyTable.location")}</th>
              <th className="px-3 py-2.5 font-medium text-center">{t("nav.applications")}</th>
              <th className="px-3 py-2.5 font-medium">{t("vacancyPreviewModal.salary")}</th>
              <th className="px-3 py-2.5 font-medium">{t("common.status")}</th>
              <th className="px-3 py-2.5 font-medium">{t("common.date")}</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {vacancies.map((v) => (
              <tr key={v.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CompanyLogo name={v.company} logo={v.company_logo} size="sm" />
                    <span className="text-ink font-medium truncate max-w-[10rem]">{v.company}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Link to={`/admin/vacancies/${v.id}`} className="text-ink hover:text-accent transition-colors font-medium truncate block max-w-[12rem]">{v.title}</Link>
                  <span className="text-xs text-ink-3">{(v.directions && v.directions[0]) || v.category}</span>
                </td>
                <td className="px-3 py-3 text-ink-2 whitespace-nowrap">{v.location || "—"}</td>
                <td className="px-3 py-3 text-center text-ink-2">{v.applications_count}</td>
                <td className="px-3 py-3 text-ink-2 whitespace-nowrap">
                  {v.salary_min || v.salary_max ? `${v.salary_min || 0}–${v.salary_max || 0} so'm` : v.salary || "—"}
                </td>
                <td className="px-3 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-3 py-3 text-ink-3 whitespace-nowrap">{formatDate(v.created_at)}</td>
                <td className="px-5 py-3 relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                    disabled={busyId === v.id}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-surface hover:text-ink transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === v.id && (
                    <div className="absolute right-5 top-9 z-10 bg-white border border-border rounded-lg shadow-lg py-1 w-40">
                      <button onClick={() => { onApprove(v.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:bg-surface flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-success" /> {t("common.approve")}
                      </button>
                      <button onClick={() => { onReject(v.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:bg-surface flex items-center gap-2">
                        <XIcon className="w-3.5 h-3.5 text-danger" /> {t("status.Tuzatish kerak")}
                      </button>
                      <Link to={`/admin/vacancies/${v.id}`} onClick={() => setOpenMenuId(null)} className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:bg-surface flex items-center gap-2 block">
                        {t("vacancyTable.details")}
                      </Link>
                      <button onClick={() => { onDelete(v.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-danger hover:bg-danger-soft flex items-center gap-2">
                        {t("common.delete")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 pb-4">
        <Pagination page={page} limit={pageSize} total={total} onChange={onPageChange} />
      </div>
    </>
  );
}
