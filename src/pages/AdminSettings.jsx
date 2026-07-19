import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { api } from "../lib/api";

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-colors";
const labelClass = "block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5";
const cardClass = "bg-white rounded-xl border border-border shadow-sm p-6 mb-6";

const SECTION_LABELS = {
  stats: "Statistika", users: "Foydalanuvchilar", vacancies: "Vakansiyalar", orders: "Buyurtmalar",
  applications: "Arizalar", reports: "Shikoyatlar", verification: "Verifikatsiya", categories: "Kategoriyalar",
  broadcast: "Xabarnoma", support_tickets: "Qo'llab-quvvatlash", logs: "Loglar", finance: "Moliya",
  marketing: "Marketing", system: "Tizim",
};
const ROLE_LABELS = { moderator: "Moderator", support: "Support" };

const SETTINGS_FIELDS = [
  { group: "Umumiy", fields: [
    { key: "commission_percent", label: "Komissiya foizi (%)", placeholder: "10" },
    { key: "site_tagline", label: "Sayt shiori", placeholder: "IT va Ta'lim mutaxassislari uchun platforma" },
    { key: "site_description", label: "Sayt tavsifi", placeholder: "TalentHub haqida qisqacha...", textarea: true },
  ]},
  { group: "Banner / E'lon", fields: [
    { key: "banner_text", label: "Banner matni", placeholder: "Yangi tarif: TOP e'lon endi 20% arzon!" },
    { key: "banner_link", label: "Banner havolasi", placeholder: "/wallet" },
    { key: "banner_active", label: "Banner faolmi (1/0)", placeholder: "0" },
  ]},
  { group: "SEO", fields: [
    { key: "seo_title", label: "SEO sarlavha", placeholder: "TalentHub — IT va Ta'lim ish topish platformasi" },
    { key: "seo_description", label: "SEO tavsif", placeholder: "Meta description...", textarea: true },
  ]},
  { group: "Aloqa", fields: [
    { key: "contact_email", label: "Aloqa email", placeholder: "info@talenthub.uz" },
    { key: "contact_phone", label: "Aloqa telefon", placeholder: "+998 71 200 00 00" },
    { key: "contact_address", label: "Manzil", placeholder: "Toshkent, ..." },
  ]},
  { group: "Kontent moderatsiyasi", fields: [
    { key: "banned_words", label: "Taqiqlangan so'zlar (vergul bilan ajrating)", placeholder: "so'z1, so'z2, so'z3", textarea: true },
  ]},
];

export default function AdminSettings() {
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
      setError(err.message || "Xatolik yuz berdi");
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
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const updateTariff = (id, field, value) => {
    setTariffs((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const saveTariff = async (tariff) => {
    setSavingTariffId(tariff.id);
    try {
      await api(`/admin/tariffs/${tariff.id}`, {
        method: "PATCH",
        body: { name: tariff.name, price: Number(tariff.price), duration_days: Number(tariff.duration_days), active: !!tariff.active },
      });
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
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
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setSavingSection("");
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-danger-soft text-danger text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        <div><button onClick={load} className="text-sm font-medium text-accent hover:underline">Qayta urinish</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-6">Sozlamalar</h1>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">Tariflar</h2>
        <div className="space-y-4">
          {tariffs.map((t) => (
            <div key={t.id} className="border border-border-soft rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className={labelClass}>Nomi</label>
                  <input value={t.name} onChange={(e) => updateTariff(t.id, "name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Narx (so'm)</label>
                  <input type="number" value={t.price} onChange={(e) => updateTariff(t.id, "price", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Muddat (kun)</label>
                  <input type="number" value={t.duration_days} onChange={(e) => updateTariff(t.id, "duration_days", e.target.value)} className={inputClass} />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-ink-2">
                    <input type="checkbox" checked={!!t.active} onChange={(e) => updateTariff(t.id, "active", e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20" />
                    Faol
                  </label>
                  <button onClick={() => saveTariff(t)} disabled={savingTariffId === t.id}
                    className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-60">
                    {savingTariffId === t.id ? "..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {permissions && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-1">Ruxsatlar (RBAC)</h2>
          <p className="text-xs text-ink-3 mb-4">Super Admin har doim to'liq huquqqa ega. Moderator va Support uchun bo'limlarni belgilang.</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="text-left text-xs font-medium text-ink-3 uppercase tracking-wide py-2">Bo'lim</th>
                  <th className="text-center text-xs font-medium text-ink-3 uppercase tracking-wide py-2">Moderator</th>
                  <th className="text-center text-xs font-medium text-ink-3 uppercase tracking-wide py-2">Support</th>
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
            {saving ? "Saqlanmoqda..." : savedGroup === group.group ? "Saqlandi" : "Saqlash"}
          </button>
        </div>
      ))}
    </div>
  );
}
