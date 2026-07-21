import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Briefcase, Users, MessageCircle, User, FileText, Bookmark, Shield, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useT } from "../../context/I18nContext";

// Bottom tab bar shown on mobile only (md:hidden). Desktop keeps the top Navbar.
export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications } = useSocket() || {};
  const { t } = useT();
  const isEmployer = user?.role === "employer";
  const isAdmin = user?.role === "admin";
  const unreadMessages = (notifications || []).filter((n) => n.type === "message" && !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = !user
    ? [
        { to: "/vacancies", label: t("nav.vacancies"), icon: Briefcase },
        { to: "/login", label: t("nav.login"), icon: LogIn },
      ]
    : isAdmin
    ? [
        { to: "/", label: t("nav.homeFull"), icon: Home },
        { to: "/admin", label: t("nav.adminPanel"), icon: Shield },
        { to: "/chat", label: t("nav.chat"), icon: MessageCircle, badge: unreadMessages },
        { action: handleLogout, label: t("nav.logout"), icon: LogOut },
      ]
    : isEmployer
    ? [
        { to: "/", label: t("nav.homeFull"), icon: Home },
        { to: "/dashboard", label: t("profile.myVacancies"), icon: Briefcase },
        { to: "/specialists", label: t("nav.specialists"), icon: Users },
        { to: "/chat", label: t("nav.chat"), icon: MessageCircle, badge: unreadMessages },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ]
    : [
        { to: "/", label: t("nav.jobs"), icon: Home },
        { to: "/applications", label: t("nav.myApplicationsShort"), icon: FileText },
        { to: "/saved", label: t("nav.savedShort"), icon: Bookmark },
        { to: "/chat", label: t("nav.chat"), icon: MessageCircle, badge: unreadMessages },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          if (tab.action) {
            return (
              <button
                key={tab.label}
                onClick={tab.action}
                className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-colors text-red-400 hover:text-red-600"
              >
                <tab.icon className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative min-w-11 min-h-11 flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-colors ${
                isActive ? "text-accent" : "text-ink-3"
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                {!!tab.badge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
