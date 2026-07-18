import { useState } from "react";
import { Briefcase, User, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";

const ROLE_ICON = { specialist: User, employer: Briefcase };

export default function RoleSwitcher() {
  const { user, unlockRole, switchRole } = useAuth();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  if (!user || user.role === "admin") return null;

  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
  const otherRole = user.role === "employer" ? "specialist" : "employer";
  const hasOtherRole = roles.includes(otherRole);

  const handleSwitch = async () => {
    setBusy(true);
    await switchRole(otherRole);
    setBusy(false);
  };

  const handleUnlock = async () => {
    setBusy(true);
    await unlockRole(otherRole);
    await switchRole(otherRole);
    setBusy(false);
  };

  const OtherIcon = ROLE_ICON[otherRole];
  const otherRoleLabel = t(`role.${otherRole}`);

  if (!hasOtherRole) {
    return (
      <button
        onClick={handleUnlock}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border hover:text-ink disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        {t("role.unlock", { role: otherRoleLabel })}
      </button>
    );
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-soft text-accent border border-accent/10 hover:opacity-80 disabled:opacity-50"
    >
      <OtherIcon className="w-3.5 h-3.5" strokeWidth={2} />
      {t("role.switchTo", { role: otherRoleLabel })}
    </button>
  );
}
