// O'zbekiston telefon raqami: avtomatik +998 maska + operatorni aniqlash.
export const UZ_OPERATORS = [
  { prefixes: ["90", "91"], name: "Beeline" },
  { prefixes: ["93", "94"], name: "Ucell" },
  { prefixes: ["95", "97", "88"], name: "Mobiuz" },
  { prefixes: ["99", "77"], name: "UzMobile" },
  { prefixes: ["98"], name: "Perfectum" },
  { prefixes: ["33"], name: "Humans" },
  { prefixes: ["71"], name: "Toshkent sh." },
];

export function uzDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

// Har qanday kiritmani +998 XX XXX XX XX ko'rinishiga keltiradi.
// Bo'sh kiritmada ham +998 prefiksni avtomatik qo'yadi — "o'zi aniqlansin".
export function formatUzPhone(value) {
  let d = uzDigits(value);
  if (!d) return "+998 ";
  if (d.startsWith("998")) d = d.slice(3);
  else if (d.startsWith("8") && d.length === 11) d = d.slice(1);
  // 998siz 9 xonadan ortig'ini kesamiz
  d = d.slice(0, 9);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 7);
  const p4 = d.slice(7, 9);
  let out = "+998";
  if (p1) out += " " + p1;
  if (p2) out += " " + p2;
  if (p3) out += " " + p3;
  if (p4) out += " " + p4;
  return out;
}

export function normalizeUzPhone(value) {
  const d = (() => {
    let x = uzDigits(value);
    if (x.startsWith("998")) x = x.slice(3);
    return x;
  })();
  if (!/^\d{9}$/.test(d)) return null;
  return "+998" + d;
}

export function isValidUzPhone(value) {
  return normalizeUzPhone(value) !== null;
}

// 2 xonali prefiks bo'yicha operatorni aniqlaydi (masalan 90 -> Beeline).
export function detectUzOperator(value) {
  const d = (() => {
    let x = uzDigits(value);
    if (x.startsWith("998")) x = x.slice(3);
    return x;
  })();
  if (d.length < 2) return null;
  const prefix = d.slice(0, 2);
  for (const op of UZ_OPERATORS) {
    if (op.prefixes.includes(prefix)) return { ...op, prefix };
  }
  return null;
}
