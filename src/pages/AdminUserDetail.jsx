import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Shield, Star, Globe, Monitor, Flag, ClipboardCheck, Briefcase, Package, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, formatDate } from "../lib/format";
import StatusBadge from "../components/ui/StatusBadge";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import EmptyState from "../components/ui/EmptyState";
import { useT } from "../context/I18nContext";

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
  const { t } = useT();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const roleLabels = { specialist: t("role.specialist"), employer: t("role.employer"), admin: t("admin.roleAdmin") };

  const load = useCallback(() => {
    setLoading(true);
    api(`/admin/users/${id}/detail`)
      .then(setData)
      .catch((err) => setError(err.message || t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  if (error || !data) return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><EmptyState icon="⚠️" title={t("pages.adminUserDetail.notFoundTitle")} description={error || t("pages.adminUserDetail.notFoundDescription")} /></div>;

  const { user, applications, orders, vacancies, reportsFiled, reportsReceived, verification, lastLogin, loginHistory, transactions, balance } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("pages.adminUserDetail.backToAdmin")}
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
                {!!user.blocked && <span className="text-[11px] text-red-500 font-medium px-2 py-0.5 rounded-full bg-red-50">{t("pages.adminUsers.blocked")}{user.blocked_reason ? `: ${user.blocked_reason}` : ""}</span>}
              </div>
              <p className="text-sm text-ink-3">{user.email} · {user.phone || t("pages.adminUserDetail.noPhone")} · {user.city || "—"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink-2">{roleLabels[user.role] || user.role}</span>
                {user.role === "admin" && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{user.admin_role || "super_admin"}</span>}
                <span className="flex items-center gap-1 text-xs text-ink-3"><Star className="w-3 h-3 fill-ink text-ink" /> {user.rating} ({user.reviews_count})</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-ink-3 space-y-1">
            <div>{t("pages.adminUserDetail.registeredLabel")}: {user.created_at ? formatDate(user.created_at + "Z") : "—"}</div>
            <div>{t("pages.adminUserDetail.lastLoginLabel")}: {lastLogin ? timeAgo(lastLogin.created_at) : "—"}</div>
            {lastLogin?.ip && <div className="flex items-center gap-1 justify-end"><Globe className="w-3 h-3" /> {lastLogin.ip}</div>}
            <div className="font-semibold text-ink text-sm pt-1">{balance.toLocaleString("ru-RU")} so'm</div>
          </div>
        </div>
        {user.bio && <p className="text-sm text-ink-2 mt-4 border-t border-border pt-4">{user.bio}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.role === "specialist" && (
          <Section title={t("nav.applications")} icon={ClipboardCheck} count={applications.length}>
            {applications.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noApplications")}</p> : (
              <div className="space-y-2">
                {applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                    <Link to={`/admin/vacancies/${a.vacancy_id}`} className="text-ink-2 hover:underline truncate">{a.vacancy_title}</Link>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {user.role === "employer" && (
          <Section title={t("nav.vacancies")} icon={Briefcase} count={vacancies.length}>
            {vacancies.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noVacancies")}</p> : (
              <div className="space-y-2">
                {vacancies.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                    <Link to={`/admin/vacancies/${v.id}`} className="text-ink-2 hover:underline truncate">{v.title}</Link>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Faol" ? "bg-emerald-50 text-emerald-600" : v.status === "Kutilmoqda" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{t(`status.${v.status}`)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        <Section title={t("nav.orders")} icon={Package} count={orders.length}>
          {orders.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noOrders")}</p> : (
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

        <Section title={t("pages.adminUserDetail.verificationHistory")} icon={Shield} count={verification.length}>
          {verification.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noRequests")}</p> : (
            <div className="space-y-2">
              {verification.map((v) => (
                <div key={v.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">{v.type === "specialist" ? t("pages.adminUserDetail.diplomaCert") : t("pages.adminUserDetail.taxId")}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${v.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : v.status === "Rad etildi" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{t(`status.${v.status}`)}</span>
                  </div>
                  {v.reject_reason && <p className="text-xs text-red-500 mt-0.5">{v.reject_reason}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("pages.adminUserDetail.reportsReceivedTitle")} icon={Flag} count={reportsReceived.length}>
          {reportsReceived.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noReports")}</p> : (
            <div className="space-y-2">
              {reportsReceived.map((f) => (
                <div key={f.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2 truncate">{f.reason || t("pages.adminUserDetail.noReasonGiven")}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${f.status === "Tasdiqlangan" ? "bg-emerald-50 text-emerald-600" : f.status === "Rad etilgan" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{t(`status.${f.status}`)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("pages.adminUserDetail.reportsFiledTitle")} icon={Flag} count={reportsFiled.length}>
          {reportsFiled.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noReports")}</p> : (
            <div className="space-y-2">
              {reportsFiled.map((f) => (
                <div key={f.id} className="text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <span className="text-ink-2">{f.target_type} #{f.target_id} — {f.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("pages.adminUserDetail.paymentsTitle")} icon={Wallet} count={transactions.length}>
          {transactions.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noTransactions")}</p> : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-ink-2 truncate">{tx.description || tx.type}</div>
                    <div className="text-[10px] text-ink-3">{tx.method} · {timeAgo(tx.created_at)}</div>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ml-2 ${tx.amount < 0 ? "text-danger" : "text-success"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru-RU")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title={t("pages.adminUserDetail.loginHistoryTitle")} icon={Monitor} count={loginHistory.length}>
          {loginHistory.length === 0 ? <p className="text-xs text-ink-3">{t("pages.adminUserDetail.noLoginRecords")}</p> : (
            <div className="space-y-2">
              {loginHistory.map((l, i) => (
                <div key={i} className="text-xs text-ink-3 border-b border-border-soft pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span>{l.ip || t("pages.adminUserDetail.unknownIp")}</span>
                    <span>{timeAgo(l.created_at)}</span>
                  </div>
                  <div className="truncate text-ink-3/80">{l.user_agent || t("pages.adminUserDetail.unknownDevice")}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
