import { Check } from "lucide-react";
import { useT } from "../../context/I18nContext";
import { locales } from "../../i18n";
import BottomSheet from "./BottomSheet";

// Bottom sheet for picking the interface language (UZ/RU/EN), opened from a ProfileMenuItem.
export default function LanguagePickerSheet({ open, onClose }) {
  const { locale, setLocale, t } = useT();

  return (
    <BottomSheet open={open} onClose={onClose} title={t("profile.chooseLanguage")}>
      <div className="space-y-1">
        {locales.map((l) => (
          <button
            key={l.code}
            onClick={() => { setLocale(l.code); onClose(); }}
            className="w-full min-h-12 flex items-center justify-between px-3 rounded-lg hover:bg-surface transition-colors text-left"
          >
            <span className="text-sm font-medium text-ink">{l.label}</span>
            {locale === l.code && <Check className="w-4 h-4 text-accent" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
