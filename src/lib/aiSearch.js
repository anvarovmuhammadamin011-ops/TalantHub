const synonyms = {
  "dasturchi": ["developer", "dasturchi", "programmer", "frontend", "backend", "mobile"],
  "frontend": ["frontend", "react", "vue", "angular", "next.js", "javascript", "typescript"],
  "backend": ["backend", "node.js", "nodejs", "python", "java", "php", "django", "fastapi"],
  "mobile": ["mobile", "flutter", "android", "ios", "react native", "dart"],
  "o'qituvchi": ["o'qituvchi", "teacher", "ustoz", "muallim", "mentor"],
  "ingliz": ["ingliz", "english", "ielts", "celta", "tesol"],
  "matematika": ["matematika", "math"],
  "fizika": ["fizika", "physics"],
  "ui/ux": ["ui", "ux", "designer", "dizayn", "figma"],
  "python": ["python", "django", "fastapi"],
  "react": ["react", "reactjs", "next", "nextjs"],
  "junior": ["junior", "jun", "kam tajribali"],
  "middle": ["middle", "o'rta"],
  "senior": ["senior", "sen", "tajribali", "yetuk"],
  "masofaviy": ["masofaviy", "remote", "uydan"],
  "ofis": ["ofis", "office"],
  "toshkent": ["toshkent", "tashkent"],
  "samarqand": ["samarqand", "samarkand"],
  "buxoro": ["buxoro"],
  "fargona": ["farg'ona", "fargona"],
};

function detectCity(text) {
  const lower = text.toLowerCase();
  if (/toshkent|tashkent/.test(lower)) return "toshkent";
  if (/samarqand/.test(lower)) return "samarqand";
  if (/buxoro/.test(lower)) return "buxoro";
  if (/farg'ona|fargona/.test(lower)) return "farg'ona";
  return null;
}

function findMatchingKeywords(text) {
  const lower = text.toLowerCase();
  const matches = [];
  for (const [key, syns] of Object.entries(synonyms)) {
    for (const syn of syns) {
      if (lower.includes(syn)) { matches.push(key); break; }
    }
  }
  return [...new Set(matches)];
}

function calculateRelevance(specialist, query) {
  const lower = query.toLowerCase();
  const keywords = findMatchingKeywords(query);
  let score = 0;
  let reasons = [];

  const category = specialist.category || "";
  const isEducation = (specialist.fields || []).includes("Ta'lim") || category === "Ta'lim";
  const isIT = (specialist.fields || []).includes("IT") || category !== "Ta'lim";

  if (/o'qituvchi|teacher|ustoz|muallim|ingliz|matematika|fizika/.test(lower) && isEducation) {
    score += 30; reasons.push(`Kategoriya: ${category}`);
  }
  if (/dasturchi|developer|frontend|backend|mobile|ui.?ux|it/.test(lower) && isIT) {
    score += 30; reasons.push(`Kategoriya: ${category}`);
  }

  const allText = [category, specialist.bio || "", ...(specialist.skills || [])].join(" ").toLowerCase();
  for (const kw of keywords) {
    if (allText.includes(kw)) { score += 15; reasons.push(`Ko'nikma: ${kw}`); }
  }

  if (/senior|tajribali|yetuk|katta/.test(lower) && specialist.experience_level === "Senior") {
    score += 20; reasons.push("Tajriba: Senior");
  }
  if (/middle|o'rta/.test(lower) && specialist.experience_level === "Middle") {
    score += 20; reasons.push("Tajriba: Middle");
  }
  if (/junior|yangi|kam/.test(lower) && specialist.experience_level === "Junior") {
    score += 20; reasons.push("Tajriba: Junior");
  }

  const city = detectCity(query);
  if (city && (specialist.city || "").toLowerCase().includes(city)) {
    score += 10; reasons.push(`Shahar: ${specialist.city}`);
  }

  score += 5;
  return { score, reasons };
}

function generateGreeting() {
  const greetings = [
    "Salom! Men TalentHub AI yordamchisiman. Qanday mutaxassis qidiryapsiz?",
    "Assalomu alaykum! Menga qanday odam kerakligini ayting, men topib beraman.",
    "Salom! Kadrlar qidirishda yordam bera olaman. Nima kerak?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateResponse(query, specialists) {
  const lower = query.toLowerCase();

  if (/salom|assalom|hi|hello|hey/.test(lower) && lower.length < 20) {
    return { text: "Salom! Menga qanday mutaxassis kerakligini yozing.\n\nMasalan:\n• \"5 yillik tajribaga ega React dasturchi kerak\"\n• \"Ingliz tili o'qituvchisi kerak, Toshkentda\"\n• \"Senior Python developer, masofaviy\"", specialists: [] };
  }

  if (/nima|qanday|yordam|help/.test(lower) && lower.length < 30) {
    return { text: "Men sizga mutaxassis topishda yordam beraman!\n\n• \"Frontend dasturchi kerak\"\n• \"5 yillik tajribaga ega UI/UX dizayner\"\n• \"Toshkentda o'qituvchi kerak\"\n• \"Senior Python developer, masofaviy\"", specialists: [] };
  }

  const results = (specialists || []).map((s) => ({ specialist: s, ...calculateRelevance(s, query) }));
  results.sort((a, b) => b.score - a.score);
  const matched = results.filter((r) => r.score > 10).slice(0, 4);

  if (matched.length === 0) {
    return { text: `Kechirasiz, "${query}" so'rovi bo'yicha mos mutaxassis topilmadi. Boshqa kalit so'zlar bilan qidirib ko'ring.`, specialists: [] };
  }

  let intro = `Sizning so'rovingiz bo'yicha **${matched.length} ta mutaxassis** topildi:\n\nEng mos natijalar:`;

  return {
    text: intro,
    specialists: matched.map((m) => ({ ...m.specialist, matchReasons: m.reasons, aiScore: m.score })),
  };
}

export { generateGreeting, generateResponse };
