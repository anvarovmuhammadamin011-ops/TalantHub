import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Briefcase, Users, MessageSquare, BarChart3, User, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Notifications from "../ui/Notifications";

const navLinks = [
  { to: "/", label: "Bosh sahifa" },
  { to: "/vacancies", label: "Vakansiyalar", icon: Briefcase },
  { to: "/specialists", label: "Mutaxassislar", icon: Users },
  { to: "/ai-chat", label: "AI Chat", icon: Sparkles },
  { to: "/applications", label: "Arizalar", icon: BarChart3 },
  { to: "/chat", label: "Xabarlar", icon: MessageSquare },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "U";

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-xs">TH</span>
            </div>
            <span className="text-[15px] font-semibold text-ink tracking-tight">TalentHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.to ? "text-ink" : "text-ink-3 hover:text-ink"}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Notifications />
            <Link to="/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md hover:bg-surface transition-colors ml-1">
              <div className="w-7 h-7 bg-ink rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">{initials}</span>
              </div>
              <span className="text-sm font-medium text-ink">{user?.name?.split(" ")[0] || "Foydalanuvchi"}</span>
            </Link>
            <button onClick={handleLogout} className="w-9 h-9 rounded-md text-ink-2 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center ml-1" title="Chiqish">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>

          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-ink" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${location.pathname === link.to ? "bg-surface text-ink" : "text-ink-2 hover:bg-surface"}`}>
                  {Icon && <Icon className="w-[18px] h-[18px]" />}
                  {link.label}
                </Link>
              );
            })}
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-ink-2 hover:bg-surface">
              <User className="w-[18px] h-[18px]" /> Profil
            </Link>
            <button onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 w-full">
              <LogOut className="w-[18px] h-[18px]" /> Chiqish
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
