import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Briefcase, Eye } from "lucide-react";
import { api } from "../lib/api";
import VacancyPreviewModal from "../components/ui/VacancyPreviewModal";

const categories = ["IT", "Ta'lim"];
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

export default function VacancyCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
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
      setTags(v.tags || []);
      setRequirements(v.requirements || []);
      setResponsibilities(v.responsibilities || []);
      setConditions(v.conditions || []);
      setScreeningQuestions(v.screening_questions || []);
    }).catch((err) => console.error(err)).finally(() => setLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => setForm({ ...form, [field]: value });

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
    tags,
    requirements,
    responsibilities,
    conditions,
    screening_questions: screeningQuestions,
  });

  const save = async (saveAs) => {
    if (!form.title.trim() || !form.company.trim()) return;
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

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-ink-3 text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-6 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      <div className="bg-white rounded-xl border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-ink/5 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">{isEdit ? "Vakansiyani tahrirlash" : "Yangi vakansiya"}</h1>
            <p className="text-xs text-ink-3">Vakansiya ma'lumotlarini to'ldiring</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Sarlavha *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)}
              placeholder="masalan: Senior Frontend Developer"
              className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Kompaniya *</label>
            <input value={form.company} onChange={(e) => update("company", e.target.value)}
              placeholder="Kompaniya nomi"
              className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Kategoriya</label>
              <div className="flex gap-2">
                {categories.map((c) => (
                  <button key={c} onClick={() => update("category", c)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.category === c ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-border hover:border-ink/30"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Shahar</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)}
                placeholder="Toshkent"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
          </div>

          {isTeacherCategory && (
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Fan / Yo'nalish</label>
              <div className="flex flex-wrap gap-2">
                {teacherSubjects.map((s) => (
                  <button key={s} onClick={() => {
                    if (!tags.includes(s)) setTags([...tags, s]);
                    else setTags(tags.filter((t) => t !== s));
                  }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      tags.includes(s) ? "bg-accent text-white border-accent" : "bg-white text-ink-2 border-border hover:border-ink/30"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Ish tartibi</label>
              <select value={form.format} onChange={(e) => update("format", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Tajriba</label>
              <select value={form.experience} onChange={(e) => update("experience", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Ingliz tili</label>
              <select value={form.english_level} onChange={(e) => update("english_level", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                <option value="">Ko'rsatilmagan</option>
                {englishLevels.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Format</label>
              <select value={form.employment_type} onChange={(e) => update("employment_type", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {employmentTypes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Jadval</label>
              <select value={form.schedule} onChange={(e) => update("schedule", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {scheduleOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Jins</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Bo'sh o'rinlar soni</label>
              <input type="number" min="1" value={form.openings_count} onChange={(e) => update("openings_count", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Nomzodlar bilan aloqa</label>
              <select value={form.contact_method} onChange={(e) => update("contact_method", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {contactMethods.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Maosh turi</label>
            <div className="flex gap-2 mb-3">
              {salaryTypes.map((t) => (
                <button key={t} onClick={() => update("salary_type", t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.salary_type === t ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-border hover:border-ink/30"
                  }`}>{t}</button>
              ))}
            </div>
            {form.salary_type === "Aniq" && (
              <input value={form.salary} onChange={(e) => update("salary", e.target.value)}
                placeholder="masalan: $700"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            )}
            {form.salary_type === "Diapazon" && (
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)}
                  placeholder="Min (so'm)"
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                <input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)}
                  placeholder="Max (so'm)"
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Maosh tafsiloti</label>
              <input value={form.salary_details} onChange={(e) => update("salary_details", e.target.value)}
                placeholder="masalan: Oylik o'z vaqtida, bonus tizimi mavjud"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Dam olish kuni</label>
              <select value={form.day_off} onChange={(e) => update("day_off", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                {weekdays.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Tavsif</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4}
              placeholder="Vakansiya haqida batafsil..."
              className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none resize-none" />
          </div>

          {!isTeacherCategory && (
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Ko'nikmalar / Teglar</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span key={t} className="px-3 py-1.5 bg-surface text-ink rounded-lg text-sm font-medium border border-border flex items-center gap-2">
                    {t} <button onClick={() => removeTag(t)} className="text-ink-3 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Ko'nikma qo'shing..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                <button onClick={addTag} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Vazifalar</label>
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              <button onClick={addResp} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Talablar</label>
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              <button onClick={addReq} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Imtiyozlar</label>
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              <button onClick={addCond} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Saralash savollari</label>
            <p className="text-xs text-ink-3 mb-2">Nomzodlar ariza yuborishda shu savollarga javob berishadi.</p>
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
              <button onClick={addQuestion} className="px-4 py-2.5 bg-surface rounded-lg text-sm font-medium text-ink-2 hover:bg-border-soft transition-colors border border-border">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-border">
          <button onClick={() => navigate(-1)}
            className="flex-1 min-w-[100px] py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
            Bekor qilish
          </button>
          <button onClick={() => setShowPreview(true)} disabled={!form.title.trim()}
            className="flex-1 min-w-[100px] py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" /> Ko'rib chiqish
          </button>
          <button onClick={() => save("draft")} disabled={saving || !form.title.trim() || !form.company.trim()}
            className="flex-1 min-w-[100px] py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Qoralama
          </button>
          <button onClick={() => save("submit")} disabled={saving || !form.title.trim() || !form.company.trim()}
            className="flex-1 min-w-[140px] py-3 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saqlanmoqda..." : "Ko'rib chiqishga yuborish"}
          </button>
        </div>
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
