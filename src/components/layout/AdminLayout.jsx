import { Outlet, NavLink } from "react-router-dom";
import { ClipboardCheck, Users, BarChart3, LayoutGrid } from "lucide-react";

const links = [
  { to: "/admin/moderation", label: "Moderatsiya", icon: ClipboardCheck },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { to: "/admin/stats", label: "Statistika", icon: BarChart3 },
  { to: "/admin", label: "Boshqa bo'limlar", icon: LayoutGrid, end: true },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-white">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-xs">TH</span>
            </div>
            <span className="text-sm font-semibold text-ink">Admin panel</span>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 px-2 pb-3 overflow-x-auto md:overflow-visible">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-surface"
              }`}>
              <l.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
