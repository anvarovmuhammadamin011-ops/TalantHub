export default function MatchIndicator({ percent, size = "md" }) {
  const getColor = (p) => {
    if (p >= 80) return { stroke: "#6366F1", text: "text-accent" };
    if (p >= 60) return { stroke: "#1F2430", text: "text-ink" };
    return { stroke: "#9CA3AF", text: "text-ink-3" };
  };

  const hasValue = percent !== null && percent !== undefined;
  const color = hasValue ? getColor(percent) : { stroke: "#E5E7EB", text: "text-ink-3" };
  const sizes = {
    sm: { container: "w-11 h-11", text: "text-[11px]", stroke: 2.5, radius: 18, dash: 113 },
    md: { container: "w-16 h-16", text: "text-sm", stroke: 3, radius: 24, dash: 150 },
    lg: { container: "w-28 h-28", text: "text-xl", stroke: 4, radius: 52, dash: 326 },
  };
  const s = sizes[size];
  const offset = hasValue ? s.dash - (s.dash * percent) / 100 : 0;

  return (
    <div className={`${s.container} relative flex items-center justify-center`} title={hasValue ? undefined : "Hisoblash uchun ko'nikmalar yetarli emas"}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${(s.radius + s.stroke) * 2} ${(s.radius + s.stroke) * 2}`}>
        <circle cx={s.radius + s.stroke} cy={s.radius + s.stroke} r={s.radius} fill="none" stroke="#EEF0F3" strokeWidth={s.stroke} />
        {hasValue && (
          <circle
            cx={s.radius + s.stroke}
            cy={s.radius + s.stroke}
            r={s.radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={s.stroke}
            strokeDasharray={s.dash}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${s.text} font-semibold ${color.text}`}>
        {hasValue ? `${percent}%` : "—"}
      </div>
    </div>
  );
}
