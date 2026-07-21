import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, GraduationCap, ClipboardList, Package, Building2, Users,
  BarChart3, Settings, LogOut, Menu, X, ClipboardCheck, LifeBuoy, Flag, Wallet, Tags, Megaphone, ScrollText, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";

function NavItem({ link, onNavigate }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          isActive ? "bg-accent text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <link.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      {link.label}
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "A";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const primaryLinks = [
    { to: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/admin/vacancies", label: t("nav.vacancies"), icon: Briefcase },
    { to: "/admin/specialists", label: t("nav.specialists"), icon: GraduationCap },
    { to: "/admin/applications", label: t("nav.applications"), icon: ClipboardList },
    { to: "/admin/orders", label: t("nav.orders"), icon: Package },
    { to: "/admin/companies", label: t("admin.companies"), icon: Building2 },
    { to: "/admin/users", label: t("admin.users"), icon: Users },
    { to: "/admin/stats", label: t("nav.statistics"), icon: BarChart3 },
  ];

  const secondaryLinks = [
    { to: "/admin/moderation", label: t("admin.moderation"), icon: ClipboardCheck },
    { to: "/admin/verification", label: t("admin.verification"), icon: BadgeCheck },
    { to: "/admin/support", label: t("admin.support"), icon: LifeBuoy },
    { to: "/admin/disputes", label: t("admin.disputes"), icon: Flag },
    { to: "/admin/finance", label: t("admin.finance"), icon: Wallet },
    { to: "/admin/categories", label: t("admin.categories"), icon: Tags },
    { to: "/admin/broadcast", label: t("admin.broadcast"), icon: Megaphone },
    { to: "/admin/logs", label: t("admin.logs"), icon: ScrollText },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-xs">TH</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">{t("admin.title")}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-0.5">
        {primaryLinks.map((l) => (
          <NavItem key={l.to} link={l} onNavigate={onNavigate} />
        ))}

        <div className="pt-3 mt-3 border-t border-white/10 space-y-0.5">
          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/35">{t("admin.otherSections")}</p>
          {secondaryLinks.map((l) => (
            <NavItem key={l.to} link={l} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="px-2.5 pb-2.5 space-y-0.5 border-t border-white/10 pt-2.5">
        <NavItem link={{ to: "/admin/settings", label: t("admin.settings"), icon: Settings }} onNavigate={onNavigate} />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
          {t("nav.logout")}
        </button>
      </div>

      <div className="px-4 py-3.5 border-t border-white/10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{user?.name || "Admin"}</p>
          <p className="text-xs text-white/45 truncate">
            {user?.admin_role === "moderator" ? t("admin.roleModerator") : user?.admin_role === "support" ? t("admin.roleSupport") : t("admin.roleAdministrator")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 bg-ink flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-ink flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-xs">TH</span>
          </div>
          <span className="text-sm font-semibold text-white">Admin</span>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-ink h-full flex flex-col">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:ml-64 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
