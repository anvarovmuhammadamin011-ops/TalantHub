import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Briefcase, Users, Package, Save, Lock, Mail, Phone, Calendar, ArrowRight, Check } from "lucide-react";
import { api } from "../lib/api";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import VerificationPanel from "../components/ui/VerificationPanel";
import ImageUploadField from "../components/ui/ImageUploadField";
import { useAuth } from "../context/AuthContext";
import { useT } from "../context/I18nContext";

const industries = [
  "IT / Dasturiy ta'minot", "Ta'lim", "Moliya / Bank", "Sog'liqni saqlash",
  "Savdo / Chakana savdo", "Ishlab chiqarish", "Qurilish", "Logistika / Transport",
  "Turizm / Mehmonxona", "Media / Reklama", "Boshqa",
];
const employeeCounts = ["1-10", "11-50", "51-200", "200+"];

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-colors";
const labelClass = "block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5";

const TABS = ["Profil", "Kompaniya", "Xavfsizlik"];
const TAB_LABEL_KEYS = { Profil: "pages.editCompanyProfile.tabProfile", Kompaniya: "pages.editCompanyProfile.tabCompany", Xavfsizlik: "pages.editCompanyProfile.tabSecurity" };

// Employer profile editor, reached from the profile menu ("Profilni tahrirlash").
export default function EditCompanyProfile() {
  const { t } = useT();
  const { user, updateProfile, changePassword } = useAuth();
  const [tab, setTab] = useState("Profil");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedTab, setSavedTab] = useState("");
  const [profileForm, setProfileForm] = useState({});
  const [companyForm, setCompanyForm] = useState({});
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const cooldownHours = 24;
  const lastEdit = user?.profile_updated_at ? new Date(user.profile_updated_at + "Z").getTime() : null;
  const cooldownActive = lastEdit && (Date.now() - lastEdit) < cooldownHours * 60 * 60 * 1000;
  const cooldownRemaining = cooldownActive
    ? Math.ceil((cooldownHours * 60 * 60 * 1000 - (Date.now() - lastEdit)) / 60000)
    : 0;

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || "", phone: user.phone || "", city: user.city || "", avatar: user.avatar || "" });
    setCompanyForm({
      company_name: user.company_name || "", company_logo: user.company_logo || "",
      industry: user.industry || "", employee_count: user.employee_count || "",
      company_description: user.company_description || user.bio || "", website: user.website || "",
      social_telegram: user.social_telegram || "", social_linkedin: user.social_linkedin || "",
      social_instagram: user.social_instagram || "", address: user.address || "",
    });
  }, [user]);

  useEffect(() => {
    async function load() {
      try {
        const [vacData, appData, orderData] = await Promise.all([
          api("/vacancies/mine"),
          api("/applications/employer"),
          api("/orders"),
        ]);
        setVacancies(vacData.vacancies || []);
        setApplications(appData.applications || []);
        setOrders(orderData.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    const result = await updateProfile(profileForm);
    setSaving(false);
    if (result.success) { setSavedTab("Profil"); setTimeout(() => setSavedTab(""), 2500); }
    else setSaveError(result.error);
  };

  const saveCompany = async () => {
    setSaving(true);
    setSaveError("");
    const result = await updateProfile(companyForm);
    setSaving(false);
    if (result.success) { setSavedTab("Kompaniya"); setTimeout(() => setSavedTab(""), 2500); }
    else setSaveError(result.error);
  };

  const submitPasswordChange = async () => {
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError(t("pages.editCompanyProfile.passwordMinLength"));
      return;
    }
    setPasswordSaving(true);
    const result = await changePassword(oldPassword, newPassword);
    setPasswordSaving(false);
    if (result.success) {
      setOldPassword(""); setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } else {
      setPasswordError(result.error);
    }
  };

  const activeVacancies = vacancies.filter((v) => (v.status || "Faol") === "Faol");
  const completedOrders = orders.filter((o) => o.status === "Tugatildi");

  const statsCards = [
    { label: t("nav.vacancies"), value: vacancies.length, icon: Briefcase },
    { label: t("pages.editCompanyProfile.incomingApplications"), value: applications.length, icon: Users },
    { label: t("nav.orders"), value: orders.length, icon: Package },
    { label: t("pages.editCompanyProfile.completed"), value: completedOrders.length, icon: Package },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-4 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav.profile")}
      </Link>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-20 sm:h-32 bg-gradient-to-r from-ink via-ink/80 to-ink/60 relative" />
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
          <div className="absolute -top-8 sm:-top-10 left-4 sm:left-6">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ink rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-white text-lg sm:text-xl font-bold">{initials}</span>
              </div>
            )}
          </div>
          <div className="pt-10 sm:pt-14">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">{user.company_name || user.name}</h1>
                  {!!user.verified && <VerifiedBadge />}
                </div>
                <p className="text-ink-2 font-medium mt-0.5 text-xs sm:text-sm flex items-center gap-2">
                  {t("role.employer")}
                  <Link to={`/companies/${user.id}`} className="text-accent text-xs font-medium hover:underline">{t("pages.editCompanyProfile.viewPublicProfile")}</Link>
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-xs sm:text-sm text-ink-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {user.city || t("pages.editCompanyProfile.notSpecified")}</span>
                  {user.created_at && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("pages.editCompanyProfile.memberSince", { year: new Date(user.created_at).getFullYear() })}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-ink-3"><Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {user.email}</span>
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-ink-3"><Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {user.phone || "+998 XX XXX XX XX"}</span>
                </div>
              </div>
            </div>
            {cooldownActive && (
              <p className="text-[10px] sm:text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {t("pages.editCompanyProfile.cooldownMessage", { hours: Math.floor(cooldownRemaining / 60), minutes: cooldownRemaining % 60 })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex gap-1 mb-5 border-b border-border-soft -mx-5 px-5">
              {TABS.map((tabKey) => (
                <button key={tabKey} onClick={() => setTab(tabKey)}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === tabKey ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"
                  }`}>{t(TAB_LABEL_KEYS[tabKey])}</button>
              ))}
            </div>

            {saveError && <p className="text-xs text-red-500 mb-3">{saveError}</p>}

            {tab === "Profil" && (
              <fieldset disabled={cooldownActive} className="space-y-4 disabled:opacity-60">
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.avatarLabel")}</label>
                  <ImageUploadField value={profileForm.avatar} onChange={(url) => setProfileForm({ ...profileForm, avatar: url })} shape="round" size="w-16 h-16" />
                </div>
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.nameLabel")}</label>
                  <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("auth.email")}</label>
                  <input value={user.email} disabled className={inputClass + " bg-surface text-ink-3 cursor-not-allowed"} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.phoneLabel")}</label>
                    <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.cityLabel")}</label>
                    <input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60">
                  {savedTab === "Profil" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? t("pages.editCompanyProfile.saving") : savedTab === "Profil" ? t("pages.editCompanyProfile.saved") : t("common.save")}
                </button>
              </fieldset>
            )}

            {tab === "Kompaniya" && (
              <fieldset disabled={cooldownActive} className="space-y-4 disabled:opacity-60">
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.logoLabel")}</label>
                  <ImageUploadField value={companyForm.company_logo} onChange={(url) => setCompanyForm({ ...companyForm, company_logo: url })} />
                </div>
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.companyNameLabel")}</label>
                  <input value={companyForm.company_name} onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.industryLabel")}</label>
                    <select value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} className={inputClass + " bg-white"}>
                      <option value="">{t("pages.editCompanyProfile.selectPlaceholder")}</option>
                      {industries.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.employeeCountLabel")}</label>
                    <select value={companyForm.employee_count} onChange={(e) => setCompanyForm({ ...companyForm, employee_count: e.target.value })} className={inputClass + " bg-white"}>
                      <option value="">{t("pages.editCompanyProfile.selectPlaceholder")}</option>
                      {employeeCounts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.aboutCompanyLabel")}</label>
                  <textarea rows={4} value={companyForm.company_description} onChange={(e) => setCompanyForm({ ...companyForm, company_description: e.target.value })}
                    placeholder={t("pages.editCompanyProfile.aboutCompanyPlaceholder")} className={inputClass + " resize-none"} />
                </div>
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.websiteLabel")}</label>
                  <input value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} placeholder="https://" className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.telegramLabel")}</label>
                    <input value={companyForm.social_telegram} onChange={(e) => setCompanyForm({ ...companyForm, social_telegram: e.target.value })} placeholder={t("pages.editCompanyProfile.telegramPlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.linkedinLabel")}</label>
                    <input value={companyForm.social_linkedin} onChange={(e) => setCompanyForm({ ...companyForm, social_linkedin: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("pages.editCompanyProfile.instagramLabel")}</label>
                    <input value={companyForm.social_instagram} onChange={(e) => setCompanyForm({ ...companyForm, social_instagram: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("pages.editCompanyProfile.addressLabel")}</label>
                  <input value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} className={inputClass} />
                </div>
                <button onClick={saveCompany} disabled={saving}
                  className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60">
                  {savedTab === "Kompaniya" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? t("pages.editCompanyProfile.saving") : savedTab === "Kompaniya" ? t("pages.editCompanyProfile.saved") : t("common.save")}
                </button>
              </fieldset>
            )}

            {tab === "Xavfsizlik" && (
              <div>
                <label className={labelClass}>{t("pages.editCompanyProfile.changePasswordLabel")}</label>
                <div className="space-y-3 max-w-sm">
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t("pages.editCompanyProfile.oldPasswordPlaceholder")} className={inputClass} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("pages.editCompanyProfile.newPasswordPlaceholder")} className={inputClass} />
                  {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                  <button onClick={submitPasswordChange} disabled={passwordSaving || !oldPassword || !newPassword}
                    className="flex items-center gap-2 bg-white border border-border text-ink-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60">
                    {passwordSaved ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {passwordSaving ? t("pages.editCompanyProfile.updating") : passwordSaved ? t("pages.editCompanyProfile.updated") : t("pages.editCompanyProfile.updatePassword")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink text-sm">{t("pages.editCompanyProfile.activeVacanciesTitle")}</h2>
              <Link to="/dashboard" className="text-xs text-ink-3 hover:text-ink font-medium transition-colors">{t("pages.editCompanyProfile.manage")} <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {loading ? (
              <p className="text-sm text-ink-3 text-center py-6">{t("common.loading")}</p>
            ) : activeVacancies.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-ink-3 mb-3">{t("pages.editCompanyProfile.noActiveVacancies")}</p>
                <Link to="/vacancies/new" className="text-sm font-medium text-accent hover:underline">{t("pages.editCompanyProfile.createVacancy")}</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {activeVacancies.slice(0, 5).map((v) => (
                  <Link key={v.id} to={`/vacancies/${v.id}`} className="block p-2.5 -mx-2.5 rounded-lg hover:bg-surface transition-colors">
                    <div className="font-medium text-ink text-sm truncate">{v.title}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{v.location} · {t("pages.editCompanyProfile.applicationsCount", { count: v.applications_count })}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <VerificationPanel />

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">{t("profile.statistics")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {statsCards.map((s) => (
                <div key={s.label} className="text-center p-3 bg-surface rounded-lg">
                  <s.icon className="w-4 h-4 text-ink-3 mx-auto mb-1.5" />
                  <div className="text-lg font-semibold text-ink">{s.value}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
