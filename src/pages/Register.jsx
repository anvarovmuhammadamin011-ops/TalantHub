import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Briefcase, User, Code, BookOpen, CheckCircle, Smartphone, Shield, ScanFace, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, apiUpload, BASE_URL } from "../lib/api";
import { compareFaces } from "../lib/faceCheck";
import CameraCapture from "../components/verification/CameraCapture";
import DocumentUpload from "../components/verification/DocumentUpload";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import { useT } from "../context/I18nContext";
import { REGIONS, REGION_NAMES } from "../lib/uzbekistanRegions";
import { formatUzPhone, normalizeUzPhone, isValidUzPhone, detectUzOperator } from "../lib/phoneUz";

const steps = ["Rol", "Yo'nalish", "Ma'lumotlar", "SMS", "Pasport", "Face-check", "Manzil", "Tasdiqlash"];
const LAST_STEP = steps.length - 1;

// Ro'yxatdan o'tish faqat O'zbekiston raqamlari bilan: +998 maska avtomatik,
// operator prefiks bo'yicha o'zi aniqlanadi.
function formatPhone(value) {
  return formatUzPhone(value);
}

function detectOperator(value) {
  return detectUzOperator(value);
}

export default function Register() {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [fields, setFields] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "+998 ", password: "", city: "" });
  const [smsCode, setSmsCode] = useState(["", "", "", ""]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSentVia, setSmsSentVia] = useState("demo");
  const [smsBotLink, setSmsBotLink] = useState("");
  const [smsCooldown, setSmsCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [kycStage, setKycStage] = useState("");
  const [kycFailed, setKycFailed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [detectedOperator, setDetectedOperator] = useState(null);
  // KYC: pasport → face-check → manzil/hujjatlar
  const [passport, setPassport] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [faceChecking, setFaceChecking] = useState(false);
  const [residence, setResidence] = useState({ region: "", district: "", street: "" });
  const [addressDoc, setAddressDoc] = useState(null);
  const [addressDocType, setAddressDocType] = useState("propiska");
  const [diploma, setDiploma] = useState(null);
  const [diplomaUrl, setDiplomaUrl] = useState("");
  const [institution, setInstitution] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [stir, setStir] = useState("");
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

  // Face-check: pasport va selfie tayyor bo'lgach avtomatik solishtirish
  // (early-return'dan oldinda bo'lishi shart — Hook qoidasi)
  useEffect(() => {
    if (step !== 5 || !passport || !selfie) return;
    let cancelled = false;
    setFaceChecking(true);
    setFaceResult(null);
    compareFaces(passport.previewUrl, selfie.previewUrl)
      .then((res) => { if (!cancelled) { setFaceResult(res); setFaceChecking(false); } })
      .catch(() => { if (!cancelled) { setFaceResult({ score: 0, faceFoundPassport: false, faceFoundSelfie: false, auto: false, passed: false, error: true }); setFaceChecking(false); } });
    return () => { cancelled = true; };
  }, [step, passport?.previewUrl, selfie?.previewUrl]);

  // Qayta yuborish taymeri (early-return'dan oldinda — Hook qoidasi)
  useEffect(() => {
    if (smsCooldown <= 0) return;
    const id = setTimeout(() => setSmsCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [smsCooldown]);

  if (!loading && isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const sendTelegramCode = async (phone) => {
    const normalized = normalizeUzPhone(phone);
    if (!normalized) return;
    setSmsSending(true);
    setSmsError("");
    try {
      const data = await api("/auth/phone/send-code", { method: "POST", body: { phone: normalized } });
      if (data.debugCode) setGeneratedCode(data.debugCode);
      setSmsSent(true);
      setSmsSentVia(data.sentVia || "demo");
      setSmsBotLink(data.botLink || "");
      setSmsCooldown(60);
    } catch {
      // Backend ishlamasa ham ro'yxatdan o'tish to'xtamasin — lokal demo kod
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedCode(code);
      setSmsSent(true);
      setSmsSentVia("demo");
      setSmsError("");
    } finally {
      setSmsSending(false);
    }
  };

  const next = () => {
    setStepError("");
    if (step === 2) {
      if (form.password.length < 8) {
        setPasswordError(t("pages.register.passwordErrorMsg"));
        return;
      }
      if (!isValidUzPhone(form.phone)) {
        setPhoneError(t("pages.register.phoneErrorMsg"));
        return;
      }
      if (!form.city) {
        setStepError(t("pages.register.cityRequired"));
        return;
      }
      setPasswordError("");
      setPhoneError("");
      setForm((f) => ({ ...f, phone: normalizeUzPhone(f.phone) }));
    }
    // 3-qadamda kod avtomatik yuborilmaydi — foydalanuvchi "Kod olish" tugmasini bosganda chiqadi.
    if (step === 4 && !passport) {
      setStepError(t("pages.register.kyc.passportRequired"));
      return;
    }
    if (step === 5) {
      if (!selfie) {
        setStepError(t("pages.register.kyc.selfieRequired"));
        return;
      }
      if (!faceResult || faceChecking) {
        setStepError(t("pages.register.kyc.faceWait"));
        return;
      }
      // Avtomatik rejimda yuz topilmasa yoki o'xshashlik past bo'lsa — o'tkazmaydi
      if (faceResult.auto && (!faceResult.faceFoundSelfie || !faceResult.passed)) {
        setStepError(
          !faceResult.faceFoundSelfie
            ? t("pages.register.kyc.faceNoFace")
            : t("pages.register.kyc.faceMismatch")
        );
        return;
      }
    }
    if (step === 6) {
      if (!residence.region.trim() || !residence.district.trim() || !residence.street.trim()) {
        setStepError(t("pages.register.kyc.addressRequired"));
        return;
      }
      if (!addressDoc) {
        setStepError(t("pages.register.kyc.addressDocRequired"));
        return;
      }
      if (role === "employer" && !stir.trim()) {
        setStepError(t("pages.register.kyc.stirRequired"));
        return;
      }
    }
    setStep(Math.min(step + 1, LAST_STEP));
  };

  const prev = () => {
    if (step === 3) {
      setSmsSent(false);
      setSmsCode(["", "", "", ""]);
      setSmsError("");
      setSmsCooldown(0);
    }
    setStep(Math.max(step - 1, 0));
  };

  const verifySmsCode = async (fullCode) => {
    try {
      const data = await api("/auth/phone/verify-code", {
        method: "POST",
        body: { phone: normalizeUzPhone(form.phone), code: fullCode },
      });
      if (data.success) {
        setTimeout(() => setStep(4), 300);
        return;
      }
    } catch (err) {
      // Backend'da kod topilmasa (server qayta ishga tushgan bo'lsa) — lokal demo kod bilan solishtiramiz
      if (generatedCode && fullCode === generatedCode) {
        setTimeout(() => setStep(4), 300);
        return;
      }
      setSmsError(err.message || t("pages.register.smsErrorMsg"));
      return;
    }
    // Lokal fallback (backend verify muvaffaqiyatsiz, lekin demo kod mos bo'lsa)
    if (generatedCode && fullCode === generatedCode) {
      setTimeout(() => setStep(4), 300);
    } else {
      setSmsError(t("pages.register.smsErrorMsg"));
    }
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
    if (newCode.every((c) => c !== "")) {
      verifySmsCode(newCode.join(""));
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
    setKycFailed(false);
    setSubmitting(true);
    setKycStage(t("pages.register.kyc.stageAccount"));
    const result = await register({
      name: form.name || t("pages.register.defaultUserName"),
      email: form.email,
      phone: form.phone,
      password: form.password,
      city: form.city,
      role,
      fields,
      categories: selectedCats,
      category: selectedCats[0] || "",
    });
    if (!result.success) {
      setSubmitting(false);
      setKycStage("");
      setSubmitError(result.error);
      return;
    }
    // KYC hujjatlarini yuklash + verifikatsiya so'rovi yaratish
    try {
      const uploadBlob = async (capture, stage) => {
        setKycStage(stage);
        const { url } = await apiUpload("/upload", capture.blob);
        return url;
      };
      const passportUrl = await uploadBlob(passport, t("pages.register.kyc.stagePassport"));
      const selfieUrl = await uploadBlob(selfie, t("pages.register.kyc.stageSelfie"));
      const addressDocUrl = await uploadBlob(addressDoc, t("pages.register.kyc.stageDocs"));
      let diplomaDocUrl = diplomaUrl.trim();
      if (diploma) {
        diplomaDocUrl = await uploadBlob(diploma, t("pages.register.kyc.stageDocs"));
      }
      setKycStage(t("pages.register.kyc.stageVerify"));
      const residenceAddress = `${residence.region}, ${residence.district}, ${residence.street}`;
      const captureMethod = passport.method === "camera" && selfie.method === "camera" ? "camera" : "upload";
      await api("/verification", {
        method: "POST",
        body: {
          passport_url: passportUrl,
          selfie_url: selfieUrl,
          face_score: faceResult?.score || 0,
          face_auto: faceResult?.auto ? 1 : 0,
          residence_address: residenceAddress,
          address_doc_url: addressDocUrl,
          address_doc_type: addressDocType,
          capture_method: captureMethod,
          document_url: diplomaDocUrl,
          document_name: role === "specialist" ? `Diplom — ${institution || form.name}` : "",
          institution,
          specialty,
          year: gradYear ? parseInt(gradYear, 10) : 0,
          stir: role === "employer" ? stir.trim() : "",
        },
      });
      setSubmitting(false);
      setKycStage("");
      navigate("/");
    } catch (err) {
      console.error("KYC submit error:", err);
      setSubmitting(false);
      setKycStage("");
      // Hisob yaratildi, lekin hujjatlar yuborilmadi — foydalanuvchi keyin Profildan to'ldiradi
      setKycFailed(true);
      setSubmitError(err.message || t("pages.register.kyc.kycError"));
    }
  };

  const isStep1Valid = role === "specialist" ? fields.length > 0 && selectedCats.length > 0 : role === "employer";

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>
        <Link to="/vacancies" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-xs">TH</span>
          </div>
          <span className="text-lg font-semibold text-ink tracking-tight">TalentHub</span>
        </Link>

        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-6 sm:mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1 sm:gap-1.5" title={s}>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-colors ${
                i <= step ? "bg-ink text-white" : "bg-border text-ink-3"
              }`}>
                {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-3 sm:w-6 h-0.5 rounded-full ${i < step ? "bg-ink" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border p-8">
          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">{t("pages.register.roleTitle")}</h2>
              <p className="text-ink-3 text-sm text-center mb-8">{t("pages.register.roleSubtitle")}</p>
              <div className="grid gap-3">
                <button onClick={() => { setRole("specialist"); next(); }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-ink/30 transition-colors text-left">
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">{t("pages.register.specialistTitle")}</div>
                    <div className="text-ink-3 text-xs mt-0.5">{t("pages.register.specialistDesc")}</div>
                  </div>
                </button>
                <button onClick={() => { setRole("employer"); next(); }}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border hover:border-ink/30 transition-colors text-left">
                  <div className="w-11 h-11 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-ink" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-sm">{t("pages.register.employerTitle")}</div>
                    <div className="text-ink-3 text-xs mt-0.5">{t("pages.register.employerDesc")}</div>
                  </div>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-ink-3">{t("pages.register.or")}</span>
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
                {t("pages.register.googleRegister")}
              </button>
            </div>
          )}

          {/* Step 1: Fields + Categories (multi-select) */}
          {step === 1 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">{t("pages.register.directionsTitle")}</h2>
              <p className="text-ink-3 text-sm text-center mb-6">{t("pages.register.directionsSubtitle")}</p>

              <div className="mb-6">
                <label className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 block">{t("pages.register.fieldsLabel")}</label>
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
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-2 block">{t("pages.register.fieldProfessions", { field })}</label>
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
                  <span className="text-xs text-ink-3">{t("pages.register.categoriesSelectedCount", { count: selectedCats.length })}</span>
                </div>
              )}

              {isStep1Valid && (
                <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                  {t("pages.register.continueButton")} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <h2 className="text-xl font-semibold text-ink mb-6 text-center tracking-tight">{t("pages.register.personalInfoTitle")}</h2>
              <div className="space-y-4">
                {[
                  { label: t("pages.register.fullNameLabel"), key: "name", placeholder: t("pages.register.fullNamePlaceholder") },
                  { label: t("auth.email"), key: "email", placeholder: "example@mail.com", type: "email" },
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
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.phoneLabel")}</label>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder={t("pages.register.phonePlaceholder")}
                      value={form.phone}
                      onFocus={(e) => {
                        if (!e.target.value) {
                          setForm((f) => ({ ...f, phone: formatUzPhone("") }));
                        }
                      }}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setForm({ ...form, phone: formatted });
                        setDetectedOperator(detectOperator(formatted));
                        setPhoneError("");
                      }}
                      className={`w-full py-3 rounded-lg border ${
                        phoneError ? "border-red-300" : "border-border"
                      } focus:border-ink/30 outline-none transition-colors text-sm px-4 ${detectedOperator ? "pr-24" : ""}`}
                    />
                    {detectedOperator && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded pointer-events-none">
                        {detectedOperator.name}
                      </span>
                    )}
                  </div>
                  {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  {!phoneError && (
                    <p className="text-[11px] text-ink-3 mt-1">{t("pages.register.phoneAutoHint")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.cityLabel")} *</label>
                  <select
                    value={form.city}
                    onChange={(e) => { setForm({ ...form, city: e.target.value }); setStepError(""); }}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm bg-white"
                  >
                    <option value="">{t("pages.register.cityPlaceholder")}</option>
                    {REGION_NAMES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {[
                  { label: t("auth.password"), key: "password", placeholder: t("pages.register.passwordPlaceholder"), type: "password" },
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
              {stepError && <p className="text-xs text-red-500 mt-3 text-center">{stepError}</p>}
              <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                {t("pages.register.continueButton")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: SMS Verification */}
          {step === 3 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8 text-ink" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">{t("pages.register.smsTitle")}</h2>
                <p className="text-ink-3 text-sm mb-2">{t("pages.register.smsSubtitle", { phone: form.phone })}</p>
                <p className="text-xs text-ink-3 mb-4">{t("pages.register.smsTelegramHint")}</p>
                {!smsSent && !smsSending && (
                  <button onClick={() => sendTelegramCode(form.phone)}
                    className="w-full bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors mb-6">
                    {t("pages.register.smsGetCode")}
                  </button>
                )}
                {smsSending && (
                  <p className="text-xs text-ink-3 mb-4">{t("pages.register.smsSending")}</p>
                )}
                {generatedCode && smsSentVia === "demo" && (
                  <p className="text-xs text-accent font-medium mb-4">{t("pages.register.smsDemoCode", { code: generatedCode })}</p>
                )}
                {smsSentVia === "telegram" && (
                  <p className="text-xs text-emerald-600 font-medium mb-4">✓ {t("pages.register.smsTelegramSent")}</p>
                )}
                {smsBotLink && smsSentVia === "demo" && (
                  <div className="bg-surface rounded-xl p-4 mb-4">
                    <div className="flex flex-col gap-2">
                      <a href={smsBotLink} target="_blank" rel="noreferrer"
                        className="w-full bg-ink text-white py-2.5 rounded-lg text-xs font-medium hover:bg-ink/90 transition-colors text-center">
                        {t("pages.register.smsOpenBot")}
                      </a>
                      {!smsSending && smsCooldown <= 0 && smsSent && (
                        <button onClick={() => sendTelegramCode(form.phone)}
                          className="w-full py-2.5 rounded-lg border border-border text-xs font-medium text-ink hover:bg-white transition-colors">
                          {t("pages.register.smsResend")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!smsBotLink && !smsSending && smsCooldown <= 0 && smsSent && (
                  <button onClick={() => sendTelegramCode(form.phone)} className="block mx-auto text-xs text-ink font-medium mb-6 underline">
                    {t("pages.register.smsResend")}
                  </button>
                )}
                {smsCooldown > 0 && (
                  <p className="text-xs text-ink-3 mb-6">{t("pages.register.smsResendCooldown", { seconds: smsCooldown })}</p>
                )}

                {smsSent && (
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
                )}

                {smsError && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{smsError}</div>
                )}

                <div className="flex items-center gap-2 justify-center text-xs text-ink-3">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t("pages.register.smsSecureNote")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Passport photo (kamera orqali, screenshot emas) */}
          {step === 4 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <h2 className="text-xl font-semibold text-ink mb-1.5 text-center tracking-tight">{t("pages.register.kyc.passportTitle")}</h2>
              <p className="text-ink-3 text-sm text-center mb-6">{t("pages.register.kyc.passportDesc")}</p>
              <CameraCapture
                facingMode="environment"
                initialPreview={passport?.previewUrl}
                onCapture={(cap) => { setPassport(cap); setStepError(""); }}
              />
              {stepError && <p className="text-xs text-red-500 mt-3 text-center">{stepError}</p>}
              {passport && (
                <button onClick={next} className="w-full mt-6 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                  {t("pages.register.continueButton")} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 5: Face-check (jonli selfie) */}
          {step === 5 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ScanFace className="w-7 h-7 text-ink" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">{t("pages.register.kyc.selfieTitle")}</h2>
                <p className="text-ink-3 text-sm">{t("pages.register.kyc.selfieDesc")}</p>
              </div>
              <CameraCapture
                facingMode="user"
                cropFace
                initialPreview={selfie?.previewUrl}
                onCapture={(cap) => { setSelfie(cap); setStepError(""); }}
              />

              {selfie && (
                <div className="mt-4">
                  {faceChecking && (
                    <div className="flex items-center justify-center gap-2 text-sm text-ink-3 py-3">
                      <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                      {t("pages.register.kyc.faceChecking")}
                    </div>
                  )}
                  {!faceChecking && faceResult && !faceResult.error && (
                    <div className={`rounded-xl p-4 ${faceResult.passed || !faceResult.auto ? "bg-emerald-50" : "bg-red-50"}`}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className={`font-medium ${faceResult.passed || !faceResult.auto ? "text-emerald-600" : "text-red-600"}`}>
                          {faceResult.auto
                            ? (faceResult.passed ? t("pages.register.kyc.facePass") : t("pages.register.kyc.faceMismatch"))
                            : t("pages.register.kyc.faceManualReview")}
                        </span>
                        <span className="font-semibold text-ink">{Math.round(faceResult.score * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${faceResult.passed || !faceResult.auto ? "bg-emerald-500" : "bg-red-500"}`}
                          style={{ width: `${Math.round(faceResult.score * 100)}%` }}
                        />
                      </div>
                      {!faceResult.faceFoundSelfie && faceResult.auto && (
                        <p className="text-xs text-red-600 mt-2">{t("pages.register.kyc.faceNoFace")}</p>
                      )}
                      {!faceResult.auto && (
                        <p className="text-xs text-emerald-600 mt-2">{t("pages.register.kyc.faceManualNote")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {stepError && <p className="text-xs text-red-500 mt-3 text-center">{stepError}</p>}
              <div className="flex gap-2 mt-6">
                <button onClick={prev} className="px-5 py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                  {t("common.back")}
                </button>
                <button onClick={next} disabled={!selfie || faceChecking}
                  className="flex-1 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {t("pages.register.continueButton")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Yashash manzil + hujjatlar */}
          {step === 6 && (
            <div>
              <button onClick={prev} className="flex items-center gap-1 text-ink-3 hover:text-ink mb-6 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-7 h-7 text-ink" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">{t("pages.register.kyc.addressTitle")}</h2>
                <p className="text-ink-3 text-sm">{t("pages.register.kyc.addressDesc")}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.regionLabel")} *</label>
                  <select
                    value={residence.region}
                    onChange={(e) => { setResidence({ ...residence, region: e.target.value, district: "" }); setStepError(""); }}
                    className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm bg-white"
                  >
                    <option value="">{t("pages.register.kyc.regionPlaceholder")}</option>
                    {REGION_NAMES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.districtLabel")} *</label>
                    <select
                      value={residence.district}
                      onChange={(e) => setResidence({ ...residence, district: e.target.value })}
                      disabled={!residence.region}
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm bg-white disabled:opacity-50"
                    >
                      <option value="">{t("pages.register.kyc.districtPlaceholder")}</option>
                      {(REGIONS[residence.region] || []).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.streetLabel")} *</label>
                    <input value={residence.street} onChange={(e) => setResidence({ ...residence, street: e.target.value })}
                      placeholder={t("pages.register.kyc.streetPlaceholder")}
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.addressDocTypeLabel")} *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["propiska", "ijara", "kommunal"].map((dt) => (
                      <button key={dt} onClick={() => setAddressDocType(dt)}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          addressDocType === dt ? "border-ink bg-surface text-ink" : "border-border text-ink-2 hover:border-ink/30"
                        }`}>
                        {t(`pages.register.kyc.addressDocType.${dt}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.addressDocLabel")} *</label>
                  <DocumentUpload
                    initialPreview={addressDoc?.previewUrl}
                    onSelect={(cap) => { setAddressDoc(cap); setStepError(""); }}
                  />
                </div>

                {role === "specialist" ? (
                  <div className="pt-2 border-t border-border-soft">
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.diplomaLabel")}</label>
                    <CameraCapture
                      facingMode="environment"
                      initialPreview={diploma?.previewUrl}
                      onCapture={(cap) => setDiploma(cap)}
                    />
                    <input value={diplomaUrl} onChange={(e) => setDiplomaUrl(e.target.value)}
                      placeholder={t("pages.register.kyc.diplomaUrlPlaceholder")}
                      className="w-full mt-2 px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input value={institution} onChange={(e) => setInstitution(e.target.value)}
                        placeholder={t("pages.register.kyc.institutionPlaceholder")}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                      <input value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                        placeholder={t("pages.register.kyc.specialtyPlaceholder")}
                        className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                    </div>
                    <input value={gradYear} onChange={(e) => setGradYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder={t("pages.register.kyc.gradYearPlaceholder")} maxLength={4} inputMode="numeric"
                      className="w-full mt-3 px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border-soft">
                    <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("pages.register.kyc.stirLabel")} *</label>
                    <input value={stir} onChange={(e) => setStir(e.target.value.replace(/\D/g, "").slice(0, 9))} inputMode="numeric"
                      placeholder="123456789"
                      className="w-full px-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm" />
                  </div>
                )}
              </div>

              {stepError && <p className="text-xs text-red-500 mt-3 text-center">{stepError}</p>}
              <div className="flex gap-2 mt-6">
                <button onClick={prev} className="px-5 py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                  {t("common.back")}
                </button>
                <button onClick={next}
                  className="flex-1 bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                  {t("pages.register.continueButton")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Confirm */}
          {step === 7 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-accent" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-1.5 tracking-tight">{t("pages.register.confirmTitle")}</h2>
              <p className="text-ink-3 text-sm mb-6">{t("pages.register.confirmSubtitle")}</p>
              <div className="bg-surface rounded-xl p-5 mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.confirmRoleLabel")}</span>
                  <span className="font-medium text-ink">{role === "specialist" ? t("role.specialist") : t("role.employer")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.confirmDirectionsLabel")}</span>
                  <span className="font-medium text-ink text-right max-w-[200px]">{selectedCats.join(", ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.confirmNameLabel")}</span>
                  <span className="font-medium text-ink">{form.name || t("pages.register.defaultUserName")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.confirmPhoneLabel")}</span>
                  <span className="font-medium text-ink">{form.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.confirmEmailLabel")}</span>
                  <span className="font-medium text-ink">{form.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-3">{t("pages.register.kyc.summaryAddress")}</span>
                  <span className="font-medium text-ink text-right max-w-[200px]">{residence.region}, {residence.district}, {residence.street}</span>
                </div>
                {faceResult && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-3">{t("pages.register.kyc.summaryFace")}</span>
                    <span className="font-medium text-emerald-600">{Math.round(faceResult.score * 100)}% ✓</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-8">
                {[passport, selfie, addressDoc].map((cap, i) => (
                  cap && <img key={i} src={cap.previewUrl} alt="kyc" className="w-full h-20 object-cover rounded-lg border border-border" />
                ))}
              </div>
              {submitError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-left">{submitError}</div>
              )}
              {submitting && kycStage && (
                <div className="flex items-center justify-center gap-2 text-sm text-ink-3 mb-4">
                  <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  {kycStage}
                </div>
              )}
              {!kycFailed ? (
                <div className="flex gap-2 justify-center">
                  <button onClick={prev} className="px-5 py-3 rounded-lg border border-border text-ink-2 text-sm font-medium hover:bg-surface transition-colors">
                    {t("common.back")}
                  </button>
                  <button onClick={handleFinish} disabled={submitting}
                    className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                    {submitting ? t("common.loading") : t("auth.register")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors">
                  {t("pages.register.kyc.continueWithoutKyc")} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
