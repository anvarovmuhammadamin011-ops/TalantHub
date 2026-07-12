import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Briefcase, Award, Link as LinkIcon, Eye, EyeOff, Edit3, LogOut, Share2, Clock, Globe, Phone, Mail, Calendar, Plus, X, Send, MessageSquare, ExternalLink } from "lucide-react";
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
  { key: "orders", label: "Buyurtmalar", filled: true },
  { key: "social", label: "Ijtimoiy tarmoqlar", filled: true },
  { key: "photo", label: "Rasm", filled: false },
  { key: "languages", label: "Tillar", filled: false },
];

export default function SpecialistProfile() {
  const [anonMode, setAnonMode] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState([]);
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
    hourlyPrice: "Soatlik to'lov kiritilmagan",
    category: user?.category || "IT",
    tags: [],
    rating: 0,
    reviews: 0,
    verified: false,
    matchPercent: 0,
    online: false,
    bio: "Profil ma'lumotlari hali to'ldirilmagan. O'z haqingizda ma'lumot qo'shing.",
    skills: [],
    certificates: [],
    timeline: [],
    orders: [],
    social: { telegram: "", instagram: "", github: "" },
  };

  const allSkills = skills.length > 0 ? skills : specialist.skills;

  const displayName = user?.name || specialist.name;
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const filledCount = profileSections.filter((s) => s.filled).length;
  const profileCompletion = Math.round((filledCount / profileSections.length) * 100);

  const handleLogout = () => { logout(); navigate("/login"); };

  const addSkill = () => {
    if (newSkill.trim() && !allSkills.includes(newSkill.trim())) {
      setSkills([...allSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setSkills(allSkills.filter((s) => s !== skill));
  };

  const tabs = [
    { id: "about", label: "Ma'lumotlar" },
    { id: "experience", label: "Tajriba" },
    { id: "skills", label: "Ko'nikmalar" },
    { id: "portfolio", label: "Portfolio" },
    { id: "orders", label: "Buyurtmalar" },
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
                  {specialist.online && (
                    <span className="flex items-center gap-1 text-xs text-accent font-medium bg-accent-soft px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full" /> Online
                    </span>
                  )}
                </div>
                <p className="text-ink-2 font-medium mt-0.5 text-sm">{user?.category || specialist.category} mutaxassis</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ink-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {specialist.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {specialist.experience}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-ink fill-ink" /> {specialist.rating} ({specialist.reviews})</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 2023 dan beri</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-ink-3"><Mail className="w-3 h-3" /> {user?.email || "email@gmail.com"}</span>
                  <span className="flex items-center gap-1 text-xs text-ink-3"><Phone className="w-3 h-3" /> {user?.phone || "+998 XX XXX XX XX"}</span>
                </div>
                {specialist.social && (specialist.social.telegram || specialist.social.instagram || specialist.social.github) && (
                  <div className="flex items-center gap-3 mt-2">
                    {specialist.social.telegram && (
                      <a href={`https://t.me/${specialist.social.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors">
                        <Send className="w-3 h-3" /> {specialist.social.telegram}
                      </a>
                    )}
                    {specialist.social.instagram && (
                      <a href={`https://instagram.com/${specialist.social.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 transition-colors">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        {specialist.social.instagram}
                      </a>
                    )}
                    {specialist.social.github && (
                      <a href={`https://${specialist.social.github}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                        {specialist.social.github}
                      </a>
                    )}
                  </div>
                )}
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
            <div className="flex border-b border-border overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.id ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
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
                      { label: "Soatlik to'lov", value: specialist.hourlyPrice },
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
                        {item.description && (
                          <p className="text-xs text-ink-3 mt-2 leading-relaxed max-w-md">{item.description}</p>
                        )}
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
                  <div className="flex flex-wrap gap-2 mb-4">
                    {allSkills.map((skill) => (
                      <span key={skill} className="px-3 py-2 bg-surface text-ink rounded-lg text-sm font-medium border border-border hover:border-ink/20 transition-colors flex items-center gap-2">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-ink-3 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
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
                  <div className="bg-surface rounded-xl p-4">
                    <h4 className="text-xs font-medium text-ink-3 mb-3 uppercase tracking-wider">Ko'nikmalar darajasi</h4>
                    <div className="space-y-3">
                      {allSkills.slice(0, 8).map((skill, i) => (
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
                        <a href={`https://${p.url}`} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                  <button className="w-full p-4 border border-dashed border-border rounded-xl text-sm text-ink-3 hover:border-ink/30 hover:text-ink transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Portfolio qo'shish
                  </button>
                </div>
              )}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {specialist.orders && specialist.orders.length > 0 ? (
                    specialist.orders.map((order, i) => (
                      <div key={i} className="bg-surface rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-ink text-sm">{order.name}</h4>
                            <p className="text-xs text-ink-3 mt-0.5">Mijoz: {order.client}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            order.status === "Tugallangan" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                          }`}>{order.status}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">{order.amount}</span>
                          {order.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-ink fill-ink" />
                              <span className="text-xs font-medium">{order.rating}</span>
                            </div>
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

          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-ink text-sm mb-3">Ijtimoiy tarmoqlar</h3>
            <div className="space-y-2">
              {specialist.social?.telegram && (
                <div className="flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-blue-500" />
                  <span className="text-ink-2">{specialist.social.telegram}</span>
                </div>
              )}
              {specialist.social?.instagram && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  <span className="text-ink-2">{specialist.social.instagram}</span>
                </div>
              )}
              {specialist.social?.github && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  <span className="text-ink-2">{specialist.social.github}</span>
                </div>
              )}
              {!specialist.social?.telegram && !specialist.social?.instagram && !specialist.social?.github && (
                <p className="text-xs text-ink-3">Ijtimoiy tarmoqlar qo'shilmagan</p>
              )}
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
