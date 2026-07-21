import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Globe, ExternalLink, Users, Building2, Briefcase, Clock } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import StatusBadge from "../components/ui/StatusBadge";
import CompanyLogo from "../components/ui/CompanyLogo";
import { useT } from "../context/I18nContext";

export default function CompanyProfile() {
  const { id } = useParams();
  const { t } = useT();
  const [company, setCompany] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api(`/companies/${id}`)
      .then((d) => { setCompany(d.company); setVacancies(d.vacancies); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error || !company) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("pages.companyProfile.notFound")}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/vacancies" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav.vacancies")}
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 md:p-8 mb-4">
        <div className="flex items-start gap-4">
          <CompanyLogo name={company.display_name} logo={company.company_logo} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">{company.display_name}</h1>
              {!!company.verified && <VerifiedBadge size="sm" />}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-ink-3">
              {!!company.industry && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {company.industry}</span>}
              {!!company.employee_count && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t("pages.companyProfile.employeeCount", { count: company.employee_count })}</span>}
              {!!(company.address || company.city) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {company.address || company.city}</span>}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap text-sm">
              <span className="flex items-center gap-1 text-ink-2 font-medium">
                <Star className="w-4 h-4 text-ink fill-ink" /> {company.rating || "—"} {company.reviews_count > 0 && <span className="text-ink-3 font-normal">({t("pages.companyProfile.reviewsCount", { count: company.reviews_count })})</span>}
              </span>
              <span className="flex items-center gap-1 text-ink-3">
                <Briefcase className="w-3.5 h-3.5" /> {t("pages.companyProfile.openVacanciesCount", { count: company.open_vacancies_count })}
              </span>
            </div>
            {(company.website || company.social_linkedin) && (
              <div className="flex items-center gap-4 mt-3">
                {!!company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                    <Globe className="w-3.5 h-3.5" /> {t("pages.companyProfile.websiteLabel")}
                  </a>
                )}
                {!!company.social_linkedin && (
                  <a href={company.social_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!!company.company_description && (
        <div className="bg-white rounded-xl border border-border p-6 mb-4">
          <h2 className="text-base font-semibold text-ink mb-3">{t("pages.companyProfile.aboutTitle")}</h2>
          <p className="text-ink-2 text-sm leading-relaxed whitespace-pre-line">{company.company_description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-ink mb-4">{t("pages.companyProfile.openVacanciesTitle", { count: vacancies.length })}</h2>
        {vacancies.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase className="w-8 h-8 text-ink-3 mx-auto mb-2" />
            <p className="text-sm text-ink-3">{t("pages.companyProfile.noOpenVacancies")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vacancies.map((v) => {
              return (
                <Link key={v.id} to={`/vacancies/${v.id}`} className="block p-4 -mx-1 rounded-lg border border-border hover:border-ink/20 transition-colors">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm">{v.title}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-3">
                      <MapPin className="w-3 h-3" /> {v.location}
                      <span>·</span>
                      <Clock className="w-3 h-3" /> {timeAgo(v.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <StatusBadge status={v.experience} />
                      <StatusBadge status={v.format} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
