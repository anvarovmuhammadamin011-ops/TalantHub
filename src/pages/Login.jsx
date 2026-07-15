import { useState, useRef } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { LogIn, Mail, Lock, Info, Zap, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ADMIN_EMAIL = "admin@talenthub.uz";
const ADMIN_PASSWORD = "Admin123!";

const demoAccounts = [
  { name: "Aziz Karimov", email: "aziz@demo.com", role: "IT mutaxassis", color: "bg-blue-50 text-blue-600" },
  { name: "Nilufar Rahimova", email: "nilufar@demo.com", role: "Ta'lim o'qituvchisi", color: "bg-emerald-50 text-emerald-600" },
  { name: "TexnoLabs HR", email: "hr@texnolabs.uz", role: "Ish beruvchi", color: "bg-purple-50 text-purple-600" },
];

export default function Login() {
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
    return <Navigate to={location.state?.from || "/vacancies"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate(location.state?.from || "/vacancies", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const fillAdmin = () => {
    setError("");
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
    passwordRef.current?.focus();
  };

  const quickLogin = async (demoEmail) => {
    setLoggingDemo(demoEmail);
    setError("");
    const result = await login(demoEmail, "12345678");
    setLoggingDemo(null);
    if (result.success) {
      navigate(location.state?.from || "/vacancies", { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
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
            <h1 className="text-xl font-semibold text-ink tracking-tight">Tizimga kirish</h1>
            <p className="text-ink-3 text-sm mt-1">Profilingizga kiring</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-2 mb-1.5">Email</label>
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
              <label className="block text-sm font-medium text-ink-2 mb-1.5">Parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={passwordRef}
                  type="password"
                  placeholder="Parolni kiriting"
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
              {submitting ? "Kirilmoqda..." : "Kirish"}
            </button>
          </form>

          <p className="text-center text-sm text-ink-3 mt-6">
            Hisobingiz yo'qmi?{" "}
            <Link to="/register" className="text-ink font-medium hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>

          <button
            type="button"
            onClick={fillAdmin}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-3 hover:text-ink mt-4 pt-4 border-t border-border transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin sifatida kirish
          </button>
        </div>

        {/* Demo Accounts — one-click login */}
        <div className="bg-white rounded-2xl border border-border p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-ink">Tezkor kirish</h3>
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${acc.color}`}>{acc.role}</span>
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
          <p className="text-[10px] text-ink-3 mt-3 text-center">Bosing — darhol kiradi. Demo parol: 12345678</p>
        </div>
      </div>
    </div>
  );
}
