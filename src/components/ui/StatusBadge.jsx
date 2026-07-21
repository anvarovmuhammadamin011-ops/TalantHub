import { useT } from "../../context/I18nContext";

const statusTone = {
  Junior: "neutral",
  Middle: "neutral",
  Senior: "neutral",
  Masofaviy: "neutral",
  Ofis: "neutral",
  Gibrid: "neutral",
  Yuborildi: "neutral",
  "Ko'rildi": "accent",
  "Ko'rib chiqilmoqda": "accent",
  Intervyu: "accent",
  Interview: "accent",
  "Qabul qilindi": "success",
  "Rad etildi": "danger",
  Yangi: "accent",
  Faol: "success",
  Kutilmoqda: "warning",
  "Tuzatish kerak": "danger",
  Nofaol: "neutral",
  Qoralama: "neutral",
  Arxivlangan: "neutral",
  Jarayonda: "accent",
  Tugatildi: "success",
  "Bekor qilindi": "danger",
};

const toneClasses = {
  neutral: { badge: "bg-surface text-ink-2 border border-border", dot: "bg-ink-3" },
  accent: { badge: "bg-accent-soft text-accent border border-accent/10", dot: "bg-accent" },
  success: { badge: "bg-success-soft text-success border border-success/10", dot: "bg-success" },
  danger: { badge: "bg-danger-soft text-danger border border-danger/10", dot: "bg-danger" },
  warning: { badge: "bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/10", dot: "bg-[#B45309]" },
};

export default function StatusBadge({ status }) {
  const { t } = useT();
  const tone = toneClasses[statusTone[status] || "neutral"];
  // Some status values (e.g. experience levels, work formats) aren't translated by design and
  // are shown as-is — t() returns the lookup key itself when no dictionary entry exists, so
  // that case falls back to the raw value instead of leaking a "status.Xyz" key into the UI.
  const translationKey = `status.${status}`;
  const translated = t(translationKey);
  const label = translated === translationKey ? status : translated;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}
