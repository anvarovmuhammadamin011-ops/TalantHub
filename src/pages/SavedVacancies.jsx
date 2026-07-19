import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Heart, Bell, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, computeMatch } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import MatchIndicator from "../components/ui/MatchIndicator";
import StatusBadge from "../components/ui/StatusBadge";
import { VacancyCardSkeletonList } from "../components/ui/Skeleton";

function describeSearch(s) {
  const parts = [s.query, s.category, s.location, s.format, s.experience].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Barcha vakansiyalar";
}

export default function SavedVacancies() {
  const { user } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  const unsave = async (e, vacancyId) => {
    e.preventDefault();
    e.stopPropagation();
    setVacancies((prev) => prev.filter((v) => v.id !== vacancyId));
    try {
      await api(`/vacancies/${vacancyId}/save`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      load();
    }
  };

  const deleteSearch = async (id) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    try {
      await api(`/saved-searches/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      load();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight mb-1.5">Saqlangan ishlar</h1>
        <p className="text-ink-3 text-sm">Yoqqan vakansiyalar va qidiruv agentlaringiz</p>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab("jobs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "jobs" ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
          }`}
        >
          Ishlar ({vacancies.length})
        </button>
        <button
          onClick={() => setTab("agents")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "agents" ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
          }`}
        >
          Qidiruv agentlari ({searches.length})
        </button>
      </div>

      {loading && <VacancyCardSkeletonList count={3} />}

      {!loading && tab === "jobs" && vacancies.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border text-2xl mb-5">
            <Heart className="w-6 h-6 text-ink-3" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">Hali hech narsa saqlanmagan</h3>
          <p className="text-ink-3 text-sm mb-5">Yoqqan vakansiyalarni yurak belgisi orqali saqlab qo'ying</p>
          <Link to="/vacancies" className="inline-flex px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            Vakansiyalarni ko'rish
          </Link>
        </div>
      )}

      {!loading && tab === "jobs" && (
        <div className="space-y-3">
          {vacancies.map((v) => {
            const matchPercent = computeMatch(user?.skills, v.tags);
            return (
              <Link key={v.id} to={`/vacancies/${v.id}`} className="block bg-white rounded-xl border border-border p-6 hover:border-ink/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {v.company_logo || "🏢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-ink">{v.title}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-3">
                          <span>{v.company}</span>
                          <span>·</span>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{v.location}</span>
                        </div>
                      </div>
                      <MatchIndicator percent={matchPercent} />
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
                      <button
                        onClick={(e) => unsave(e, v.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-danger hover:bg-danger-soft transition-colors"
                        title="Saqlangandan olib tashlash"
                      >
                        <Heart className="w-[18px] h-[18px]" fill="currentColor" />
                      </button>
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
          <h3 className="text-base font-semibold text-ink mb-1.5">Qidiruv agenti yo'q</h3>
          <p className="text-ink-3 text-sm mb-5">Vakansiyalar sahifasida qidiruv qiling va "Ogohlantirish yarat" tugmasini bosing — mos vakansiya chiqqanda sizga xabar beramiz</p>
          <Link to="/vacancies" className="inline-flex px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
            Qidiruvni boshlash
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
                  <div className="font-medium text-ink text-sm truncate">{s.name || describeSearch(s)}</div>
                  <div className="text-xs text-ink-3 mt-0.5 truncate">{describeSearch(s)}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {s.match_count > 0 ? `${s.match_count} ta yangi mos vakansiya topildi` : "Hozircha yangi moslik yo'q"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteSearch(s.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors flex-shrink-0"
                title="O'chirish"
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
