import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Briefcase, Award, Eye, EyeOff, Edit3, LogOut, Share2, Clock, Phone, Mail, Calendar, Plus, X, Send, Save, Lock, User, GraduationCap, Settings } from "lucide-react";
import { api } from "../lib/api";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import VerificationPanel from "../components/ui/VerificationPanel";
import SupportPanel from "../components/ui/SupportPanel";
import { useAuth } from "../context/AuthContext";

export default function SpecialistProfile() {
  const [anonMode, setAnonMode] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState({ name: "", year: "" });
  const [newTimeline, setNewTimeline] = useState({ role: "", company: "", period: "", description: "" });
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({});
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

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
        experience: user.experience || "",
        experience_level: user.experience_level || "Junior",
        salary: user.salary || "",
        hourly_price: user.hourly_price || "",
        social_telegram: user.social_telegram || "",
        social_instagram: user.social_instagram || "",
        social_github: user.social_github || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api("/orders");
        setOrders(data.orders);
      } catch (err) {
        console.error(err);
      }
    }
    loadOrders();
  }, []);

  if (!user) return null;

  const skills = user.skills || [];
  const certificates = user.certificates || [];
  const timeline = user.timeline || [];

  const completionChecklist = [
    { done: !!user.avatar, label: "Profil rasmi qo'shing", tab: "about" },
    { done: !!user.bio, label: "O'zingiz haqingizda yozing", tab: "about" },
    { done: skills.length > 0, label: "Ko'nikmalar qo'shing", tab: "skills" },
    { done: timeline.length > 0, label: "Ish tajribangizni qo'shing", tab: "experience" },
    { done: certificates.length > 0, label: "Sertifikat qo'shing", tab: "about" },
    { done: !!(user.hourly_price || user.salary), label: "Maosh kutilmalarini kiriting", tab: "about" },
    { done: !!(user.social_telegram || user.social_instagram || user.social_github), label: "Ijtimoiy tarmoq havolasi qo'shing", tab: "about" },
  ];
  const profileCompletion = Math.round((completionChecklist.filter((c) => c.done).length / completionChecklist.length) * 100);
  const missingItems = completionChecklist.filter((c) => !c.done);

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const handleLogout = () => { logout(); navigate("/login"); };

  const addSkill = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setNewSkill("");
    await updateProfile({ skills: [...skills, trimmed] });
  };

  const removeSkill = async (skill) => {
    await updateProfile({ skills: skills.filter((s) => s !== skill) });
  };

  const startEditing = () => {
    if (cooldownActive) return;
    setEditing(true);
  };

  const saveForm = async () => {
    setSaving(true);
    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      setSaveError(result.error);
    }
  };

  const addCert = async () => {
    if (!newCert.name.trim()) return;
    const certs = [...certificates, { name: newCert.name.trim(), year: newCert.year || "" }];
    await updateProfile({ certificates: certs });
    setNewCert({ name: "", year: "" });
  };

  const removeCert = async (idx) => {
    await updateProfile({ certificates: certificates.filter((_, i) => i !== idx) });
  };

  const addTimeline = async () => {
    if (!newTimeline.role.trim()) return;
    const items = [...timeline, { ...newTimeline }];
    await updateProfile({ timeline: items });
    setNewTimeline({ role: "", company: "", period: "", description: "" });
  };

  const removeTimeline = async (idx) => {
    await updateProfile({ timeline: timeline.filter((_, i) => i !== idx) });
  };

  const groups = [
    { id: "account", label: "Hisobim", icon: User, tabs: [{ id: "about", label: "Ma'lumotlar" }] },
    { id: "qualification", label: "Malaka", icon: GraduationCap, tabs: [{ id: "experience", label: "Tajriba" }, { id: "skills", label: "Ko'nikmalar" }] },
    { id: "general", label: "Umumiy", icon: Settings, tabs: [{ id: "orders", label: "Buyurtmalar" }] },
  ];
  const activeGroup = groups.find((g) => g.tabs.some((t) => t.id === activeTab)) || groups[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-20 sm:h-32 bg-gradient-to-r from-ink via-ink/80 to-ink/60 relative">
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2">
            <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"><Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
          </div>
        </div>
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
                  {!!user.online && (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs text-accent font-medium bg-accent-soft px-1.5 sm:px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full" /> Online
                    </span>
                  )}
                </div>
                <p className="text-ink-2 font-medium mt-0.5 text-xs sm:text-sm">{user.category || "Mutaxassis"}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 sm:mt-2 text-xs sm:text-sm text-ink-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {user.city || "Kiritilmagan"}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {user.experience || "Tajriba kiritilmagan"}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-ink fill-ink" /> {user.rating || 0} ({user.reviews_count || 0})</span>
                  {user.created_at && (
                    <span className="flex items-center gap-1 hidden sm:flex"><Calendar className="w-3.5 h-3.5" /> {new Date(user.created_at).getFullYear()} dan beri</span>
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
          <div className="bg-white rounded-xl border border-border">
            {/* Section groups */}
            <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3 border-b border-border overflow-x-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.tabs[0].id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeGroup.id === group.id ? "bg-ink text-white" : "bg-surface text-ink-2 hover:bg-border-soft"
                  }`}
                >
                  <group.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {group.label}
                </button>
              ))}
            </div>
            {/* Sub-tabs (only when a group has more than one) */}
            {activeGroup.tabs.length > 1 && (
              <div className="flex border-b border-border overflow-x-auto">
                {activeGroup.tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
                  </button>
                ))}
              </div>
            )}
            <div className="p-4 sm:p-6">
              {activeTab === "about" && (
                <div className="space-y-6">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Profil rasmi URL</label>
                        <input value={form.avatar || ""} onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        {form.avatar && (
                          <img src={form.avatar} alt="Avatar" className="w-12 h-12 rounded-xl object-cover mt-2" />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">O'zim haqimda</label>
                        <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Shahar</label>
                          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Tajriba (masalan: 3 yil)</label>
                          <input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Tajriba darajasi</label>
                          <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white">
                            {["Junior", "Middle", "Senior", "Expert"].map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Kutilayotgan maosh</label>
                          <input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Soatlik to'lov</label>
                          <input value={form.hourly_price} onChange={(e) => setForm({ ...form, hourly_price: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Telegram</label>
                          <input value={form.social_telegram} onChange={(e) => setForm({ ...form, social_telegram: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">Instagram</label>
                          <input value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-3 uppercase tracking-wide mb-1.5">GitHub</label>
                          <input value={form.social_github} onChange={(e) => setForm({ ...form, social_github: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none" />
                        </div>
                      </div>
                      {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                      <button onClick={saveForm} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
                        <Save className="w-4 h-4" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold text-ink text-sm mb-3">O'zim haqimda</h3>
                        <p className="text-ink-2 text-sm leading-relaxed">{user.bio || "Profil ma'lumotlari hali to'ldirilmagan. O'z haqingizda ma'lumot qo'shing."}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Kutilayotgan maosh", value: user.salary || "Kiritilmagan" },
                          { label: "Soatlik to'lov", value: user.hourly_price || "Kiritilmagan" },
                          { label: "Tajriba darajasi", value: user.experience_level },
                          { label: "Joylashuv", value: user.city || "Kiritilmagan" },
                        ].map((item) => (
                          <div key={item.label} className="bg-surface rounded-xl p-4">
                            <div className="text-xs text-ink-3 mb-1">{item.label}</div>
                            <div className="font-semibold text-ink text-sm">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {(user.social_telegram || user.social_instagram || user.social_github) && (
                        <div className="flex items-center gap-3 flex-wrap">
                          {user.social_telegram && <span className="flex items-center gap-1 text-xs text-blue-500"><Send className="w-3 h-3" /> {user.social_telegram}</span>}
                          {user.social_instagram && <span className="text-xs text-pink-500">{user.social_instagram}</span>}
                          {user.social_github && <span className="text-xs text-gray-600">{user.social_github}</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {activeTab === "experience" && (
                <div>
                  {timeline.length === 0 && <p className="text-sm text-ink-3 mb-4">Tajriba ma'lumotlari kiritilmagan</p>}
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? "bg-accent ring-4 ring-accent/10" : "bg-border"}`} />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-8 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs text-ink-3 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.period || item.year}</div>
                            <div className="font-semibold text-ink text-sm">{item.role || item.title}</div>
                            <div className="text-sm text-ink-2">{item.company || item.place}</div>
                            {(item.description || item.desc) && (
                              <p className="text-xs text-ink-3 mt-2 leading-relaxed max-w-md">{item.description || item.desc}</p>
                            )}
                          </div>
                          <button onClick={() => removeTimeline(i)} className="text-ink-3 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="bg-surface rounded-xl p-4 mt-2">
                    <h4 className="text-xs font-medium text-ink-3 uppercase tracking-wide mb-3">Yangi tajriba qo'shish</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input value={newTimeline.role} onChange={(e) => setNewTimeline({ ...newTimeline, role: e.target.value })}
                        placeholder="Lavozim" className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                      <input value={newTimeline.company} onChange={(e) => setNewTimeline({ ...newTimeline, company: e.target.value })}
                        placeholder="Kompaniya" className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                      <input value={newTimeline.period} onChange={(e) => setNewTimeline({ ...newTimeline, period: e.target.value })}
                        placeholder="2020-2023" className="px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white" />
                    </div>
                    <input value={newTimeline.description} onChange={(e) => setNewTimeline({ ...newTimeline, description: e.target.value })}
                      placeholder="Vazifalar (ixtiyoriy)" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none bg-white mb-3" />
                    <button onClick={addTimeline} disabled={!newTimeline.role.trim()}
                      className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-1 disabled:opacity-60">
                      <Plus className="w-4 h-4" /> Qo'shish
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "skills" && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill) => (
                      <span key={skill} className="px-3 py-2 bg-surface text-ink rounded-lg text-sm font-medium border border-border hover:border-ink/20 transition-colors flex items-center gap-2">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-ink-3 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && <p className="text-sm text-ink-3">Hali ko'nikmalar qo'shilmagan</p>}
                  </div>
                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      placeholder="Yangi ko'nikma qo'shing..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:border-ink/30 outline-none"
                    />
                    <button onClick={addSkill}
                      className="px-4 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Qo'shish
                    </button>
                  </div>
                </div>
              )}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} className="bg-surface rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-ink text-sm">{order.title}</h4>
                            <p className="text-xs text-ink-3 mt-0.5">Mijoz: {order.employer_name}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            order.status === "Tugatildi" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                          }`}>{order.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">{order.price}</span>
                          {order.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-500">
                              <Star className="w-3 h-3 fill-amber-500" /> {order.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-8 h-8 text-ink-3 mx-auto mb-2" />
                      <p className="text-sm text-ink-3">Hozircha buyurtmalar yo'q</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="font-semibold text-ink text-xs sm:text-sm">Profil to'ldirilganligi</h3>
              <span className="text-xs sm:text-sm font-bold text-ink flex-shrink-0">{profileCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-ink to-accent rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            {missingItems.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] text-ink-3 mb-2">Moslik foizini oshirish uchun to'ldiring:</p>
                {missingItems.slice(0, 4).map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(item.tab)}
                    className="w-full flex items-center gap-2 text-left text-xs text-ink-2 hover:text-ink py-1 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-border flex-shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-success mt-3 flex items-center gap-1"><Award className="w-3 h-3" /> Profilingiz to'liq!</p>
            )}
          </div>

          <VerificationPanel />

          <SupportPanel />

          <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="font-semibold text-ink text-xs sm:text-sm">Anonim rejim</h3>
              <button onClick={() => setAnonMode(!anonMode)} className={`relative w-10 h-5.5 sm:w-11 sm:h-6 rounded-full transition-colors flex-shrink-0 ${anonMode ? "bg-ink" : "bg-border"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${anonMode ? "left-5 sm:left-6" : "left-1"}`} />
              </button>
            </div>
            <p className="text-[11px] sm:text-xs text-ink-3">{anonMode ? "Profil yashirilgan" : "Yoqilganda profil yashiriladi"}</p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] sm:text-xs text-ink-3">
              {anonMode ? <EyeOff className="w-3.5 h-3.5 flex-shrink-0" /> : <Eye className="w-3.5 h-3.5 flex-shrink-0" />}
              {anonMode ? "Yashirin" : "Ko'rinadi"}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
            <h3 className="font-semibold text-ink text-xs sm:text-sm mb-3">Sertifikatlar</h3>
            <div className="space-y-3 mb-3">
              {certificates.length === 0 && <p className="text-[11px] sm:text-xs text-ink-3">Sertifikatlar qo'shilmagan</p>}
              {certificates.map((cert, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0"><Award className="w-4 h-4 text-ink-2" /></div>
                  <div className="min-w-0 flex-1"><div className="text-sm font-medium text-ink truncate">{cert.name}</div><div className="text-xs text-ink-3">{cert.year}</div></div>
                  <button onClick={() => removeCert(i)} className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-500 p-1 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <input value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                placeholder="Sertifikat nomi" className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:border-ink/30 outline-none bg-white" />
              <input value={newCert.year} onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                placeholder="Yil (masalan: 2024)" className="w-full px-3 py-2 rounded-lg border border-border text-xs focus:border-ink/30 outline-none bg-white" />
              <button onClick={addCert} disabled={!newCert.name.trim()}
                className="w-full px-3 py-2 bg-surface text-ink-2 rounded-lg text-xs font-medium hover:bg-border-soft transition-colors border border-border disabled:opacity-60 flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Qo'shish
              </button>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Hisobdan chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
