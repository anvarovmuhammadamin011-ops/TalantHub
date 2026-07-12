import { specialists } from "../data/mockData";

const synonyms = {
  "dasturchi": ["developer", "dasturchi", "programmer", "frontend", "backend", "mobile", "full stack", "fullstack"],
  "frontend": ["frontend", "react", "vue", "angular", "next.js", "javascript", "typescript", "css", "html"],
  "backend": ["backend", "node.js", "nodejs", "python", "java", "php", "django", "fastapi", "express", "golang"],
  "mobile": ["mobile", "flutter", "android", "ios", "react native", "dart"],
  "o'qituvchi": ["o'qituvchi", "teacher", "ustoz", "muallim", "mentor"],
  "ingliz": ["ingliz", "english", "ielts", "celta", "tesol"],
  "matematika": ["matematika", "math", "数学"],
  "fizika": ["fizika", "physics"],
  "ui/ux": ["ui", "ux", "designer", "dizayn", "figma", "figmada"],
  "python": ["python", "django", "fastapi", "pip"],
  "react": ["react", "reactjs", "react.js", "next", "nextjs"],
  "junior": ["junior", "jun", "kam tajribali", "oshiruvchi"],
  "middle": ["middle", "o'rta"],
  "senior": ["senior", "sen", "tajribali", "yetuk"],
  "masofaviy": ["masofaviy", "remote", "uydan", "distanced"],
  "ofis": ["ofis", "office", "kengash"],
  "ayol": ["ayol", "qiz", "female", "woman"],
  "erkak": ["erkak", "o'g'il", "male", "man"],
  "toshkent": ["toshkent", "tashkent", "tbl"],
  "samarqand": ["samarqand", "samarkand"],
  "buxoro": ["buxoro", "bukhara"],
  "fargona": ["farg'ona", "fargona", "fergana"],
};

function extractYears(text) {
  const match = text.match(/(\d+)\s*(yil|yillik|year|yosh)/i);
  return match ? parseInt(match[1]) : null;
}

function extractSalary(text) {
  const match = text.match(/(\d+)\s*(mln|million|so'm)/i);
  return match ? parseInt(match[1]) : null;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (/o'qituvchi|teacher|ustoz|muallim|mentor|ingliz|matematika|fizika|tarix|biologiya|sinf/.test(lower)) return "Ta'lim";
  if (/dasturchi|developer|frontend|backend|mobile|ui.?ux|devops|data|qa|pm|it|programmir/.test(lower)) return "IT";
  return null;
}

function detectExperience(text) {
  const lower = text.toLowerCase();
  if (/senior|sen|tajribali|yetuk|katta/.test(lower)) return "Senior";
  if (/middle|o'rta|ort/.test(lower)) return "Middle";
  if (/junior|jun|oshiruvchi|yangi|kam/.test(lower)) return "Junior";
  return null;
}

function detectGender(text) {
  const lower = text.toLowerCase();
  if (/qiz|ayol|female|woman|girl/.test(lower)) return "female";
  if (/o'g'il|erkak|male|man|boy/.test(lower)) return "male";
  return null;
}

function findMatchingKeywords(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const matches = [];

  for (const [key, syns] of Object.entries(synonyms)) {
    for (const syn of syns) {
      if (lower.includes(syn) || words.includes(syn)) {
        matches.push(key);
        break;
      }
    }
  }
  return [...new Set(matches)];
}

function calculateRelevance(specialist, query) {
  const lower = query.toLowerCase();
  const keywords = findMatchingKeywords(query);
  const category = detectCategory(query);
  const experience = detectExperience(query);
  const gender = detectGender(query);
  const years = extractYears(query);
  const city = detectCity(query);

  let score = 0;
  let reasons = [];

  // Category match
  if (category && specialist.category === category) {
    score += 30;
    reasons.push(`Kategoriya: ${specialist.category}`);
  }

  // Title/skills keyword match
  const allText = [...specialist.tags, specialist.title, ...specialist.skills, specialist.bio].join(" ").toLowerCase();
  for (const kw of keywords) {
    if (allText.includes(kw)) {
      score += 15;
      reasons.push(`Ko'nikma: ${kw}`);
    }
  }

  // Experience level
  if (experience && specialist.experienceLevel === experience) {
    score += 20;
    reasons.push(`Tajriba: ${specialist.experienceLevel}`);
  }

  // City
  if (city && specialist.location.toLowerCase().includes(city)) {
    score += 10;
    reasons.push(`Shahar: ${specialist.location}`);
  }

  // Gender hints (check name patterns)
  if (gender === "female") {
    const femaleNames = ["nilufar", "dilnoza", "malika", "gulnora", "nodira", "feruza", "lehkin", "shirin", "sur'ay", "dildora", "madina", "nilson"];
    if (femaleNames.some(n => specialist.name.toLowerCase().includes(n))) {
      score += 5;
      reasons.push("Jins: Ayol");
    }
  }
  if (gender === "male") {
    const maleNames = ["aziz", "sardor", "jamshid", "timur", "dilshod", "bobur", "farrux", "akbar", "jonibek", "davron"];
    if (maleNames.some(n => specialist.name.toLowerCase().includes(n))) {
      score += 5;
      reasons.push("Jins: Erkak");
    }
  }

  // Base score so everyone gets something
  score += 5;

  return { score, reasons };
}

function detectCity(text) {
  const lower = text.toLowerCase();
  if (/toshkent|tashkent|tbl/.test(lower)) return "toshkent";
  if (/samarqand|samarkand/.test(lower)) return "samarqand";
  if (/buxoro|bukhara/.test(lower)) return "buxoro";
  if (/farg'ona|fargona|fergana/.test(lower)) return "farg'ona";
  if (/namangan/.test(lower)) return "namangan";
  if (/xiva|xiva/.test(lower)) return "xiva";
  return null;
}

function generateGreeting() {
  const greetings = [
    "Salom! Men TalentHub AI yordamchisiman. Qanday mutaxassis qidiryapsiz?",
    "Assalomu alaykum! Menga qanday odam kerakligini ayting, men sizga topib beraman.",
    "Salom! Kadrlar qidirishda yordam bera olaman. Nima kerak?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function generateResponse(query) {
  const lower = query.toLowerCase();

  // Greeting detection
  if (/salom|assalom|hi|hello|hey|selam|privet/.test(lower) && lower.length < 20) {
    return {
      text: "Salom! Menga qanday mutaxassis kerakligini yozing. Masalan: \"5 yillik tajribaga ega React dasturchi kerak\" yoki \"Ingliz tili o'qituvchisi kerak, Toshkentda\"",
      specialists: [],
    };
  }

  // Help
  if (/nima|qanday|yordam|help|help me|qo'llanma/.test(lower) && lower.length < 30) {
    return {
      text: "Men sizga mutaxassis topishda yordam beraman! Quyidagilarni yozishingiz mumkin:\n\n• \"Frontend dasturchi kerak\"\n• \"5 yillik tajribaga ega UI/UX dizayner\"\n• \"Toshkentda o'qituvchi kerak\"\n• \"Senior Python developer, masofaviy\"\n• \"Qiz bola, ingliz tili o'qituvchisi\"\n\nQaysi turdagi mutaxassis kerak?",
      specialists: [],
    };
  }

  // Search specialists
  const results = specialists.map((s) => ({
    specialist: s,
    ...calculateRelevance(s, query),
  }));

  results.sort((a, b) => b.score - a.score);

  const matched = results.filter((r) => r.score > 10).slice(0, 4);

  if (matched.length === 0) {
    return {
      text: `Kechirasiz, "${query}" so'rovi bo'yicha mos mutaxassis topilmadi. Boshqa kalit so'zlar bilan qidirib ko'ring yoki "yordam" deb yozing.`,
      specialists: [],
    };
  }

  const totalFound = matched.length;
  const category = detectCategory(query);
  const experience = detectExperience(query);

  let intro = `Sizning so'rovingiz bo'yicha **${totalFound} ta mutaxassis** topildi:\n`;

  if (category) intro += `• Yo'nalish: ${category}\n`;
  if (experience) intro += `• Tajriba darajasi: ${experience}\n`;
  intro += `\nEng mos natijalar quyida:`;

  return {
    text: intro,
    specialists: matched.map((m) => ({
      ...m.specialist,
      matchReasons: m.reasons,
      aiScore: m.score,
    })),
  };
}

export { generateGreeting, generateResponse };
