import { Globe } from "lucide-react";
import { useT } from "../../context/I18nContext";
import { locales } from "../../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const current = locales.find((l) => l.code === locale);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium bg-surface text-ink-2 border border-border" title={current?.label}>
      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="bg-transparent outline-none cursor-pointer w-[26px]"
      >
        {locales.map((l) => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
      </select>
    </div>
  );
}
