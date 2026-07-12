import { useState } from "react";
import { Bell, X, CheckCircle, Clock, MessageSquare, UserPlus, Star } from "lucide-react";

const mockNotifications = [
  { id: 1, type: "application", title: "Arizangiz ko'rildi", desc: "TexnoLabs kompaniyasi arizangizni ko'rib chiqdi", time: "5 daqiqa oldin", read: false, icon: Eye2, color: "text-primary" },
  { id: 2, type: "interview", title: "Intervyu taklifi", desc: "CloudUZ sizni intervyuga taklif qiladi", time: "1 soat oldin", read: false, icon: Clock, color: "text-amber-600" },
  { id: 3, type: "message", title: "Yangi xabar", desc: "TexnoLabs sizga xabar yubordi", time: "3 soat oldin", read: true, icon: MessageSquare, color: "text-accent" },
  { id: 4, type: "profile", title: "Profil yangilandi", desc: "Profilingiz 80% to'ldirildi", time: "Kecha", read: true, icon: UserPlus, color: "text-purple-600" },
  { id: 5, type: "rating", title: "Reyting yangilandi", desc: "Sizning reytingingiz 4.8 ga oshdi", time: "2 kun oldin", read: true, icon: Star, color: "text-ink" },
];

function Eye2(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
}

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(mockNotifications);
  const unread = notifs.filter((n) => !n.read).length;

  const markRead = (id) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-9 h-9 rounded-md text-ink-2 hover:bg-surface hover:text-ink transition-colors relative flex items-center justify-center">
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-ink text-sm">Bildirishnomalar</h3>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-ink-3 hover:text-ink transition-colors">Barchasini o'qilgan deb belgilash</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.map((n) => (
                <button key={n.id} onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? "bg-surface" : "bg-primary/10"}`}>
                    <n.icon className={`w-4 h-4 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${n.read ? "text-ink-2" : "text-ink"}`}>{n.title}</span>
                      {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-ink-3 mt-0.5 truncate">{n.desc}</p>
                    <span className="text-[10px] text-ink-3 mt-1 block">{n.time}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <button className="text-xs font-medium text-ink-2 hover:text-ink transition-colors">Barchasini ko'rish</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
