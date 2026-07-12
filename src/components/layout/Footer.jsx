import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Globe, MessageCircle, Users, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                <span className="text-ink font-semibold text-xs">TH</span>
              </div>
              <span className="text-[15px] font-semibold text-white tracking-tight">
                TalentHub
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              O'zbekistondagi IT mutaxassislar va o'qituvchilar uchun professional ish topish platformasi.
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 hover:border-white/30 hover:text-white transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 hover:border-white/30 hover:text-white transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 hover:border-white/30 hover:text-white transition-colors">
                <Users className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 hover:border-white/30 hover:text-white transition-colors">
                <Send className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white text-sm font-medium mb-4">Sahifalar</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/vacancies" className="hover:text-white transition-colors">Vakansiyalar</Link></li>
              <li><Link to="/specialists" className="hover:text-white transition-colors">Mutaxassislar</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Ro'yxatdan o'tish</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Ish beruvchilar uchun</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-medium mb-4">Foydali havolalar</h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Yordam markazi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Maxfiylik siyosati</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Foydalanish shartlari</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-medium mb-4">Bog'lanish</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4" />
                +998 90 123 45 67
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                info@talentHub.uz
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                Toshkent, Amir Temur ko'chasi 108
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs text-white/30">
          © 2026 TalentHub. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
}
