import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Star, Globe, Monitor, Flag, ClipboardCheck, Briefcase, Package } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import EmptyState from "../components/ui/EmptyState";

const roleLabels = { specialist: "Mutaxassis", employer: "Ish beruvchi", admin: "Admin" };

function Section({ title, icon: Icon, children, count }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-ink-3" />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {count !== undefined && <span className="text-xs text-ink-3">({count})</span>}
      </div>
      {children}
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api(`/admin/users/${id}/detail`)
      .then(setData)
      .catch((err) => setError(err.message || "Xatolik yuz berdi"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  if (error || !data) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><EmptyState icon="⚠️" title="Topilmadi" description={error || "Foydalanuvchi topilmadi"} /></div>;

  const { user, applications, orders, vacancies, reportsFiled, reportsReceived, verification, lastLogin, loginHistory } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Admin panelga qaytish
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-lg font-semibold text-ink-2 flex-shrink-0">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink">{user.name}</h1>
                {!!user.verified && <VerifiedBadge size="sm" />}
                {!!user.blocked && <span className="text-[11px] text-red-500 font-medium px-2 py-0.5 rounded-full bg-red-50">Bloklangan{user.blocked_reason ? `: ${user.blocked_reason}` : ""}</span>}
              </div>
              <p className="text-sm text-ink-3">{user.email} · {user.phone || "telefon yo'q"} · {user.city || "—"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{roleLabels[user.role] || user.role}</span>
                {user.role === "admin" && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{user.admin_role || "super_admin"}</span>}
                <span className="flex items-center gap-1 text-xs text-ink-3"><Star className="w-3 h-3 fill-ink text-ink" /> {user.rating} ({user.reviews_count})</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-ink-3 space-y-1">
            <div>Ro'yxatdan o'tgan: {user.created_at ? new Date(user.created_at + "Z").toLocaleDateString("uz-UZ") : "—"}</div>
            <div>Oxirgi kirish: {lastLogin ? timeAgo(lastLogin.created_at) : "—"}</div>
            {lastLogin?.ip && <div className="flex items-center gap-1 justify-end"><Globe className="w-3 h-3" /> {lastLogin.ip}</div>}
          </div>
        </div>
        {user.bio && <p className="text-sm text-ink-2 mt-4 border-t border-border pt-4">{user.bio}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.role === "specialist" && (
          <Section title="Arizalar" icon={ClipboardCheck} count={applications.length}>
            {applications.length === 0 ? <p className="text-xs text-ink-3">Arizalar yo'q</p> : (
              <div className="space-y-2">
                {applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                    <span className="text-ink-2 truncate">{a.vacancy_title}</span>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {user.role === "employer" && (
          <Section title="Vakansiyalar" icon={Briefcase} count={vacancies.length}>
            {vacancies.length === 0 ? <p className="text-xs text-ink-3">Vakansiyalar yo'q</p> : (
              <div className="space-y-2">
                {vacancies.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                    <span className="text-ink-2 truncate">{v.title}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Faol" ? "bg-emerald-50 text-emerald-600" : v.status === "Kutilmoqda" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{v.status}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        <Section title="Buyurtmalar" icon={Package} count={orders.length}>
          {orders.length === 0 ? <p className="text-xs text-ink-3">Buyurtmalar yo'q</p> : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <span className="text-ink-2 truncate">{o.title}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Verifikatsiya tarixi" icon={Shield} count={verification.length}>
          {verification.length === 0 ? <p className="text-xs text-ink-3">So'rovlar yo'q</p> : (
            <div className="space-y-2">
              {verification.map((v) => (
                <div key={v.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">{v.type === "specialist" ? "Diplom/sertifikat" : "STIR"}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : v.status === "Rad etildi" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{v.status}</span>
                  </div>
                  {v.reject_reason && <p className="text-xs text-red-500 mt-0.5">{v.reject_reason}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Shikoyatlar (qabul qilingan)" icon={Flag} count={reportsReceived.length}>
          {reportsReceived.length === 0 ? <p className="text-xs text-ink-3">Shikoyatlar yo'q</p> : (
            <div className="space-y-2">
              {reportsReceived.map((f) => (
                <div key={f.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2 truncate">{f.reason || "Sabab ko'rsatilmagan"}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : f.status === "Rad etilgan" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Shikoyatlar (yozgan)" icon={Flag} count={reportsFiled.length}>
          {reportsFiled.length === 0 ? <p className="text-xs text-ink-3">Shikoyatlar yo'q</p> : (
            <div className="space-y-2">
              {reportsFiled.map((f) => (
                <div key={f.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <span className="text-ink-2">{f.target_type} #{f.target_id} — {f.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Kirish tarixi" icon={Monitor} count={loginHistory.length}>
          {loginHistory.length === 0 ? <p className="text-xs text-ink-3">Kirishlar qayd etilmagan</p> : (
            <div className="space-y-2">
              {loginHistory.map((l, i) => (
                <div key={i} className="text-xs text-ink-3 border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span>{l.ip || "IP noma'lum"}</span>
                    <span>{timeAgo(l.created_at)}</span>
                  </div>
                  <div className="truncate text-ink-3/80">{l.user_agent || "Qurilma noma'lum"}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
