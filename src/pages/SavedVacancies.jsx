import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Heart, Bell, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/ui/StatusBadge";
import SaveButton from "../components/ui/SaveButton";
import { VacancyCardSkeletonList } from "../components/ui/Skeleton";
import CompanyLogo from "../components/ui/CompanyLogo";
import { useT } from "../context/I18nContext";

function describeSearch(s, t) {
  const parts = [s.query, s.category, s.location, s.format, s.experience].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : t("pages.savedVacancies.allVacancies");
}

export default function SavedVacancies() {
  const { t } = useT();
  const showToast = useToast();
  const [tab, setTab] = useState("jobs");
  const [vacancies, setVacancies] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [jobsData, searchesData] = await Promise.all([
        api("/vacancies/saved"),
        api("/saved-searches").catch(() => ({ searches: [] })),
      ]);
      setVacancies(jobsData.vacancies);
      setSearches(searchesData.searches);
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.savedVacancies.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    try {
      await api(`/saved-searches/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      showToast(err.message || t("pages.savedVacancies.deleteError"), "error");
      load();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">{t("profile.savedJobs")}</h1>
        <p className="text-ink-3 text-sm">{t("pages.savedVacancies.subtitle")}</p>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab("jobs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "jobs" ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
          }`}
        >
          {t("pages.savedVacancies.jobsTab", { count: vacancies.length })}
        </button>
        <button
          onClick={() => setTab("agents")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "agents" ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
          }`}
        >
          {t("pages.savedVacancies.agentsTab", { count: searches.length })}
        </button>
      </div>

      {loading && <VacancyCardSkeletonList count={3} />}

      {!loading && tab === "jobs" && vacancies.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">
            <Heart className="w-6 h-6 text-ink-3" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">{t("pages.savedVacancies.emptyJobsTitle")}</h3>
          <p className="text-ink-3 text-sm mb-5">{t("pages.savedVacancies.emptyJobsDesc")}</p>
          <Link to="/vacancies" className="inline-flex px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            {t("pages.savedVacancies.viewVacancies")}
          </Link>
        </div>
      )}

      {!loading && tab === "jobs" && (
        <div className="space-y-3">
          {vacancies.map((v) => {
            return (
              <Link key={v.id} to={`/vacancies/${v.id}`} className="block bg-white rounded-xl border border-border p-6 hover:border-ink/20 transition-colors">
                <div className="flex items-start gap-4">
                  <CompanyLogo name={v.company} logo={v.company_logo} size="ml" />
                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="text-base font-semibold text-ink">{v.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-3">
                        <span>{v.company}</span>
                        <span>·</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{v.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <StatusBadge status={v.experience} />
                      <StatusBadge status={v.format} />
                      {v.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-surface text-ink-2 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-soft">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-ink text-sm">{v.salary}</span>
                        <span className="text-xs text-ink-3 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {timeAgo(v.created_at)}
                        </span>
                      </div>
                      <SaveButton
                        vacancyId={v.id}
                        initialSaved={true}
                        size="lg"
                        onChange={(nowSaved) => { if (!nowSaved) setVacancies((prev) => prev.filter((x) => x.id !== v.id)); }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && tab === "agents" && searches.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">
            <Bell className="w-6 h-6 text-ink-3" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">{t("pages.savedVacancies.emptyAgentsTitle")}</h3>
          <p className="text-ink-3 text-sm mb-5">{t("pages.savedVacancies.emptyAgentsDesc")}</p>
          <Link to="/vacancies" className="inline-flex px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            {t("pages.savedVacancies.startSearch")}
          </Link>
        </div>
      )}

      {!loading && tab === "agents" && searches.length > 0 && (
        <div className="space-y-3">
          {searches.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-border p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-accent-soft rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-ink text-sm truncate">{s.name || describeSearch(s, t)}</div>
                  <div className="text-xs text-ink-3 mt-0.5 truncate">{describeSearch(s, t)}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {s.match_count > 0 ? t("pages.savedVacancies.newMatches", { count: s.match_count }) : t("pages.savedVacancies.noNewMatches")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteSearch(s.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors flex-shrink-0"
                title={t("common.delete")}
              >
                <Trash2 className="w-[18px] h-[18px]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
