import { useState, useRef } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { LogIn, Mail, Lock, Info, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../lib/api";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import { useT } from "../context/I18nContext";

const demoAccounts = [
  { name: "Aziz Karimov", email: "aziz@demo.com", roleKey: "demoRoleIt", color: "bg-blue-50 text-blue-600" },
  { name: "Nilufar Rahimova", email: "nilufar@demo.com", roleKey: "demoRoleEducation", color: "bg-emerald-50 text-emerald-600" },
  { name: "TexnoLabs HR", email: "hr@texnolabs.uz", roleKey: "demoRoleEmployer", color: "bg-purple-50 text-purple-600" },
];

export default function Login() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [loggingDemo, setLoggingDemo] = useState(null);
  const passwordRef = useRef(null);

  if (!loading && isLoggedIn) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("pages.login.fillAllFields"));
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate(location.state?.from || "/", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const quickLogin = async (demoEmail) => {
    setLoggingDemo(demoEmail);
    setError("");
    const result = await login(demoEmail, "12345678");
    setLoggingDemo(null);
    if (result.success) {
      navigate(location.state?.from || "/", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>
        <Link to="/vacancies" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
            <span className="text-white font-semibold text-xs">TH</span>
          </div>
          <span className="text-lg font-semibold text-ink tracking-tight">TalentHub</span>
        </Link>

        <div className="bg-white rounded-2xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-ink" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">{t("pages.login.title")}</h1>
            <p className="text-ink-3 text-sm mt-1">{t("pages.login.subtitle")}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">{t("auth.password")}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={passwordRef}
                  type="password"
                  placeholder={t("pages.login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-white py-3 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
            >
              {submitting ? t("pages.login.submitting") : t("auth.login")}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-ink-3">{t("pages.login.or")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${BASE_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg border border-border hover:bg-surface transition-colors text-sm font-medium text-ink"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("pages.login.googleLogin")}
          </button>

          <p className="text-center text-sm text-ink-3 mt-6">
            {t("pages.login.noAccount")}{" "}
            <Link to="/register" className="text-ink font-medium hover:underline">
              {t("pages.login.registerLink")}
            </Link>
          </p>
        </div>

        {/* Demo Accounts — one-click login */}
        <div className="bg-white rounded-2xl border border-border p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-ink">{t("pages.login.quickLoginTitle")}</h3>
          </div>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc.email)}
                disabled={loggingDemo !== null}
                className="w-full text-left p-3 bg-surface rounded-xl hover:bg-border-soft transition-all hover:shadow-sm disabled:opacity-60 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-border-soft shadow-sm text-sm font-semibold text-ink-2">
                      {acc.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink">{acc.name}</div>
                      <div className="text-[11px] text-ink-3">{acc.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${acc.color}`}>{t(`pages.login.${acc.roleKey}`)}</span>
                    {loggingDemo === acc.email ? (
                      <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ink-3 mt-3 text-center">{t("pages.login.quickLoginHint")}</p>
        </div>
      </div>
    </div>
  );
}
