import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useT } from "../context/I18nContext";

// Placeholder — replace body text with the real policy before launch.
export default function PrivacyPolicy() {
  const { t } = useT();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/profile" className="inline-flex items-center gap-2 text-ink-3 hover:text-ink mb-4 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav.profile")}
      </Link>
      <h1 className="text-xl font-semibold text-ink mb-4">{t("profile.privacyPolicy")}</h1>
      <div className="bg-white rounded-xl border border-border p-6 text-sm text-ink-2 leading-relaxed space-y-3">
        <p className="text-ink-3 text-xs uppercase tracking-wide font-medium">{t("pages.privacyPolicy.placeholderLabel")}</p>
        <p>{t("pages.privacyPolicy.body")}</p>
      </div>
    </div>
  );
}
