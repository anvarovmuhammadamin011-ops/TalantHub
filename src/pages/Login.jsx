import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { LogIn, Mail, Lock, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isLoggedIn) {
    return <Navigate to={location.state?.from || "/"} replace />;
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
      navigate(location.state?.from || "/", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
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
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl border border-border p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-ink-3" />
            <h3 className="text-sm font-semibold text-ink">Demo akkauntlar</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => fillDemo("aziz@demo.com", "12345678")}
              className="w-full text-left p-3 bg-surface rounded-lg hover:bg-border-soft transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">Aziz Karimov</div>
                  <div className="text-xs text-ink-3">aziz@demo.com</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-ink/5 text-ink-3 rounded-full">IT</span>
              </div>
            </button>
            <button
              onClick={() => fillDemo("nilufar@demo.com", "12345678")}
              className="w-full text-left p-3 bg-surface rounded-lg hover:bg-border-soft transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">Nilufar Rahimova</div>
                  <div className="text-xs text-ink-3">nilufar@demo.com</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-ink/5 text-ink-3 rounded-full">Ta'lim</span>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-ink-3 mt-3 text-center">Parol: 12345678</p>
        </div>
      </div>
    </div>
  );
}
