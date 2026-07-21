import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, BadgeCheck } from "lucide-react";
import { api } from "../lib/api";
import AdminHeader from "../components/admin/AdminHeader";
import Pagination from "../components/admin/Pagination";
import EmptyState from "../components/ui/EmptyState";
import CompanyLogo from "../components/ui/CompanyLogo";
import { useT } from "../context/I18nContext";

const PAGE_SIZE = 20;

export default function AdminCompaniesPage() {
  const { t } = useT();
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) p.set("search", search);
      const data = await api(`/admin/companies?${p.toString()}`);
      setCompanies(data.companies);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);

  return (
    <div>
      <AdminHeader
        title={t("admin.companies")}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("pages.adminCompanies.searchPlaceholder")}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-16 text-ink-3 text-sm">{t("common.loading")}</div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
            <button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button>
          </div>
        ) : companies.length === 0 ? (
          <EmptyState icon="🏢" title={t("pages.adminCompanies.notFoundTitle")} description={t("pages.adminCompanies.notFoundDescription")} />
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-3 border-b border-border-soft">
                    <th className="px-5 py-3 font-medium">{t("pages.adminCompanies.colCompany")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminCompanies.colIndustry")}</th>
                    <th className="px-3 py-3 font-medium">{t("pages.adminCompanies.colCity")}</th>
                    <th className="px-3 py-3 font-medium text-center">{t("nav.vacancies")}</th>
                    <th className="px-3 py-3 font-medium">{t("common.status")}</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b border-border-soft last:border-0 hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CompanyLogo name={c.display_name} logo={c.company_logo} size="sm" />
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="font-medium text-ink truncate">{c.display_name}</span>
                            {!!c.verified && <BadgeCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-2">{c.industry || "—"}</td>
                      <td className="px-3 py-3 text-ink-2 whitespace-nowrap">{c.city || "—"}</td>
                      <td className="px-3 py-3 text-center text-ink-2">
                        {c.vacancies_count} <span className="text-ink-3">({t("pages.adminCompanies.activeCount", { count: c.active_vacancies_count })})</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.blocked ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                          {c.blocked ? t("pages.adminUsers.blocked") : t("status.Faol")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link to={`/admin/users/${c.id}`} className="text-xs font-medium text-ink-2 hover:text-ink">{t("pages.adminCompanies.adminView")}</Link>
                          <Link to={`/companies/${c.id}`} target="_blank" className="text-ink-3 hover:text-ink">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
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
