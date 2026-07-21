import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useT } from "../context/I18nContext";

// Notification toggle page, reached from the profile menu ("Bildirishnomalar sozlamalari").
export default function NotificationSettings() {
  const { t } = useT();
  const { user, updateProfile } = useAuth();
  const [prefs, setPrefs] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs({ new_application: true, vacancy_status: true, messages: true, ...(user?.notification_prefs || {}) });
  }, [user]);

  const save = async () => {
    setSaving(true);
    const result = await updateProfile({ notification_prefs: prefs });
    setSaving(false);
    if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  if (!user) return null;

  const options = user.role === "employer"
    ? [["new_application", t("pages.notificationSettings.newApplication")], ["vacancy_status", t("pages.notificationSettings.vacancyStatusChanged")], ["messages", t("pages.notificationSettings.newMessage")]]
    : [["vacancy_status", t("pages.notificationSettings.applicationStatusChanged")], ["messages", t("pages.notificationSettings.newMessage")]];

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-4 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav.profile")}
      </Link>
      <h1 className="text-xl font-semibold text-ink mb-4">{t("profile.notifications")}</h1>
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="space-y-3">
          {options.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
              <span className="text-sm text-ink-2">{label}</span>
              <input type="checkbox" checked={!!prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20" />
            </label>
          ))}
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 mt-4 min-h-11">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? t("pages.notificationSettings.saving") : saved ? t("pages.notificationSettings.saved") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
