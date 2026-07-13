import { Link, useLocation } from "react-router-dom";
import { Home, Briefcase, MessageSquare, User, Package, LayoutDashboard, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isEmployer = user?.role === "employer";

  const tabs = [
    { to: "/", label: "Bosh", icon: Home },
    { to: "/vacancies", label: "Vakansiyalar", icon: Briefcase },
    isEmployer
      ? { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
      : { to: "/applications", label: "Arizalar", icon: BarChart3 },
    { to: "/orders", label: "Zakazlar", icon: Package },
    { to: "/chat", label: "Xabarlar", icon: MessageSquare },
    { to: "/profile", label: "Profil", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-ink" : "text-ink-3"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
