import { Outlet, Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import MobileNav from "./MobileNav";
import Navbar from "./Navbar";
import RoleSwitcher from "../ui/RoleSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import OnboardingWizard from "../ui/OnboardingWizard";
import InstallPrompt from "../ui/InstallPrompt";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";

export default function Layout() {
  const { user } = useAuth();
  const { t } = useT();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border bg-white/60 md:hidden">
        {user?.role === "employer" && (
          <Link to="/wallet" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border hover:text-ink">
            <Wallet className="w-3.5 h-3.5" /> {t("nav.wallet")}
          </Link>
        )}
        <RoleSwitcher />
        <LanguageSwitcher />
      </div>
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
      <OnboardingWizard />
      <InstallPrompt />
    </div>
  );
}
