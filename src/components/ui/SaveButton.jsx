import { useState } from "react";
import { Heart } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useT } from "../../context/I18nContext";

const SIZES = {
  sm: "w-9 h-9",
  md: "w-10 h-10",
  lg: "w-11 h-11",
};

// Heart toggle for saving/unsaving a vacancy. Owns its own saved state and API call
// so any card or detail page can drop it in without re-implementing the optimistic update.
export default function SaveButton({ vacancyId, initialSaved = false, size = "md", onChange }) {
  const [saved, setSaved] = useState(initialSaved);
  const showToast = useToast();
  const { t } = useT();

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    onChange?.(next);
    try {
      await api(`/vacancies/${vacancyId}/save`, { method: next ? "POST" : "DELETE" });
    } catch (err) {
      console.error(err);
      showToast(t("saveButton.error"), "error");
      setSaved(!next);
      onChange?.(!next);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`${SIZES[size]} flex items-center justify-center rounded-lg transition-colors ${
        saved ? "text-danger hover:bg-danger-soft" : "text-ink-3 hover:text-ink hover:bg-surface"
      }`}
      title={saved ? t("saveButton.unsave") : t("saveButton.save")}
    >
      <Heart className="w-[18px] h-[18px]" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
