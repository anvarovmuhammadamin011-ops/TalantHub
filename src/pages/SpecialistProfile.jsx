import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Briefcase, Award, Link as LinkIcon, Eye, EyeOff, Edit3, LogOut, Share2, Clock, Globe, Phone, Mail, Calendar } from "lucide-react";
import { specialists } from "../data/mockData";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import { useAuth } from "../context/AuthContext";

const profileSections = [
  { key: "bio", label: "O'zim haqimda", filled: true },
  { key: "experience", label: "Tajriba", filled: true },
  { key: "skills", label: "Ko'nikmalar", filled: true },
  { key: "certificates", label: "Sertifikatlar", filled: true },
  { key: "portfolio", label: "Portfolio", filled: true },
  { key: "salary", label: "Maosh", filled: true },
  { key: "photo", label: "Rasm", filled: false },
  { key: "languages", label: "Tillar", filled: false },
];

export default function SpecialistProfile() {
  const [anonMode, setAnonMode] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const specialist = specialists.find((s) => s.name === user?.name) || {
    id: 0,
    name: user?.name || "Foydalanuvchi",
    avatar: "👤",
    title: `${user?.category || "IT"} mutaxassis`,
    location: "Toshkent",
    experience: "Tajriba kiritilmagan",
    experienceLevel: "Junior",
    salary: "Maosh kiritilmagan",
    category: user?.category || "IT",
    tags: [],
    rating: 0,
    reviews: 0,
    verified: false,
    matchPercent: 0,
    bio: "Profil ma'lumotlari hali to'ldirilmagan. O'z haqingizda ma'lumot qo'shing.",
    skills: [],
    certificates: [],
    timeline: [],
  };

  const displayName = user?.name || specialist.name;
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const filledCount = profileSections.filter((s) => s.filled).length;
  const profileCompletion = Math.round((filledCount / profileSections.length) * 100);

  const handleLogout = () => { logout(); navigate("/login"); };

  const tabs = [
    { id: "about", label: "Ma'lumotlar" },
    { id: "experience", label: "Tajriba" },
    { id: "skills", label: "Ko'nikmalar" },
    { id: "portfolio", label: "Portfolio" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-32 bg-gradient-to-r from-ink via-ink/80 to-ink/60 relative">
          <div className="absolute top-3 right-3 flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"><Share2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-10 left-6">
            <div className="w-20 h-20 bg-ink rounded-2xl flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
          </div>
          <div className="pt-14">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-ink tracking-tight">{displayName}</h1>
                  {specialist.verified && <VerifiedBadge />}
                </div>
                <p className="text-ink-2 font-medium mt-0.5 text-sm">{user?.category || specialist.category} mutaxassis</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ink-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {specialist.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {specialist.experience}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-ink fill-ink" /> {specialist.rating} ({specialist.reviews})</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 2023 dan beri</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-ink-3"><Mail className="w-3 h-3" /> {user?.email || "aziz@gmail.com"}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-3"><Phone className="w-3 h-3" /> {user?.phone || "+998 90 123 45 67"}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-3"><Globe className="w-3 h-3" /> aziz-dev.uz</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-border text-ink-2 hover:border-ink/30 text-sm font-medium transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
                </button>
                <button onClick={handleLogout} className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Chiqish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border">
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink" />}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "about" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-ink text-sm mb-3">O'zim haqimda</h3>
                    <p className="text-ink-2 text-sm leading-relaxed">{specialist.bio}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Kutilayotgan maosh", value: specialist.salary },
                      { label: "Ish turi", value: "Masofaviy / Ofis" },
                      { label: "Tajriba darajasi", value: specialist.experienceLevel },
                      { label: "Joylashuv", value: specialist.location },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface rounded-xl p-4">
                        <div className="text-xs text-ink-3 mb-1">{item.label}</div>
                        <div className="font-semibold text-ink text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "experience" && (
                <div>
                  {specialist.timeline.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 ${i === 0 ? "bg-accent ring-4 ring-accent/10" : "bg-border"}`} />
                        {i < specialist.timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-8">
                        <div className="text-xs text-ink-3 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.period}</div>
                        <div className="font-semibold text-ink text-sm">{item.role}</div>
                        <div className="text-sm text-ink-2">{item.company}</div>
                        <p className="text-xs text-ink-3 mt-2 leading-relaxed max-w-md">Loyihada ishtirok etdim, jamoa bilan hamkorlik qildim.</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-accent ring-4 ring-accent/10" /></div>
                    <div className="text-xs text-accent font-medium">Hozir ishlayapman</div>
                  </div>
                </div>
              )}
              {activeTab === "skills" && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {specialist.skills.map((skill) => (
                      <span key={skill} className="px-3 py-2 bg-surface text-ink rounded-lg text-sm font-medium border border-border hover:border-ink/20 transition-colors">{skill}</span>
                    ))}
                  </div>
                  <div className="bg-surface rounded-xl p-4">
                    <h4 className="text-xs font-medium text-ink-3 mb-3 uppercase tracking-wider">Ko'nikmalar darajasi</h4>
                    <div className="space-y-3">
                      {specialist.skills.slice(0, 5).map((skill, i) => (
                        <div key={skill}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-ink">{skill}</span>
                            <span className="text-xs text-ink-3">{95 - i * 8}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-ink rounded-full" style={{ width: `${95 - i * 8}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "portfolio" && (
                <div className="space-y-3">
                  {[
                    { name: "E-commerce platformasi", url: "github.com/aziz/ecommerce", tech: "React, Node.js, MongoDB", desc: "To'liq funktsional e-commerce ilovasi" },
                    { name: "Portfolio sayti", url: "aziz-dev.uz", tech: "Next.js, Tailwind", desc: "Shaxsiy portfolio va blog" },
                    { name: "Chat ilovasi", url: "github.com/aziz/chat-app", tech: "React, Socket.io", desc: "Real-time chat ilovasi" },
                  ].map((p, i) => (
                    <div key={i} className="bg-surface rounded-xl p-4 border border-border hover:border-ink/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-ink text-sm">{p.name}</h4>
                          <p className="text-xs text-ink-3 mt-0.5">{p.desc}</p>
                          <div className="flex gap-1.5 mt-2">
                            {p.tech.split(", ").map((t) => (
                              <span key={t} className="px-2 py-0.5 bg-white border border-border rounded text-[10px] text-ink-3 font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                        <a href="#" className="text-ink-3 hover:text-ink transition-colors"><LinkIcon className="w-4 h-4" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-ink text-sm">Profil to'ldirilganligi</h3>
              <span className="text-sm font-bold text-ink">{profileCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-ink to-accent rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            <div className="space-y-1.5">
              {profileSections.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.filled ? "bg-accent" : "bg-border"}`} />
                  <span className={s.filled ? "text-ink-2" : "text-ink-3"}>{s.label}</span>
                  {!s.filled && <span className="text-ink-3 ml-auto">Qo'shing</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ink text-sm">Anonim rejim</h3>
              <button onClick={() => setAnonMode(!anonMode)} className={`relative w-11 h-6 rounded-full transition-colors ${anonMode ? "bg-ink" : "bg-border"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${anonMode ? "left-6" : "left-1"}`} />
              </button>
            </div>
            <p className="text-xs text-ink-3">{anonMode ? "Profil yashirilgan" : "Yoqilganda profil yashiriladi"}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-3">
              {anonMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {anonMode ? "Yashirin" : "Ko'rinadi"}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-ink text-sm mb-3">Sertifikatlar</h3>
            <div className="space-y-3">
              {specialist.certificates.map((cert, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0"><Award className="w-4 h-4 text-ink-2" /></div>
                  <div><div className="text-sm font-medium text-ink">{cert.name}</div><div className="text-xs text-ink-3">{cert.year}</div></div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Hisobdan chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
