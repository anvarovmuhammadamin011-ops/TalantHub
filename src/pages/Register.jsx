import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Briefcase, User, Code, BookOpen, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const steps = ["Rol", "Yo'nalish", "Ma'lumotlar", "Tasdiqlash"];
const categories = {
  IT: ["Frontend Developer", "Backend Developer", "Mobile Developer", "UI/UX Designer", "DevOps Engineer", "Data Scientist", "QA Engineer", "Project Manager"],
  "Ta'lim": ["Ingliz tili o'qituvchisi", "Matematika o'qituvchisi", "Fizika o'qituvchisi", "Informatika o'qituvchisi", "Biologiya o'qituvchisi", "Tarix o'qituvchisi"],
};

export default function Register() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [field, setField] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const [passwordError, setPasswordError] = useState("");

  const next = () => {
    if (step === 2 && form.password.length < 8) {
      setPasswordError("Parol kamida 8 ta belgi bo'lishi kerak");
      return;
    }
    setPasswordError("");
    setStep(Math.min(step + 1, 3));
  };
  const prev = () => setStep(Math.max(step - 1, 0));

  const handleFinish = async () => {
    setSubmitError("");
    setSubmitting(true);
    const result = await register({
      name: form.name || "Foydalanuvchi",
      email: form.email,
      phone: form.phone,
      password: form.password,
      city: form.city,
      role,
      field,
      category: selectedCat,
    });
    setSubmitting(false);
    if (result.success) {
      navigate("/vacancies");
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-xs">TH</span>
          </div>
          <span className="text-lg font-semibold text-ink tracking-tight">
            TalentHub
          </span>
        </Link>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i <= step ? "bg-ink text-white" : "bg-border text-ink-3"
              }`}>
                {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-10 h-0.5 rounded-full ${i < step ? "bg-ink" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border p-8">
          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">Siz kimsiz?</h2>
              <p className="text-ink-3 text-sm text-center mb-8">O'zingizga mos rolni tanlang</p>
              <div className="grid gap-3">
                <button
                  onClick={() => { setRole("specialist"); next(); }}
                  className={`flex items-center gap-4 p-5 rounded-xl border transition-colors text-left ${
                    role === "specialist" ? "border-ink bg-surface" : "border-border hover:border-ink/30"
                  }`}
                >
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Men mutaxassisman</div>
                    <div className="text-ink-3 text-xs mt-0.5">Ish qidiraman yoki profilimni ko'rsataman</div>
                  </div>
                </button>
                <button
                  onClick={() => { setRole("employer"); next(); }}
                  className={`flex items-center gap-4 p-5 rounded-xl border transition-colors text-left ${
                    role === "employer" ? "border-ink bg-surface" : "border-border hover:border-ink/30"
                  }`}
                >
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Men ish beruvchiman</div>
                    <div className="text-ink-3 text-xs mt-0.5">Vakansiya e'lon qilaman yoki xodim izlayman</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Field + Category */}
          {step === 1 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">Yo'nalishni tanlang</h2>
              <p className="text-ink-3 text-sm text-center mb-6">Qaysi sohada ishlaysiz?</p>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setField("IT")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                    field === "IT" ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                  }`}
                >
                  <Code className="w-4 h-4" /> IT
                </button>
                <button
                  onClick={() => setField("Ta'lim")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                    field === "Ta'lim" ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Ta'lim
                </button>
              </div>

              {field && (
                <div className="grid grid-cols-2 gap-2">
                  {categories[field].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(cat)}
                      className={`p-3 rounded-lg border text-left text-sm font-medium transition-colors ${
                        selectedCat === cat
                          ? "border-ink bg-surface text-ink"
                          : "border-border text-ink-2 hover:border-ink/30"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {selectedCat && (
                <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                  Davom etish <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>
              <h2 className="text-xl font-semibold text-ink mb-6 text-center tracking-tight">Shaxsiy ma'lumotlar</h2>
              <div className="space-y-4">
                {[
                  { label: "To'liq ism", key: "name", placeholder: "Masalan: Aziz Karimov" },
                  { label: "Email", key: "email", placeholder: "example@mail.com", type: "email" },
                  { label: "Telefon", key: "phone", placeholder: "+998 90 123 45 67", type: "tel" },
                  { label: "Shahar", key: "city", placeholder: "Masalan: Toshkent" },
                  { label: "Parol", key: "password", placeholder: "Kamida 8 ta belgi", type: "password" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">{f.label}</label>
                    <input
                      type={f.type || "text"}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={(e) => {
                        setForm({ ...form, [f.key]: e.target.value });
                        if (f.key === "password") setPasswordError("");
                      }}
                      className={`w-full px-4 py-3 rounded-lg border ${passwordError && f.key === "password" ? "border-red-300" : "border-border"} focus:border-ink/30 outline-none transition-colors text-sm`}
                    />
                    {passwordError && f.key === "password" && (
                      <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                Davom etish <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-ink" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">Ma'lumotlarni tasdiqlang</h2>
              <p className="text-ink-3 text-sm mb-6">Barcha ma'lumotlar to'g'rimi? "Boshlash" tugmasini bosing.</p>
              <div className="bg-surface rounded-xl p-5 mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Rol:</span>
                  <span className="font-medium text-ink">{role === "specialist" ? "Mutaxassis" : "Ish beruvchi"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Yo'nalish:</span>
                  <span className="font-medium text-ink">{field}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Kategoriya:</span>
                  <span className="font-medium text-ink">{selectedCat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Ism:</span>
                  <span className="font-medium text-ink">{form.name || "Foydalanuvchi"}</span>
                </div>
              </div>
              {submitError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-left">
                  {submitError}
                </div>
              )}
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Yuklanmoqda..." : "Boshlash"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
