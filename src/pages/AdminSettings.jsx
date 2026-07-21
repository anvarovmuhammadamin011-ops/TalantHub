import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { api } from "../lib/api";
import { useT } from "../context/I18nContext";

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-colors";
const labelClass = "block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5";
const cardClass = "bg-white rounded-xl border border-border shadow-sm p-6 mb-6";

const ROLE_LABELS = { moderator: "Moderator", support: "Support" };

export default function AdminSettings() {
  const { t } = useT();

  const SECTION_LABELS = {
    stats: t("nav.statistics"), users: t("admin.users"), vacancies: t("nav.vacancies"), orders: t("nav.orders"),
    applications: t("nav.applications"), reports: t("pages.adminSettings.sectionReports"), verification: t("admin.verification"),
    categories: t("admin.categories"), disputes: t("admin.disputes"), broadcast: t("admin.broadcast"),
    support_tickets: t("pages.adminSettings.sectionSupportTickets"), logs: t("admin.logs"), finance: t("admin.finance"),
    marketing: t("pages.adminSettings.sectionMarketing"), system: t("pages.adminSettings.sectionSystem"),
  };

  const SETTINGS_FIELDS = [
    { group: t("pages.adminSettings.groupGeneral"), fields: [
      { key: "commission_percent", label: t("pages.adminSettings.fieldCommissionLabel"), placeholder: "10" },
      { key: "site_tagline", label: t("pages.adminSettings.fieldTaglineLabel"), placeholder: t("pages.adminSettings.fieldTaglinePlaceholder") },
      { key: "site_description", label: t("pages.adminSettings.fieldSiteDescriptionLabel"), placeholder: t("pages.adminSettings.fieldSiteDescriptionPlaceholder"), textarea: true },
    ]},
    { group: t("pages.adminSettings.groupBanner"), fields: [
      { key: "banner_text", label: t("pages.adminSettings.fieldBannerTextLabel"), placeholder: t("pages.adminSettings.fieldBannerTextPlaceholder") },
      { key: "banner_link", label: t("pages.adminSettings.fieldBannerLinkLabel"), placeholder: "/wallet" },
      { key: "banner_active", label: t("pages.adminSettings.fieldBannerActiveLabel"), placeholder: "0" },
    ]},
    { group: t("pages.adminSettings.groupSeo"), fields: [
      { key: "seo_title", label: t("pages.adminSettings.fieldSeoTitleLabel"), placeholder: t("pages.adminSettings.fieldSeoTitlePlaceholder") },
      { key: "seo_description", label: t("pages.adminSettings.fieldSeoDescriptionLabel"), placeholder: t("pages.adminSettings.fieldSeoDescriptionPlaceholder"), textarea: true },
    ]},
    { group: t("pages.adminSettings.groupContact"), fields: [
      { key: "contact_email", label: t("pages.adminSettings.fieldContactEmailLabel"), placeholder: "info@talenthub.uz" },
      { key: "contact_phone", label: t("pages.adminSettings.fieldContactPhoneLabel"), placeholder: "+998 71 200 00 00" },
      { key: "contact_address", label: t("pages.adminSettings.fieldContactAddressLabel"), placeholder: t("pages.adminSettings.fieldContactAddressPlaceholder") },
    ]},
    { group: t("pages.adminSettings.groupModeration"), fields: [
      { key: "banned_words", label: t("pages.adminSettings.fieldBannedWordsLabel"), placeholder: t("pages.adminSettings.fieldBannedWordsPlaceholder"), textarea: true },
    ]},
  ];

  const [settings, setSettings] = useState({});
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedGroup, setSavedGroup] = useState("");
  const [savingTariffId, setSavingTariffId] = useState(null);
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState(null);
  const [savingSection, setSavingSection] = useState("");

  const load = async () => {
    setError("");
    try {
      const [settingsData, tariffsData] = await Promise.all([
        api("/admin/settings"),
        api("/admin/tariffs"),
      ]);
      setSettings(settingsData.settings);
      setTariffs(tariffsData.tariffs);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
    // Only super_admin can see/edit this — 403 for everyone else, so just hide the card.
    api("/admin/permissions").then((d) => setPermissions(d.permissions)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  const saveGroup = async (group) => {
    setSaving(true);
    try {
      for (const f of group.fields) {
        await api(`/admin/settings/${f.key}`, { method: "PATCH", body: { value: settings[f.key] || "" } });
      }
      setSavedGroup(group.group);
      setTimeout(() => setSavedGroup(""), 2000);
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const updateTariff = (id, field, value) => {
    setTariffs((prev) => prev.map((tf) => tf.id === id ? { ...tf, [field]: value } : tf));
  };

  const saveTariff = async (tariff) => {
    setSavingTariffId(tariff.id);
    try {
      await api(`/admin/tariffs/${tariff.id}`, {
        method: "PATCH",
        body: { name: tariff.name, price: Number(tariff.price), duration_days: Number(tariff.duration_days), active: !!tariff.active },
      });
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setSavingTariffId(null);
    }
  };

  const togglePermission = async (section, role) => {
    const currentRoles = (permissions[section] || []).filter((r) => r !== "super_admin");
    const nextRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
    setSavingSection(section);
    try {
      const { permissions: updated } = await api("/admin/permissions", { method: "PATCH", body: { section, roles: nextRoles } });
      setPermissions(updated);
    } catch (err) {
      alert(err.message || t("common.error"));
    } finally {
      setSavingSection("");
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">{t("common.retry")}</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">{t("admin.settings")}</h1>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.adminSettings.tariffsTitle")}</h2>
        <div className="space-y-4">
          {tariffs.map((tf) => (
            <div key={tf.id} className="border border-border-soft rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className={labelClass}>{t("pages.adminSettings.fieldName")}</label>
                  <input value={tf.name} onChange={(e) => updateTariff(tf.id, "name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("pages.adminSettings.fieldPrice")}</label>
                  <input type="number" value={tf.price} onChange={(e) => updateTariff(tf.id, "price", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("pages.adminSettings.fieldDuration")}</label>
                  <input type="number" value={tf.duration_days} onChange={(e) => updateTariff(tf.id, "duration_days", e.target.value)} className={inputClass} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-ink-2">
                    <input type="checkbox" checked={!!tf.active} onChange={(e) => updateTariff(tf.id, "active", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20" />
                    {t("status.Faol")}
                  </label>
                  <button onClick={() => saveTariff(tf)} disabled={savingTariffId === tf.id}
                    className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-60">
                    {savingTariffId === tf.id ? "..." : t("common.save")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {permissions && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-1">{t("pages.adminSettings.permissionsTitle")}</h2>
          <p className="text-xs text-ink-3 mb-4">{t("pages.adminSettings.permissionsSubtitle")}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide py-2">{t("pages.adminSettings.colSection")}</th>
                  <th className="text-center text-xs font-medium text-ink-3 uppercase tracking-wide py-2">{t("admin.roleModerator")}</th>
                  <th className="text-center text-xs font-medium text-ink-3 uppercase tracking-wide py-2">{t("admin.roleSupport")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {Object.keys(SECTION_LABELS).map((section) => (
                  <tr key={section}>
                    <td className="py-2 text-sm text-ink-2">{SECTION_LABELS[section]}</td>
                    {["moderator", "support"].map((role) => (
                      <td key={role} className="text-center py-2">
                        <input type="checkbox"
                          checked={(permissions[section] || []).includes(role)}
                          disabled={savingSection === section}
                          onChange={() => togglePermission(section, role)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {SETTINGS_FIELDS.map((group) => (
        <div key={group.group} className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">{group.group}</h2>
          <div className="space-y-4">
            {group.fields.map((f) => (
              <div key={f.key}>
                <label className={labelClass}>{f.label}</label>
                {f.textarea ? (
                  <textarea rows={3} value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder} className={inputClass + " resize-none"} />
                ) : (
                  <input value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder} className={inputClass} />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => saveGroup(group)} disabled={saving}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 mt-4">
            {savedGroup === group.group ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? t("pages.adminSettings.saving") : savedGroup === group.group ? t("pages.adminSettings.saved") : t("common.save")}
          </button>
        </div>
      ))}
    </div>
  );
}
