export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr + "Z").getTime()) / 1000;
  if (diff < 60) return "Hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 172800) return "Kecha";
  return `${Math.floor(diff / 86400)} kun oldin`;
}

export function computeMatch(userSkills, tags) {
  if (!userSkills || userSkills.length === 0 || !tags || tags.length === 0) return 70;
  const lowerSkills = userSkills.map((s) => s.toLowerCase());
  const overlap = tags.filter((t) => lowerSkills.some((s) => s.includes(t.toLowerCase()) || t.toLowerCase().includes(s)));
  return Math.min(98, 55 + Math.round((overlap.length / tags.length) * 45));
}
