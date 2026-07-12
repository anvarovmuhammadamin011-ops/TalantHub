import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Briefcase, Award, Link as LinkIcon, Eye, EyeOff, Edit3, LogOut } from "lucide-react";
import { specialists } from "../data/mockData";
import VerifiedBadge from "../components/ui/VerifiedBadge";
import { useAuth } from "../context/AuthContext";

export default function SpecialistProfile() {
  const [anonMode, setAnonMode] = useState(false);
  const specialist = specialists[0];
  const profileCompletion = 80;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || specialist.name;
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <div className="h-24 bg-surface relative">
            <div className="absolute -bottom-9 left-6">
            <div className="w-[72px] h-[72px] bg-ink rounded-xl flex items-center justify-center text-3xl border-4 border-white shadow-sm">
              <span className="text-white text-lg font-semibold">{initials}</span>
            </div>
          </div>
        </div>
        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink tracking-tight">{displayName}</h1>
                {specialist.verified && <VerifiedBadge />}
              </div>
              <p className="text-ink-2 font-medium mt-1 text-sm">{specialist.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-ink-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {specialist.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {specialist.experience}</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-ink fill-ink" />
                  {specialist.rating} ({specialist.reviews} sharh)
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-ink-2 hover:border-ink/30 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> Chiqish
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Profile completion */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink text-sm">Profil to'ldirilganligi</h2>
              <span className="text-sm font-semibold text-ink">{profileCompletion}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="text-sm text-ink-3 mt-3">Profil to'liq to'ldirilgan, ish beruvchilar sizni topishlari mumkin</p>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-3">O'zim haqimda</h2>
            <p className="text-ink-2 text-sm leading-relaxed">{specialist.bio}</p>
          </div>

          {/* Experience timeline */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-4">Tajriba</h2>
            <div className="space-y-0">
              {specialist.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? "bg-accent" : "bg-ink-3"}`} />
                    {i < specialist.timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className="pb-6">
                    <div className="text-xs text-ink-3 mb-1">{item.period}</div>
                    <div className="font-medium text-ink text-sm">{item.role}</div>
                    <div className="text-sm text-ink-3">{item.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold text-ink text-sm mb-4">Ko'nikmalar</h2>
            <div className="flex flex-wrap gap-2">
              {specialist.skills.map((skill) => (
                <span key={skill} className="px-3 py-1.5 bg-surface text-ink-2 rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Anon mode */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ink text-sm">Anonim rejim</h3>
              <button
                onClick={() => setAnonMode(!anonMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${anonMode ? "bg-ink" : "bg-border"}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${anonMode ? "left-6" : "left-1"}`} />
              </button>
            </div>
            <p className="text-sm text-ink-3">
              {anonMode
                ? "Profil hozirgi ish beruvchilardan yashirilgan"
                : "Yoqilganda profil hozirgi ish beruvchidan yashiriladi"}
            </p>
            <div className="flex items-center gap-2 mt-3 text-sm text-ink-3">
              {anonMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {anonMode ? "Yashirin" : "Ko'rinadi"}
            </div>
          </div>

          {/* Expected salary */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-2">Kutilayotgan maosh</h3>
            <div className="text-lg font-semibold text-ink">{specialist.salary}</div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4">Sertifikatlar</h3>
            <div className="space-y-3">
              {specialist.certificates.map((cert, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-ink-2" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">{cert.name}</div>
                    <div className="text-xs text-ink-3">{cert.year}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="font-semibold text-ink text-sm mb-4">Portfolio</h3>
            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors">
                <LinkIcon className="w-3.5 h-3.5" /> github.com/aziz-karimov
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors">
                <LinkIcon className="w-3.5 h-3.5" /> aziz-dev.uz
              </a>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" /> Hisobdan chiqish
          </button>
        </div>
      </div>
    </div>
  );
}
