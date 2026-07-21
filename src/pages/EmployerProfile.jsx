import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, Edit3, Briefcase, Users, Wallet, Bell,
  Globe, MessageSquare, LifeBuoy, ShieldCheck, ScrollText, Trash2, LogOut, ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../context/I18nContext";
import { locales } from "../i18n";
import ProfileMenuGroup from "../components/ui/ProfileMenuGroup";
import ProfileMenuItem from "../components/ui/ProfileMenuItem";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DeleteAccountDialog from "../components/ui/DeleteAccountDialog";
import LanguagePickerSheet from "../components/ui/LanguagePickerSheet";

// Cloz.uz-style menu-list profile hub for the employer role. Actual field editing
// lives on /profile/edit — this page is pure navigation + a few inline toggles.
export default function EmployerProfile() {
  const { user, logout, switchRole, unlockRole } = useAuth();
  const { locale, t } = useT();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const currentLocale = locales.find((l) => l.code === locale);
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
  const hasSpecialistRole = roles.includes("specialist");

  const switchToSpecialist = async () => {
    if (hasSpecialistRole) await switchRole("specialist");
    else { await unlockRole("specialist"); await switchRole("specialist"); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-4 pb-10">
      <h1 className="text-xl font-semibold text-ink px-1">{t("profile.myProfile")}</h1>

      <Link to="/profile/edit" className="block bg-white rounded-xl border border-border p-4 hover:border-ink/20 transition-colors">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-semibold">{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink truncate">{user.company_name || user.name}</div>
            <div className="text-sm text-ink-3 truncate">{user.email}</div>
            <div className="text-xs text-ink-3 mt-0.5">{t("role.employer")}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-3 flex-shrink-0" />
        </div>
      </Link>

      <ProfileMenuGroup>
        <ProfileMenuItem icon={ArrowLeftRight} label={t("profile.switchToSpecialist")} onClick={switchToSpecialist} />
      </ProfileMenuGroup>

      <ProfileMenuGroup>
        <ProfileMenuItem icon={Edit3} label={t("profile.editProfile")} to="/profile/edit" />
        <ProfileMenuItem icon={Briefcase} label={t("profile.myVacancies")} to="/dashboard" />
        <ProfileMenuItem icon={Users} label={t("profile.specialists")} to="/specialists" />
        <ProfileMenuItem icon={Wallet} label={t("nav.wallet")} to="/wallet" />
        <ProfileMenuItem icon={Bell} label={t("profile.notificationSettings")} to="/profile/notifications" />
        <ProfileMenuItem
          icon={Globe}
          label={t("profile.changeLanguage")}
          onClick={() => setShowLanguageSheet(true)}
          right={<span className="text-sm font-medium text-ink-2">{currentLocale?.code.toUpperCase()}</span>}
        />
      </ProfileMenuGroup>

      <ProfileMenuGroup>
        <ProfileMenuItem icon={MessageSquare} label={t("profile.feedback")} to="/support" />
        <ProfileMenuItem icon={LifeBuoy} label={t("profile.contactUs")} to="/support" />
        <ProfileMenuItem icon={ShieldCheck} label={t("profile.privacyPolicy")} to="/privacy" />
        <ProfileMenuItem icon={ScrollText} label={t("profile.termsOfService")} to="/terms" />
      </ProfileMenuGroup>

      <ProfileMenuGroup>
        <ProfileMenuItem icon={Trash2} label={t("profile.deleteAccount")} onClick={() => setShowDeleteDialog(true)} />
        <ProfileMenuItem icon={LogOut} label={t("nav.logout")} danger onClick={() => setShowLogoutConfirm(true)} />
      </ProfileMenuGroup>

      <LanguagePickerSheet open={showLanguageSheet} onClose={() => setShowLanguageSheet(false)} />
      <ConfirmDialog
        open={showLogoutConfirm}
        title={t("profile.confirmLogoutTitle")}
        description={t("profile.confirmLogoutDescription")}
        confirmLabel={t("nav.logout")}
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <DeleteAccountDialog open={showDeleteDialog} onCancel={() => setShowDeleteDialog(false)} />
    </div>
  );
}
