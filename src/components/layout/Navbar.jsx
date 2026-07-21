import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Users, MessageSquare, BarChart3, LogOut, Package, LayoutDashboard, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";
import Notifications from "../ui/Notifications";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useT();
  const isEmployer = user?.role === "employer";
  const isAdmin = user?.role === "admin";

  const navLinks = !user
    ? [{ to: "/vacancies", label: t("nav.vacancies"), icon: Briefcase }]
    : isAdmin
    ? [{ to: "/admin", label: t("nav.adminPanel"), icon: Shield }]
    : [
        { to: "/vacancies", label: t("nav.vacancies"), icon: Briefcase },
        { to: "/specialists", label: t("nav.specialists"), icon: Users },
        ...(isEmployer
          ? [{ to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard }]
          : [
              { to: "/applications", label: t("nav.applications"), icon: BarChart3 },
              { to: "/statistics", label: t("nav.statistics"), icon: TrendingUp },
            ]),
        { to: "/orders", label: t("nav.orders"), icon: Package },
        { to: "/chat", label: t("nav.chat"), icon: MessageSquare },
      ];

  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U";

  return (
    <nav className="hidden md:block bg-white/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-xs">TH</span>
            </div>
            <span className="text-[15px] font-semibold text-ink tracking-tight">TalentHub</span>
          </Link>

          <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`px-2.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${location.pathname === link.to ? "text-ink" : "text-ink-3 hover:text-ink"}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {user ? (
              <>
                <Notifications />
                <Link to="/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-surface transition-colors ml-1">
                  <div className="w-7 h-7 bg-ink rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-semibold">{initials}</span>
                  </div>
                  <span className="text-sm font-medium text-ink whitespace-nowrap">{user?.name?.split(" ")[0] || "Foydalanuvchi"}</span>
                </Link>
                <button onClick={handleLogout} className="w-9 h-9 rounded-md text-ink-2 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center ml-1" title={t("nav.logout")}>
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-2 hover:text-ink transition-colors">
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-md text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
