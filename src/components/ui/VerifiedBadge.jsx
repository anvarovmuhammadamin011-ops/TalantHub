import { BadgeCheck } from "lucide-react";
import { useT } from "../../context/I18nContext";

export default function VerifiedBadge({ size = "md" }) {
  const { t } = useT();
  const sizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span className="inline-flex items-center gap-1 text-accent">
      <BadgeCheck className={sizes[size]} strokeWidth={2} />
      {size !== "sm" && <span className="text-xs font-medium">{t("verifiedBadge.label")}</span>}
    </span>
  );
}
