import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Briefcase, User, Code, BookOpen, CheckCircle, Smartphone, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, BASE_URL } from "../lib/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const steps = ["Rol", "Yo'nalish", "Ma'lumotlar", "SMS", "Tasdiqlash"];

const countryFlags = { UZ: "🇺🇿", RU: "🇷🇺", US: "🇺🇸", KZ: "🇰🇿", TR: "🇹🇷", KG: "🇰🇬", TJ: "🇹🇯", TM: "🇹🇲" };

function formatPhone(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const phone = parsePhoneNumberFromString("+" + digits);
  if (phone && phone.isValid()) {
    return phone.formatInternational();
  }
  return "+" + digits;
}

function detectCountry(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const phone = parsePhoneNumberFromString("+" + digits);
  if (phone && phone.country) return phone.country;
  return null;
}

export default function Register() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [fields, setFields] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "" });
  const [smsCode, setSmsCode] = useState(["", "", "", ""]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [detectedCountry, setDetectedCountry] = useState(null);
  const { register, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [categoriesByField, setCategoriesByField] = useState({});

  useEffect(() => {
    api("/categories?type=category")
      .then((d) => {
        const grouped = {};
        for (const c of d.categories) {
          if (!grouped[c.group_name]) grouped[c.group_name] = [];
          grouped[c.group_name].push(c.name);
        }
        setCategoriesByField(grouped);
      })
      .catch(() => {});
  }, []);

  if (!loading && isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const next = () => {
    if (step === 2) {
      if (form.password.length < 8) {
        setPasswordError("Parol kamida 8 ta belgi bo'lishi kerak");
        return;
      }
      if (form.phone.replace(/\D/g, "").length < 9) {
        setPhoneError("Telefon raqamini to'g'ri kiriting");
        return;
      }
      setPasswordError("");
      setPhoneError("");
    }
    if (step === 3 && !smsSent) {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedCode(code);
      setSmsSent(true);
      setSmsError("");
    }
    setStep(Math.min(step + 1, 4));
  };

  const prev = () => {
    if (step === 3) {
      setSmsSent(false);
      setSmsCode(["", "", "", ""]);
      setSmsError("");
    }
    setStep(Math.max(step - 1, 0));
  };

  const handleSmsChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...smsCode];
    newCode[index] = value;
    setSmsCode(newCode);
    setSmsError("");
    if (value && index < 3) {
      const nextInput = document.getElementById(`sms-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    if (newCode.every((c) => c !== "") && newCode.join("") === generatedCode) {
      setTimeout(() => setStep(4), 300);
    } else if (newCode.every((c) => c !== "")) {
      setSmsError("Noto'g'ri kod. Qaytadan urinib ko'ring.");
    }
  };

  const handleSmsKeyDown = (index, e) => {
    if (e.key === "Backspace" && !smsCode[index] && index > 0) {
      const prevInput = document.getElementById(`sms-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const toggleField = (f) => {
    setFields((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const toggleCategory = (cat) => {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]);
  };

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
      fields,
      categories: selectedCats,
      category: selectedCats[0] || "",
    });
    setSubmitting(false);
    if (result.success) {
      navigate("/");
    } else {
      setSubmitError(result.error);
    }
  };

  const isStep1Valid = role === "specialist" ? fields.length > 0 && selectedCats.length > 0 : role === "employer";

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/vacancies" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-xs">TH</span>
          </div>
          <span className="text-lg font-semibold text-ink tracking-tight">TalentHub</span>
        </Link>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i <= step ? "bg-ink text-white" : "bg-border text-ink-3"
              }`}>
                {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full ${i < step ? "bg-ink" : "bg-border"}`} />
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
                <button onClick={() => { setRole("specialist"); next(); }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-ink/30 transition-colors text-left">
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Men mutaxassisman</div>
                    <div className="text-ink-3 text-xs mt-0.5">Ish qidiraman yoki profilimni ko'rsataman</div>
                  </div>
                </button>
                <button onClick={() => { setRole("employer"); next(); }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-ink/30 transition-colors text-left">
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">Men ish beruvchiman</div>
                    <div className="text-ink-3 text-xs mt-0.5">Vakansiya e'lon qilaman yoki xodim izlayman</div>
                  </div>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-ink-3">yoki</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { window.location.href = `${BASE_URL}/auth/google?role=specialist`; }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-border hover:bg-surface transition-colors text-sm font-medium text-ink"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google orqali ro'yxatdan o'tish
              </button>
            </div>
          )}

          {/* Step 1: Fields + Categories (multi-select) */}
          {step === 1 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">Yo'nalishlarni tanlang</h2>
              <p className="text-ink-3 text-sm text-center mb-6">Bir yoki bir nechta yo'nalishni tanlashingiz mumkin</p>

              <div className="mb-6">
                <label className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 block">Sohalar</label>
                <div className="flex gap-3">
                  <button onClick={() => toggleField("IT")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                      fields.includes("IT") ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                    }`}>
                    <Code className="w-4 h-4" /> IT
                  </button>
                  <button onClick={() => toggleField("Ta'lim")}
                    className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-lg border text-sm font-medium transition-colors ${
                      fields.includes("Ta'lim") ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                    }`}>
                    <BookOpen className="w-4 h-4" /> Ta'lim
                  </button>
                </div>
              </div>

              {fields.length > 0 && (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field}>
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 block">{field} kasblari</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(categoriesByField[field] || []).map((cat) => (
                          <button key={cat} onClick={() => toggleCategory(cat)}
                            className={`p-3 rounded-lg border text-left text-sm font-medium transition-colors ${
                              selectedCats.includes(cat)
                                ? "border-ink bg-surface text-ink"
                                : "border-border text-ink-2 hover:border-ink/30"
                            }`}>
                            <span className="flex items-center gap-2">
                              {selectedCats.includes(cat) && <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                              {cat}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCats.length > 0 && (
                <div className="mt-4 p-3 bg-surface rounded-lg">
                  <span className="text-xs text-ink-3">{selectedCats.length} ta yo'nalish tanlandi</span>
                </div>
              )}

              {isStep1Valid && (
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
                      className={`w-full px-4 py-3 rounded-lg border ${
                        (passwordError && f.key === "password") || (phoneError && f.key === "phone")
                          ? "border-red-300"
                          : "border-border"
                      } focus:border-ink/30 outline-none transition-colors text-sm`}
                    />
                    {passwordError && f.key === "password" && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                    {phoneError && f.key === "phone" && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">Telefon raqam</label>
                  <div className="relative">
                    {detectedCountry && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm">
                        <span>{countryFlags[detectedCountry] || ""}</span>
                        <span className="text-xs text-ink-3 font-medium">{detectedCountry}</span>
                      </div>
                    )}
                    <input
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={form.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setForm({ ...form, phone: formatted });
                        setDetectedCountry(detectCountry(formatted));
                        setPhoneError("");
                      }}
                      className={`w-full py-3 rounded-lg border ${
                        phoneError ? "border-red-300" : "border-border"
                      } focus:border-ink/30 outline-none transition-colors text-sm ${detectedCountry ? "pl-20 pr-4" : "px-4"}`}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                </div>

                {[
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
                      className={`w-full px-4 py-3 rounded-lg border ${
                        (passwordError && f.key === "password") || (phoneError && f.key === "phone")
                          ? "border-red-300"
                          : "border-border"
                      } focus:border-ink/30 outline-none transition-colors text-sm`}
                    />
                    {passwordError && f.key === "password" && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                    {phoneError && f.key === "phone" && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                ))}
              </div>
              <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                Davom etish <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: SMS Verification */}
          {step === 3 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Orqaga
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8 text-ink" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">SMS kodni kiriting</h2>
                <p className="text-ink-3 text-sm mb-2">{form.phone} raqamiga yuborilgan 4 xonali kodni kiriting</p>
                {generatedCode && (
                  <p className="text-xs text-accent font-medium mb-6">Demo: {generatedCode}</p>
                )}
                {!generatedCode && (
                  <button onClick={() => {
                    const code = String(Math.floor(1000 + Math.random() * 9000));
                    setGeneratedCode(code);
                    setSmsSent(true);
                  }} className="text-xs text-ink font-medium mb-6 underline">
                    SMS kod olish
                  </button>
                )}

                <div className="flex justify-center gap-3 mb-4">
                  {smsCode.map((digit, i) => (
                    <input
                      key={i}
                      id={`sms-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleSmsChange(i, e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => handleSmsKeyDown(i, e)}
                      className="w-14 h-14 text-center text-xl font-semibold border border-border rounded-xl focus:border-ink/30 outline-none transition-colors"
                    />
                  ))}
                </div>

                {smsError && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{smsError}</div>
                )}

                <div className="flex items-center gap-2 justify-center text-xs text-ink-3">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sizning raqamingiz xavfsiz saqlanadi</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-accent" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">Ma'lumotlarni tasdiqlang</h2>
              <p className="text-ink-3 text-sm mb-6">Barcha ma'lumotlar to'g'rimi?</p>
              <div className="bg-surface rounded-xl p-5 mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Rol:</span>
                  <span className="font-medium text-ink">{role === "specialist" ? "Mutaxassis" : "Ish beruvchi"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Yo'nalishlar:</span>
                  <span className="font-medium text-ink text-right max-w-[200px]">{selectedCats.join(", ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Ism:</span>
                  <span className="font-medium text-ink">{form.name || "Foydalanuvchi"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Telefon:</span>
                  <span className="font-medium text-ink">{form.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">Email:</span>
                  <span className="font-medium text-ink">{form.email}</span>
                </div>
              </div>
              {submitError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-left">{submitError}</div>
              )}
              <button onClick={handleFinish} disabled={submitting}
                className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                {submitting ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
