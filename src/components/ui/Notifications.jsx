import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../../lib/api";
import { useSocket } from "../../context/SocketContext";
import { getNotificationIcon, getNotificationColor } from "../../lib/notificationTypes";
import { timeAgo } from "../../lib/format";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const { notifications: liveNotifs, unreadCount: liveUnread, setNotifications, setUnreadCount } = useSocket();

  useEffect(() => {
    loadNotifs();
  }, []);

  useEffect(() => {
    if (liveNotifs.length > 0) {
      setNotifs((prev) => {
        const merged = [...liveNotifs.filter((ln) => !prev.some((p) => p.id === ln.id)), ...prev];
        return merged.slice(0, 50);
      });
      setUnread(liveUnread);
    }
  }, [liveNotifs, liveUnread]);

  const loadNotifs = async () => {
    try {
      const data = await api("/notifications");
      setNotifs(data.notifications);
      setUnread(data.unread);
      setUnreadCount(data.unread);
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: 1 } : n));
    setUnread((prev) => Math.max(0, prev - 1));
    try { await api(`/notifications/${id}/read`, { method: "PATCH" }); } catch {}
  };

  const markAll = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: 1 })));
    setUnread(0);
    setUnreadCount(0);
    try { await api("/notifications/read-all", { method: "PATCH" }); } catch {}
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-md text-ink-2 hover:bg-surface hover:text-ink transition-colors relative flex items-center justify-center">
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-ink text-sm">Bildirishnomalar</h3>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-ink-3 hover:text-ink transition-colors">
                  Barchasini o'qilgan deb belgilash
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 && (
                <div className="p-6 text-center text-sm text-ink-3">Bildirishnomalar yo'q</div>
              )}
              {notifs.map((n) => {
                const Icon = getNotificationIcon(n.type);
                const colorClass = getNotificationColor(n.type);
                const isUnread = !n.read;
                return (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface transition-colors ${isUnread ? "bg-primary/5" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isUnread ? "text-ink" : "text-ink-2"}`}>{n.title}</span>
                        {isUnread && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-ink-3 mt-0.5 truncate">{n.description}</p>
                      <span className="text-[10px] text-ink-3 mt-1 block">{timeAgo(n.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">
                Barchasini ko'rish
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
