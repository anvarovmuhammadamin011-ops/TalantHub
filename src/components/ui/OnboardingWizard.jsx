import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useT } from "../../context/I18nContext";

const SKILL_SUGGESTIONS = {
  IT: ["JavaScript", "React", "Node.js", "Python", "Java", "SQL", "Figma", "Git"],
  "Ta'lim": ["Pedagogika", "IELTS", "Metodika", "Onlayn dars", "Test tuzish"],
};

export default function OnboardingWizard() {
  const { user, updateProfile, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [bio, setBio] = useState(user?.bio || "");
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || "Junior");
  const [city, setCity] = useState(user?.city || "");
  const [salary, setSalary] = useState(user?.salary || "");

  const shouldShow = user?.role === "specialist" && !user?.onboarding_completed && !dismissed;
  if (!shouldShow) return null;

  const totalSteps = 4;

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill) => setSkills(skills.filter((s) => s !== skill));

  const suggestions = (SKILL_SUGGESTIONS[user?.category] || SKILL_SUGGESTIONS[user?.fields?.[0]] || SKILL_SUGGESTIONS.IT)
    .filter((s) => !skills.includes(s));

  const skip = async () => {
    setDismissed(true);
    await completeOnboarding();
  };

  const finish = async () => {
    setSaving(true);
    await updateProfile({ skills, bio, experience_level: experienceLevel, city, salary });
    await completeOnboarding();
    setSaving(false);
    setDismissed(true);
    navigate("/vacancies");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-ink" : i < step ? "w-1.5 bg-ink" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <button onClick={skip} className="p-1 text-ink-3 hover:text-ink" title={t("onboardingWizard.skip")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-accent" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2 tracking-tight">{t("onboardingWizard.welcome", { name: user.name.split(" ")[0] })}</h2>
              <p className="text-ink-3 text-sm mb-8 leading-relaxed">
                {t("onboardingWizard.intro")}
              </p>
              <button onClick={() => setStep(1)} className="w-full bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                {t("onboardingWizard.start")} <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={skip} className="w-full mt-3 text-ink-3 text-xs font-medium hover:text-ink transition-colors">
                {t("onboardingWizard.fillLater")}
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-ink mb-1.5 tracking-tight">{t("onboardingWizard.skillsTitle")}</h2>
              <p className="text-ink-3 text-sm mb-5">{t("onboardingWizard.skillsSubtitle")}</p>

              <div className="flex flex-wrap gap-2 mb-4 min-h-[2.5rem]">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-surface text-ink rounded-lg text-sm font-medium border border-border flex items-center gap-1.5">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder={t("onboardingWizard.skillPlaceholder")}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill(skillInput)}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none text-sm"
                />
                <button onClick={() => addSkill(skillInput)} className="px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-ink-3 mb-2">{t("onboardingWizard.suggested")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 8).map((s) => (
                      <button key={s} onClick={() => addSkill(s)} className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-ink-2 hover:bg-border-soft transition-colors">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-ink mb-1.5 tracking-tight">{t("onboardingWizard.aboutTitle")}</h2>
              <p className="text-ink-3 text-sm mb-5">{t("onboardingWizard.aboutSubtitle")}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{t("onboardingWizard.bioLabel")}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder={t("onboardingWizard.bioPlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{t("onboardingWizard.experienceLevelLabel")}</label>
                    <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none text-sm bg-white">
                      {["Junior", "Middle", "Senior", "Expert"].map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{t("onboardingWizard.cityLabel")}</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toshkent"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-ink mb-1.5 tracking-tight">{t("onboardingWizard.salaryTitle")}</h2>
              <p className="text-ink-3 text-sm mb-5">{t("onboardingWizard.salarySubtitle")}</p>
              <div>
                <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">{t("onboardingWizard.salaryLabel")}</label>
                <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder={t("onboardingWizard.salaryPlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none text-sm" />
              </div>

              <div className="mt-6 p-4 bg-accent-soft rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-ink-2 leading-relaxed">
                  {t("onboardingWizard.progress", { filled: [skills.length > 0, !!bio, !!city, !!salary].filter(Boolean).length + 1 })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            {step > 0 && step < totalSteps && (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
            )}
            {step > 0 && step < totalSteps - 1 && (
              <button onClick={() => setStep(step + 1)} className="flex-1 bg-ink text-white py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                {t("onboardingWizard.continueBtn")} <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === totalSteps - 1 && (
              <button onClick={finish} disabled={saving} className="flex-1 bg-ink text-white py-2.5 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? t("onboardingWizard.saving") : t("onboardingWizard.finish")} <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
