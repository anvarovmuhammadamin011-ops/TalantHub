// Explicit Uzbek month names — deliberately not delegated to Intl/toLocaleDateString("uz-UZ"),
// which falls back to raw ICU skeletons (e.g. "2026 M07 21") when the runtime lacks full uz-UZ CLDR data.
const MONTH_NAMES_LONG = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr",
];

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "21.07.2026"
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

// "2026-yil 21-iyul"
export function formatDateLong(value) {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-yil ${d.getDate()}-${MONTH_NAMES_LONG[d.getMonth()]}`;
}

// "21.07.2026, 14:35"
export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)}, ${hours}:${minutes}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr + "Z").getTime()) / 1000;
  if (diff < 60) return "Hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 172800) return "Kecha";
  return `${Math.floor(diff / 86400)} kun oldin`;
}

// Returns null when there isn't enough data (on either side) to compute a real match —
// callers should treat null as "unknown", not as a 0% or default match.
export function computeMatch(userSkills, tags) {
  if (!userSkills || userSkills.length === 0 || !tags || tags.length === 0) return null;
  const lowerSkills = userSkills.map((s) => s.toLowerCase());
  const overlap = tags.filter((t) => lowerSkills.some((s) => s.includes(t.toLowerCase()) || t.toLowerCase().includes(s)));
  return Math.min(98, 55 + Math.round((overlap.length / tags.length) * 45));
}

// Formats a raw so'm amount (e.g. 4200000) into a compact "4,2 mln" style string.
export function formatSalary(amount) {
  const n = Number(amount) || 0;
  if (n <= 0) return null;
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
    return `${str} mln`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1000)} ming`;
  }
  return String(n);
}
