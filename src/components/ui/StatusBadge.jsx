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
  Kutilmoqda: "accent",
  "Tuzatish kerak": "danger",
  Nofaol: "neutral",
  Qoralama: "neutral",
  Arxivlangan: "neutral",
};

const toneClasses = {
  neutral: { badge: "bg-surface text-ink-2 border border-border", dot: "bg-ink-3" },
  accent: { badge: "bg-accent-soft text-accent border border-accent/10", dot: "bg-accent" },
  success: { badge: "bg-success-soft text-success border border-success/10", dot: "bg-success" },
  danger: { badge: "bg-danger-soft text-danger border border-danger/10", dot: "bg-danger" },
};

export default function StatusBadge({ status }) {
  const tone = toneClasses[statusTone[status] || "neutral"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {status}
    </span>
  );
}
