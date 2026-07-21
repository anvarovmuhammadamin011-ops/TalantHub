const COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES = {
  sm: "w-8 h-8 text-xs rounded-md",
  md: "w-10 h-10 text-sm rounded-lg",
  ml: "w-11 h-11 text-xl rounded-lg",
  lg: "w-14 h-14 text-2xl rounded-xl",
  xl: "w-16 h-16 text-3xl rounded-xl",
};

// company_logo is usually empty in seed/demo data — falls back to a colored initial-letter
// avatar (deterministic per company name) instead of a generic building icon for every company.
export default function CompanyLogo({ name, logo, size = "md", className = "" }) {
  const sizeClass = SIZES[size] || SIZES.md;
  const isImageUrl = typeof logo === "string" && (logo.startsWith("http") || logo.startsWith("/"));

  if (isImageUrl) {
    return <img src={logo} alt={name || ""} className={`${sizeClass} object-cover flex-shrink-0 ${className}`} />;
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`${sizeClass} flex items-center justify-center font-semibold flex-shrink-0 ${colorFor(name || "")} ${className}`}>
      {initial}
    </div>
  );
}
