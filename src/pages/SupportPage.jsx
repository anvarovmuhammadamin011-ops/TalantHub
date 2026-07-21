import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SupportPanel from "../components/ui/SupportPanel";
import { useT } from "../context/I18nContext";

// Wraps the existing SupportPanel as a standalone page — reached from both the
// "Fikr va takliflar" and "Biz bilan bog'lanish" profile menu items.
export default function SupportPage() {
  const { t } = useT();
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-4 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav.profile")}
      </Link>
      <h1 className="text-xl font-semibold text-ink mb-4">{t("profile.help")}</h1>
      <SupportPanel />
    </div>
  );
}
