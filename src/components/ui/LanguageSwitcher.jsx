import { Globe } from "lucide-react";
import { useT } from "../../context/I18nContext";
import { locales } from "../../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border">
      <Globe className="w-3.5 h-3.5" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="bg-transparent outline-none cursor-pointer"
      >
        {locales.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </div>
  );
}
