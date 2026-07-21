import { Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Notifications from "../ui/Notifications";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import SearchInput from "./SearchInput";
import { formatDateLong } from "../../lib/format";
import { useT } from "../../context/I18nContext";

const todayLabel = formatDateLong(new Date());

export default function AdminHeader({
  title,
  search,
  onSearchChange,
  searchPlaceholder,
  range,
  onRangeChange,
  onExport,
  exporting,
}) {
  const { user } = useAuth();
  const { t } = useT();
  const firstName = user?.name?.split(" ")[0] || "Admin";
  const RANGE_OPTIONS = [
    { value: "today", label: t("adminHeader.today") },
    { value: "week", label: t("adminHeader.week") },
    { value: "month", label: t("adminHeader.month") },
    { value: "year", label: t("adminHeader.year") },
  ];

  return (
    <div className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
          <p className="text-xs text-ink-3 mt-0.5">
            {t("adminHeader.welcome", { name: firstName })} · {todayLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSearchChange && (
            <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder || t("adminHeader.searchPlaceholder")} className="w-56 sm:w-64" />
          )}
          <Notifications />
          <LanguageSwitcher />
          {onExport && (
            <button
              onClick={onExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-ink-2 hover:bg-surface transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? t("common.loading") : t("common.export")}
            </button>
          )}
          {onRangeChange && (
            <div className="inline-flex items-center bg-surface rounded-lg p-0.5 border border-border">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onRangeChange(opt.value)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    range === opt.value ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
