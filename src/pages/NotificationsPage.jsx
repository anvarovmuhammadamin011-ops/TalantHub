import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../lib/api";
import { timeAgo, formatDateTime } from "../lib/format";
import { getNotificationIcon, getNotificationColor } from "../lib/notificationTypes";
import { useT } from "../context/I18nContext";

export default function NotificationsPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = await api("/notifications");
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnread(0);
    try { await api("/notifications/read-all", { method: "PATCH" }); } catch {}
  };

  const openNotification = async (n) => {
    if (!n.read) {
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: 1 } : x));
      setUnread((prev) => Math.max(0, prev - 1));
      try { await api(`/notifications/${n.id}/read`, { method: "PATCH" }); } catch {}
    }
    if (n.link) navigate(n.link);
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{t("profile.notifications")}</h1>
          <p className="text-ink-3 text-sm mt-1">{unread > 0 ? t("pages.notificationsPage.unreadCount", { count: unread }) : t("pages.notificationsPage.allRead")}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm font-medium text-accent hover:underline">
            {t("pages.notificationsPage.markAllRead")}
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-surface border border-border mb-5">
            <Bell className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1.5">{t("pages.notificationsPage.empty")}</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const Icon = getNotificationIcon(n.type);
            const colorClass = getNotificationColor(n.type);
            const isUnread = !n.read;
            return (
              <button key={n.id} onClick={() => openNotification(n)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                  isUnread ? "bg-accent-soft/40 border-accent/10" : "bg-white border-border hover:bg-surface"
                }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isUnread ? "text-ink" : "text-ink-2"}`}>{n.title}</span>
                    {isUnread && <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />}
                  </div>
                  {n.description && <p className="text-xs text-ink-3 mt-0.5">{n.description}</p>}
                  <span className="text-[11px] text-ink-3 mt-1 block" title={formatDateTime(n.created_at + "Z")}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
