import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Qidirish...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
      />
    </div>
  );
}
