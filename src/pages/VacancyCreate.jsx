import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Briefcase, Eye } from "lucide-react";
import { api } from "../lib/api";
import VacancyPreviewModal from "../components/ui/VacancyPreviewModal";
import { REGIONS, REGION_NAMES } from "../lib/uzbekistanRegions";
import { useT } from "../context/I18nContext";

const categories = ["IT", "Ta'lim"];
const itDirections = [
  "Frontend", "Backend", "Fullstack", "Mobile", "DevOps", "QA",
  "Data Science/ML", "UI/UX", "Cybersecurity", "Game Dev", "Blockchain", "Cloud", "SysAdmin",
];
const MAX_IT_DIRECTIONS = 3;
const DESCRIPTION_MIN_LENGTH = 100;
const techStackGroups = {
  "Tillar": ["JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "PHP", "Kotlin", "Swift", "Rust", "C++", "Ruby", "Dart"],
  "Frontend": ["React", "Vue", "Angular", "Next.js", "Svelte", "HTML/CSS", "Tailwind", "Redux"],
  "Backend": ["Node.js", "Express", "NestJS", "Django", "Flask", "Spring", "Laravel", ".NET", "FastAPI"],
  "Mobile": ["React Native", "Flutter", "Android SDK", "iOS/SwiftUI"],
  "Ma'lumotlar bazasi": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Firebase"],
  "DevOps/Cloud": ["Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Nginx", "Linux"],
  "Boshqa": ["Git", "GraphQL", "REST API", "WebSocket", "Figma"],
};
const formats = ["Ofis", "Masofaviy", "Gibrid"];
const experienceLevels = ["Junior", "Middle", "Senior", "Expert"];
const employmentTypes = ["To'liq stavka", "Yarim stavka", "Soatbay", "Amaliyot", "Loyihaviy"];
const genderOptions = ["Farqi yo'q", "Erkaklar", "Ayollar"];
const scheduleOptions = ["5/2", "6/1", "2/2", "Erkin grafik"];
const weekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const englishLevels = ["Talab qilinmaydi", "Boshlang'ich", "O'rta", "Yuqori", "Erkin"];
const contactMethods = ["Platforma orqali", "Telefon", "Telegram", "Email"];
const salaryTypes = ["Kelishiladi", "Aniq", "Diapazon"];

const emptyForm = {
  title: "",
  company: "",
  location: "",
  salary: "",
  salary_min: "",
  salary_max: "",
  salary_type: "Kelishiladi",
  format: "Ofis",
  experience: "Junior",
  category: "IT",
  description: "",
  employment_type: "To'liq stavka",
  schedule: "5/2",
  gender: "Farqi yo'q",
  salary_details: "",
  day_off: "Yakshanba",
  english_level: "",
  openings_count: "1",
  contact_method: "Platforma orqali",
  start_date: "",
};

const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-colors";
const cardClass = "bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8";
const labelClass = "block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5";
const chipBase = "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors";
const chipOn = "bg-accent text-white border-accent";
const chipOff = "bg-white text-ink-2 border-border hover:border-accent/40";

const techGroupKeys = {
  "Tillar": "techStackLanguages",
  "Frontend": "techStackFrontend",
  "Backend": "techStackBackend",
  "Mobile": "techStackMobile",
  "Ma'lumotlar bazasi": "techStackDatabase",
  "DevOps/Cloud": "techStackDevops",
  "Boshqa": "techStackOther",
};

export default function VacancyCreate() {
  const { t } = useT();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [directions, setDirections] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [newReq, setNewReq] = useState("");
  const [responsibilities, setResponsibilities] = useState([]);
  const [newResp, setNewResp] = useState("");
  const [conditions, setConditions] = useState([]);
  const [newCond, setNewCond] = useState("");
  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [region, setRegion] = useState("Toshkent shahri");
  const [district, setDistrict] = useState("");

  useEffect(() => {
    api("/categories?type=skill").then((d) => setTeacherSubjects(d.categories.map((c) => c.name))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api(`/vacancies/${id}`).then(({ vacancy: v }) => {
      setForm({
        title: v.title, company: v.company, location: v.location,
        salary: v.salary, salary_min: v.salary_min || "", salary_max: v.salary_max || "",
        salary_type: v.salary_type || "Kelishiladi",
        format: v.format, experience: v.experience, category: v.category,
        description: v.description, employment_type: v.employment_type,
        schedule: v.schedule, gender: v.gender, salary_details: v.salary_details,
        day_off: v.day_off, english_level: v.english_level || "",
        openings_count: String(v.openings_count || 1), contact_method: v.contact_method || "Platforma orqali",
        start_date: v.start_date || "",
      });
      const [maybeDistrict, maybeRegion] = (v.location || "").split(",").map((s) => s.trim());
      if (maybeRegion && REGION_NAMES.includes(maybeRegion)) {
        setRegion(maybeRegion);
        if (REGIONS[maybeRegion]?.includes(maybeDistrict)) setDistrict(maybeDistrict);
      } else if (maybeDistrict && REGION_NAMES.includes(maybeDistrict)) {
        setRegion(maybeDistrict);
      }
      setDirections(v.directions || []);
      setTags(v.tags || []);
      setRequirements(v.requirements || []);
      setResponsibilities(v.responsibilities || []);
      setConditions(v.conditions || []);
      setScreeningQuestions(v.screening_questions || []);
    }).catch((err) => console.error(err)).finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const toggleDirection = (d) => {
    if (directions.includes(d)) {
      setDirections(directions.filter((x) => x !== d));
    } else if (form.category === "Ta'lim" || directions.length < MAX_IT_DIRECTIONS) {
      setDirections([...directions, d]);
    }
  };

  const addTag = () => {
    const tagValue = newTag.trim();
    if (tagValue && !tags.includes(tagValue)) { setTags([...tags, tagValue]); setNewTag(""); }
  };
  const removeTag = (tagValue) => setTags(tags.filter((x) => x !== tagValue));

  const addReq = () => {
    const r = newReq.trim();
    if (r && !requirements.includes(r)) { setRequirements([...requirements, r]); setNewReq(""); }
  };
  const removeReq = (r) => setRequirements(requirements.filter((x) => x !== r));

  const addResp = () => {
    const r = newResp.trim();
    if (r && !responsibilities.includes(r)) { setResponsibilities([...responsibilities, r]); setNewResp(""); }
  };
  const removeResp = (r) => setResponsibilities(responsibilities.filter((x) => x !== r));

  const addCond = () => {
    const c = newCond.trim();
    if (c && !conditions.includes(c)) { setConditions([...conditions, c]); setNewCond(""); }
  };
  const removeCond = (c) => setConditions(conditions.filter((x) => x !== c));

  const addQuestion = () => {
    const q = newQuestion.trim();
    if (q && !screeningQuestions.includes(q)) { setScreeningQuestions([...screeningQuestions, q]); setNewQuestion(""); }
  };
  const removeQuestion = (q) => setScreeningQuestions(screeningQuestions.filter((x) => x !== q));

  const buildBody = () => ({
    ...form,
    salary_min: Number(form.salary_min) || 0,
    salary_max: Number(form.salary_max) || 0,
    openings_count: Number(form.openings_count) || 1,
    directions,
    tags,
    requirements,
    responsibilities,
    conditions,
    screening_questions: screeningQuestions,
  });

  const descriptionLength = form.description.trim().length;
  const descriptionValid = descriptionLength >= DESCRIPTION_MIN_LENGTH;
  const canSubmitForReview = form.title.trim() && form.company.trim() && descriptionValid;

  const save = async (saveAs) => {
    if (!form.title.trim() || !form.company.trim()) return;
    if (saveAs === "submit" && !descriptionValid) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api(`/vacancies/${id}`, { method: "PATCH", body: { ...buildBody(), save_as: saveAs } });
      } else {
        await api("/vacancies", { method: "POST", body: { ...buildBody(), save_as: saveAs } });
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isTeacherCategory = form.category === "Ta'lim";
  const directionOptions = isTeacherCategory ? teacherSubjects : itDirections;

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">{t("common.loading")}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">{isEdit ? t("pages.vacancyCreate.pageTitleEdit") : t("pages.vacancyCreate.pageTitleNew")}</h1>
          <p className="text-xs text-ink-3">{t("pages.vacancyCreate.pageSubtitle")}</p>
        </div>
      </div>

      {/* 1. Asosiy */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.vacancyCreate.section1Title")}</h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.titleLabel")}</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)}
              placeholder={t("pages.vacancyCreate.titlePlaceholder")}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.companyLabel")}</label>
            <input value={form.company} onChange={(e) => update("company", e.target.value)}
              placeholder={t("pages.vacancyCreate.companyPlaceholder")}
              className={inputClass} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + " mb-0"}>{t("pages.vacancyCreate.descriptionLabel")}</label>
              <span className={`text-xs ${descriptionValid ? "text-success" : "text-ink-3"}`}>
                {t("pages.vacancyCreate.descriptionCharCount", { count: descriptionLength, min: DESCRIPTION_MIN_LENGTH })}
              </span>
            </div>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={6}
              placeholder={t("pages.vacancyCreate.descriptionPlaceholder")}
              className={inputClass + " resize-none"} />
            {!descriptionValid && descriptionLength > 0 && (
              <p className="text-xs text-ink-3 mt-1">{t("pages.vacancyCreate.descriptionHint", { count: DESCRIPTION_MIN_LENGTH - descriptionLength })}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Yo'nalish */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-1">{t("pages.vacancyCreate.section2Title")}</h2>
        <p className="text-xs text-ink-3 mb-4">{t("pages.vacancyCreate.section2Subtitle")}{!isTeacherCategory && t("pages.vacancyCreate.upToDirectionsSuffix", { count: MAX_IT_DIRECTIONS })}.</p>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.categoryLabel")}</label>
              <div className="flex gap-2">
                {categories.map((c) => (
                  <button key={c} onClick={() => { update("category", c); setDirections([]); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.category === c ? "bg-accent text-white border-accent" : "bg-white text-ink-2 border-border hover:border-accent/40"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.regionLabel")}</label>
              <select value={region} onChange={(e) => {
                const nextRegion = e.target.value;
                setRegion(nextRegion);
                setDistrict("");
                update("location", nextRegion);
              }} className={inputClass + " bg-white"}>
                {REGION_NAMES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.districtLabel")}</label>
            <select value={district} onChange={(e) => {
              const nextDistrict = e.target.value;
              setDistrict(nextDistrict);
              update("location", nextDistrict ? `${nextDistrict}, ${region}` : region);
            }} className={inputClass + " bg-white"}>
              <option value="">{t("pages.vacancyCreate.districtNotSelected")}</option>
              {(REGIONS[region] || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>{isTeacherCategory ? t("pages.vacancyCreate.directionLabelSubject") : t("pages.vacancyCreate.directionLabelIt")}</label>
            <div className="flex flex-wrap gap-2">
              {directionOptions.map((d) => {
                const selected = directions.includes(d);
                const disabled = !selected && !isTeacherCategory && directions.length >= MAX_IT_DIRECTIONS;
                return (
                  <button key={d} onClick={() => toggleDirection(d)} disabled={disabled}
                    className={`${chipBase} ${selected ? chipOn : chipOff} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Texnologiyalar / Stack */}
      {!isTeacherCategory && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-1">{t("pages.vacancyCreate.section3Title")}</h2>
          <p className="text-xs text-ink-3 mb-4">{t("pages.vacancyCreate.section3Subtitle")}</p>

          <div className="space-y-4">
            {Object.entries(techStackGroups).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs font-medium text-ink-3 mb-1.5">{t(`pages.vacancyCreate.${techGroupKeys[group]}`)}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const selected = tags.includes(item);
                    return (
                      <button key={item} onClick={() => (selected ? removeTag(item) : setTags([...tags, item]))}
                        className={`${chipBase} ${selected ? chipOn : chipOff}`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {tags.filter((tg) => !Object.values(techStackGroups).flat().includes(tg)).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-ink-3 mb-1.5">{t("pages.vacancyCreate.additionalLabel")}</div>
              <div className="flex flex-wrap gap-2">
                {tags.filter((tg) => !Object.values(techStackGroups).flat().includes(tg)).map((tg) => (
                  <span key={tg} className="px-3 py-1.5 bg-surface text-ink rounded-lg text-xs font-medium border border-border flex items-center gap-2">
                    {tg} <button onClick={() => removeTag(tg)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-border-soft">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder={t("pages.vacancyCreate.addTechPlaceholder")}
              className={inputClass + " flex-1"} />
            <button onClick={addTag} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Ish sharoitlari */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.vacancyCreate.section4Title")}</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.workFormatLabel")}</label>
              <select value={form.format} onChange={(e) => update("format", e.target.value)}
                className={inputClass + " bg-white"}>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.experienceLabel")}</label>
              <select value={form.experience} onChange={(e) => update("experience", e.target.value)}
                className={inputClass + " bg-white"}>
                {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.englishLabel")}</label>
              <select value={form.english_level} onChange={(e) => update("english_level", e.target.value)}
                className={inputClass + " bg-white"}>
                <option value="">{t("pages.vacancyCreate.englishNotSpecified")}</option>
                {englishLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.employmentTypeLabel")}</label>
              <select value={form.employment_type} onChange={(e) => update("employment_type", e.target.value)}
                className={inputClass + " bg-white"}>
                {employmentTypes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.scheduleLabel")}</label>
              <select value={form.schedule} onChange={(e) => update("schedule", e.target.value)}
                className={inputClass + " bg-white"}>
                {scheduleOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.genderLabel")}</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)}
                className={inputClass + " bg-white"}>
                {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.openingsCountLabel")}</label>
              <input type="number" min="1" value={form.openings_count} onChange={(e) => update("openings_count", e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.contactMethodLabel")}</label>
              <select value={form.contact_method} onChange={(e) => update("contact_method", e.target.value)}
                className={inputClass + " bg-white"}>
                {contactMethods.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.dayOffLabel")}</label>
              <select value={form.day_off} onChange={(e) => update("day_off", e.target.value)}
                className={inputClass + " bg-white"}>
                {weekdays.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("pages.vacancyCreate.startDateLabel")}</label>
              <input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)}
                className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Maosh */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.vacancyCreate.section5Title")}</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            {salaryTypes.map((st) => (
              <button key={st} onClick={() => update("salary_type", st)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.salary_type === st ? "bg-accent text-white border-accent" : "bg-white text-ink-2 border-border hover:border-accent/40"
                }`}>{st}</button>
            ))}
          </div>
          {form.salary_type === "Aniq" && (
            <input value={form.salary} onChange={(e) => update("salary", e.target.value)}
              placeholder={t("pages.vacancyCreate.salaryPlaceholder")}
              className={inputClass} />
          )}
          {form.salary_type === "Diapazon" && (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)}
                placeholder={t("pages.vacancyCreate.salaryMinPlaceholder")}
                className={inputClass} />
              <input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)}
                placeholder={t("pages.vacancyCreate.salaryMaxPlaceholder")}
                className={inputClass} />
            </div>
          )}
          <input value={form.salary_details} onChange={(e) => update("salary_details", e.target.value)}
            placeholder={t("pages.vacancyCreate.salaryDetailsPlaceholder")}
            className={inputClass} />
        </div>
      </div>

      {/* 6. Vazifalar, talablar, imtiyozlar */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">{t("pages.vacancyCreate.section6Title")}</h2>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.responsibilitiesLabel")}</label>
            <div className="space-y-2 mb-2">
              {responsibilities.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm text-ink">{r}</span>
                  <button onClick={() => removeResp(r)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newResp} onChange={(e) => setNewResp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addResp()}
                placeholder={t("pages.vacancyCreate.responsibilityPlaceholder")}
                className={inputClass + " flex-1"} />
              <button onClick={addResp} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.requirementsLabel")}</label>
            <div className="space-y-2 mb-2">
              {requirements.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm text-ink">{r}</span>
                  <button onClick={() => removeReq(r)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newReq} onChange={(e) => setNewReq(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReq()}
                placeholder={t("pages.vacancyCreate.requirementPlaceholder")}
                className={inputClass + " flex-1"} />
              <button onClick={addReq} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("pages.vacancyCreate.benefitsLabel")}</label>
            <div className="space-y-2 mb-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm text-ink">{c}</span>
                  <button onClick={() => removeCond(c)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCond} onChange={(e) => setNewCond(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCond()}
                placeholder={t("pages.vacancyCreate.benefitPlaceholder")}
                className={inputClass + " flex-1"} />
              <button onClick={addCond} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Saralash savollari */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-1">{t("pages.vacancyCreate.section7Title")}</h2>
        <p className="text-xs text-ink-3 mb-4">{t("pages.vacancyCreate.section7Subtitle")}</p>
        <div className="space-y-2 mb-2">
          {screeningQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 px-3 py-2 bg-surface rounded-lg text-sm text-ink">{q}</span>
              <button onClick={() => removeQuestion(q)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
            placeholder={t("pages.vacancyCreate.questionPlaceholder")}
            className={inputClass + " flex-1"} />
          <button onClick={addQuestion} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-bg/95 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button onClick={() => navigate(-1)}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
          {t("common.cancel")}
        </button>
        <button onClick={() => setShowPreview(true)} disabled={!form.title.trim()}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" /> {t("pages.vacancyCreate.previewButton")}
        </button>
        <button onClick={() => save("draft")} disabled={saving || !form.title.trim() || !form.company.trim()}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {t("status.Qoralama")}
        </button>
        <button onClick={() => save("submit")} disabled={saving || !canSubmitForReview}
          title={!descriptionValid ? t("pages.vacancyCreate.descriptionTooltip", { min: DESCRIPTION_MIN_LENGTH }) : undefined}
          className="flex-1 min-w-[140px] py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? t("pages.vacancyCreate.savingText") : t("pages.vacancyCreate.submitForReviewButton")}
        </button>
      </div>

      {showPreview && (
        <VacancyPreviewModal
          vacancy={{ ...buildBody(), author_name: form.company }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
