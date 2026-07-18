import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Briefcase, Eye } from "lucide-react";
import { api } from "../lib/api";
import VacancyPreviewModal from "../components/ui/VacancyPreviewModal";

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
const employmentTypes = ["To'liq stavka", "Yarim stavka", "Amaliyot", "Loyihaviy"];
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
};

const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-colors";
const cardClass = "bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8";
const labelClass = "block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5";
const chipBase = "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors";
const chipOn = "bg-accent text-white border-accent";
const chipOff = "bg-white text-ink-2 border-border hover:border-accent/40";

export default function VacancyCreate() {
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
      });
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
    const t = newTag.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setNewTag(""); }
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

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
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-2 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-accent-soft rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-ink">{isEdit ? "Vakansiyani tahrirlash" : "Yangi vakansiya"}</h1>
          <p className="text-xs text-ink-3">Vakansiya ma'lumotlarini to'ldiring</p>
        </div>
      </div>

      {/* 1. Asosiy */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">1. Asosiy</h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Sarlavha *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)}
              placeholder="masalan: Senior Frontend Developer"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kompaniya *</label>
            <input value={form.company} onChange={(e) => update("company", e.target.value)}
              placeholder="Kompaniya nomi"
              className={inputClass} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass + " mb-0"}>Tavsif *</label>
              <span className={`text-xs ${descriptionValid ? "text-success" : "text-ink-3"}`}>
                {descriptionLength}/{DESCRIPTION_MIN_LENGTH}+ belgi
              </span>
            </div>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={6}
              placeholder="Vakansiya haqida batafsil — talablar, vazifalar, sharoitlar... (kamida 100 belgi)"
              className={inputClass + " resize-none"} />
            {!descriptionValid && descriptionLength > 0 && (
              <p className="text-xs text-ink-3 mt-1">Ko'rib chiqishga yuborish uchun yana {DESCRIPTION_MIN_LENGTH - descriptionLength} belgi kerak.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Yo'nalish */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-1">2. Yo'nalish</h2>
        <p className="text-xs text-ink-3 mb-4">Kategoriya va aniq yo'nalish(lar)ni tanlang{!isTeacherCategory && ` (${MAX_IT_DIRECTIONS} tagacha)`}.</p>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kategoriya</label>
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
              <label className={labelClass}>Shahar</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)}
                placeholder="Toshkent"
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{isTeacherCategory ? "Fan / Yo'nalish" : "IT yo'nalishi"}</label>
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
          <h2 className="text-sm font-semibold text-ink mb-1">3. Texnologiyalar / Stack</h2>
          <p className="text-xs text-ink-3 mb-4">Kerakli texnologiyalarni tanlang — istagancha tanlash mumkin.</p>

          <div className="space-y-4">
            {Object.entries(techStackGroups).map(([group, items]) => (
              <div key={group}>
                <div className="text-xs font-medium text-ink-3 mb-1.5">{group}</div>
                <div className="flex flex-wrap gap-2">
                  {items.map((t) => {
                    const selected = tags.includes(t);
                    return (
                      <button key={t} onClick={() => (selected ? removeTag(t) : setTags([...tags, t]))}
                        className={`${chipBase} ${selected ? chipOn : chipOff}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {tags.filter((t) => !Object.values(techStackGroups).flat().includes(t)).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-ink-3 mb-1.5">Qo'shimcha</div>
              <div className="flex flex-wrap gap-2">
                {tags.filter((t) => !Object.values(techStackGroups).flat().includes(t)).map((t) => (
                  <span key={t} className="px-3 py-1.5 bg-surface text-ink rounded-lg text-xs font-medium border border-border flex items-center gap-2">
                    {t} <button onClick={() => removeTag(t)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-border-soft">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="+ Boshqa texnologiya qo'shish..."
              className={inputClass + " flex-1"} />
            <button onClick={addTag} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Ish sharoitlari */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">4. Ish sharoitlari</h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Ish tartibi</label>
              <select value={form.format} onChange={(e) => update("format", e.target.value)}
                className={inputClass + " bg-white"}>
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tajriba</label>
              <select value={form.experience} onChange={(e) => update("experience", e.target.value)}
                className={inputClass + " bg-white"}>
                {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ingliz tili</label>
              <select value={form.english_level} onChange={(e) => update("english_level", e.target.value)}
                className={inputClass + " bg-white"}>
                <option value="">Ko'rsatilmagan</option>
                {englishLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Bandlik turi</label>
              <select value={form.employment_type} onChange={(e) => update("employment_type", e.target.value)}
                className={inputClass + " bg-white"}>
                {employmentTypes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jadval</label>
              <select value={form.schedule} onChange={(e) => update("schedule", e.target.value)}
                className={inputClass + " bg-white"}>
                {scheduleOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jins</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)}
                className={inputClass + " bg-white"}>
                {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bo'sh o'rinlar soni</label>
              <input type="number" min="1" value={form.openings_count} onChange={(e) => update("openings_count", e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nomzodlar bilan aloqa</label>
              <select value={form.contact_method} onChange={(e) => update("contact_method", e.target.value)}
                className={inputClass + " bg-white"}>
                {contactMethods.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dam olish kuni</label>
              <select value={form.day_off} onChange={(e) => update("day_off", e.target.value)}
                className={inputClass + " bg-white"}>
                {weekdays.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Maosh */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">5. Maosh</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            {salaryTypes.map((t) => (
              <button key={t} onClick={() => update("salary_type", t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.salary_type === t ? "bg-accent text-white border-accent" : "bg-white text-ink-2 border-border hover:border-accent/40"
                }`}>{t}</button>
            ))}
          </div>
          {form.salary_type === "Aniq" && (
            <input value={form.salary} onChange={(e) => update("salary", e.target.value)}
              placeholder="masalan: $700"
              className={inputClass} />
          )}
          {form.salary_type === "Diapazon" && (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)}
                placeholder="Min (so'm)"
                className={inputClass} />
              <input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)}
                placeholder="Max (so'm)"
                className={inputClass} />
            </div>
          )}
          <input value={form.salary_details} onChange={(e) => update("salary_details", e.target.value)}
            placeholder="Maosh tafsiloti — masalan: oylik o'z vaqtida, bonus tizimi mavjud"
            className={inputClass} />
        </div>
      </div>

      {/* 6. Vazifalar, talablar, imtiyozlar */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">6. Vazifalar, talablar, imtiyozlar</h2>
        <div className="space-y-6">
          <div>
            <label className={labelClass}>Vazifalar</label>
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
                placeholder="Vazifa qo'shing..."
                className={inputClass + " flex-1"} />
              <button onClick={addResp} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Talablar</label>
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
                placeholder="Talab qo'shing..."
                className={inputClass + " flex-1"} />
              <button onClick={addReq} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Imtiyozlar</label>
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
                placeholder="Imtiyoz qo'shing..."
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
        <h2 className="text-sm font-semibold text-ink mb-1">7. Saralash savollari</h2>
        <p className="text-xs text-ink-3 mb-4">Nomzodlar ariza yuborishda shu savollarga javob berishadi.</p>
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
            placeholder="Savol qo'shing..."
            className={inputClass + " flex-1"} />
          <button onClick={addQuestion} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 sticky bottom-0 bg-bg/95 backdrop-blur-sm pt-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button onClick={() => navigate(-1)}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
          Bekor qilish
        </button>
        <button onClick={() => setShowPreview(true)} disabled={!form.title.trim()}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" /> Ko'rib chiqish
        </button>
        <button onClick={() => save("draft")} disabled={saving || !form.title.trim() || !form.company.trim()}
          className="flex-1 min-w-[100px] py-3 rounded-lg border border-border bg-white text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Qoralama
        </button>
        <button onClick={() => save("submit")} disabled={saving || !canSubmitForReview}
          title={!descriptionValid ? `Tavsif kamida ${DESCRIPTION_MIN_LENGTH} belgidan iborat bo'lishi kerak` : undefined}
          className="flex-1 min-w-[140px] py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saqlanmoqda..." : "Ko'rib chiqishga yuborish"}
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
