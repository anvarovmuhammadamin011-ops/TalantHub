import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Users, Package, Edit3, LogOut, Save, Lock, Mail, Phone, Calendar, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import VerificationPanel from "../components/ui/VerificationPanel";
import { useAuth } from "../context/AuthContext";

export default function EmployerProfile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({});
  const [vacancies, setVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const cooldownHours = 24;
  const lastEdit = user?.profile_updated_at ? new Date(user.profile_updated_at + "Z").getTime() : null;
  const cooldownActive = lastEdit && (Date.now() - lastEdit) < cooldownHours * 60 * 60 * 1000;
  const cooldownRemaining = cooldownActive
    ? Math.ceil((cooldownHours * 60 * 60 * 1000 - (Date.now() - lastEdit)) / 60000)
    : 0;

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || "",
        city: user.city || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      try {
        const [vacData, appData, orderData] = await Promise.all([
          api("/vacancies/mine"),
          api("/applications/employer"),
          api("/orders"),
        ]);
        setVacancies(vacData.vacancies || []);
        setApplications(appData.applications || []);
        setOrders(orderData.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const handleLogout = () => { logout(); navigate("/login"); };

  const startEditing = () => {
    if (cooldownActive) return;
    setEditing(true);
  };

  const saveForm = async () => {
    setSaving(true);
    setSaveError("");
    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setSaveError(result.error);
    }
  };

  const activeVacancies = vacancies.filter((v) => (v.status || "Faol") === "Faol");
  const completedOrders = orders.filter((o) => o.status === "Tugatildi");

  const statsCards = [
    { label: "Vakansiyalar", value: vacancies.length, icon: Briefcase },
    { label: "Kelgan arizalar", value: applications.length, icon: Users },
    { label: "Buyurtmalar", value: orders.length, icon: Package },
    { label: "Bajarilgan", value: completedOrders.length, icon: Package },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-20 sm:h-32 bg-gradient-to-r from-ink via-ink/80 to-ink/60 relative" />
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
          <div className="absolute -top-8 sm:-top-10 left-4 sm:left-6">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ink rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-white text-lg sm:text-xl font-bold">{initials}</span>
              </div>
            )}
          </div>
          <div className="pt-10 sm:pt-14">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">{user.name}</h1>
                  {!!user.verified && <VerifiedBadge />}
                </div>
                <p className="text-ink-2 font-medium mt-0.5 text-xs sm:text-sm">Ish beruvchi</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-xs sm:text-sm text-ink-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {user.city || "Kiritilmagan"}</span>
                  {user.created_at && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {new Date(user.created_at).getFullYear()} dan beri</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-ink-3"><Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {user.email}</span>
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-ink-3"><Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {user.phone || "+998 XX XXX XX XX"}</span>
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <button onClick={startEditing} disabled={cooldownActive}
                  className={`h-8 sm:h-9 px-2 sm:px-3 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                    cooldownActive ? "border-gray-200 text-gray-400 cursor-not-allowed" : "border-border text-ink-2 hover:border-ink/30"
                  }`}>
                  {cooldownActive ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  <span className="hidden sm:inline">{cooldownActive ? `${Math.floor(cooldownRemaining / 60)}s` : editing ? "Bekor" : "Tahrirlash"}</span>
                </button>
                <button onClick={handleLogout} className="h-8 sm:h-9 px-2 sm:px-3 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors">
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Chiqish</span>
                </button>
              </div>
            </div>
            {cooldownActive && (
              <p className="text-[10px] sm:text-xs text-amber-600 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Profilni tahrirlash mumkin: {Math.floor(cooldownRemaining / 60)} soat {cooldownRemaining % 60} daqiqa
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Company bio */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-ink text-sm mb-3">Kompaniya haqida</h2>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder="Kompaniyangiz haqida qisqacha ma'lumot yozing..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Shahar"
                    className="px-3 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Telefon"
                    className="px-3 py-2.5 rounded-lg border border-border focus:border-ink/30 outline-none transition-colors text-sm"
                  />
                </div>
                {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                <button onClick={saveForm} disabled={saving}
                  className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                  <Save className="w-4 h-4" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-ink-2 leading-relaxed">
                {user.bio || "Hali kompaniya haqida ma'lumot kiritilmagan. \"Tahrirlash\" tugmasini bosib qo'shing."}
              </p>
            )}
          </div>

          {/* Recent vacancies */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink text-sm">Faol vakansiyalar</h2>
              <Link to="/dashboard" className="text-xs text-ink-3 hover:text-ink font-medium transition-colors">Boshqarish <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            {loading ? (
              <p className="text-sm text-ink-3 text-center py-6">Yuklanmoqda...</p>
            ) : activeVacancies.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-ink-3 mb-3">Hali faol vakansiya yo'q</p>
                <Link to="/vacancies/new" className="text-sm font-medium text-accent hover:underline">Vakansiya yaratish</Link>
              </div>
            ) : (
              <div className="space-y-1">
                {activeVacancies.slice(0, 5).map((v) => (
                  <Link key={v.id} to={`/vacancies/${v.id}`} className="block p-2.5 -mx-2.5 rounded-lg hover:bg-surface transition-colors">
                    <div className="font-medium text-ink text-sm truncate">{v.title}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{v.location} · {v.applications_count} ta ariza</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <VerificationPanel />

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-ink text-sm mb-4">Statistika</h2>
            <div className="grid grid-cols-2 gap-3">
              {statsCards.map((s) => (
                <div key={s.label} className="text-center p-3 bg-surface rounded-lg">
                  <s.icon className="w-4 h-4 text-ink-3 mx-auto mb-1.5" />
                  <div className="text-lg font-semibold text-ink">{s.value}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
