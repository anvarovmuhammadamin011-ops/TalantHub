import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Save, Briefcase } from "lucide-react";
import { api } from "../lib/api";

const categories = ["IT", "Ta'lim"];
const formats = ["Ofis", "Masofaviy", "Gibrid"];
const experienceLevels = ["Junior", "Middle", "Senior", "Expert"];
const employmentTypes = ["To'liq stavka", "Yarim stavka", "Amaliyot", "Loyihaviy"];
const genderOptions = ["Farqi yo'q", "Erkaklar", "Ayollar"];
const scheduleOptions = ["5/2", "6/1", "2/2", "Erkin grafik"];
const weekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default function VacancyCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    salary_min: "",
    salary_max: "",
    format: "Ofis",
    experience: "Junior",
    category: "IT",
    description: "",
    employment_type: "To'liq stavka",
    schedule: "5/2",
    gender: "Farqi yo'q",
    salary_details: "",
    day_off: "Yakshanba",
  });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [newReq, setNewReq] = useState("");
  const [responsibilities, setResponsibilities] = useState([]);
  const [newResp, setNewResp] = useState("");
  const [conditions, setConditions] = useState([]);
  const [newCond, setNewCond] = useState("");

  useEffect(() => {
    api("/categories?type=skill").then((d) => setTeacherSubjects(d.categories.map((c) => c.name))).catch(() => {});
  }, []);

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

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.company.trim()) return;
    setSaving(true);
    try {
      await api("/vacancies", {
        method: "POST",
        body: {
          ...form,
          salary_min: Number(form.salary_min) || 0,
          salary_max: Number(form.salary_max) || 0,
          tags,
          requirements,
          responsibilities,
          conditions,
        },
      });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isTeacherCategory = form.category === "Ta'lim";

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
            <h1 className="text-lg font-semibold text-ink">Yangi vakansiya</h1>
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
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Maosh</label>
              <input value={form.salary} onChange={(e) => update("salary", e.target.value)}
                placeholder="masalan: Kelishiladi yoki $500-800"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Min maosh (so'm)</label>
              <input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Max maosh (so'm)</label>
              <input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
            </div>
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
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          <button onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
            Bekor qilish
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.title.trim() || !form.company.trim()}
            className="flex-1 py-3 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saqlanmoqda..." : "E'lon qilish"}
          </button>
        </div>
      </div>
    </div>
  );
}
