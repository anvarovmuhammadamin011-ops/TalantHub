const express = require("express");
const OpenAI = require("openai");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function clientSideMatch(user, vacancies) {
  const skills = Array.isArray(user.skills) ? user.skills : JSON.parse(user.skills || "[]");
  const userBio = (user.bio || "").toLowerCase();
  const userCat = (user.category || "").toLowerCase();

  return vacancies.map((v) => {
    const tags = (() => { try { return JSON.parse(v.tags || "[]"); } catch { return []; } })();
    const vTags = Array.isArray(tags) ? tags : [];
    let score = 0;

    for (const tag of vTags) {
      const t = tag.toLowerCase();
      if (skills.some((s) => s.toLowerCase() === t)) score += 15;
      if (userBio.includes(t)) score += 5;
    }

    const vTitle = (v.title || "").toLowerCase();
    if (userCat && vTitle.includes(userCat)) score += 30;
    if (v.experience === user.experience_level) score += 20;
    if (v.location && v.location.toLowerCase() === (user.city || "").toLowerCase()) score += 10;

    const matchPercent = Math.min(95, Math.max(10, score + 15));

    const reasons = [];
    if (score >= 30) reasons.push("Ko'nikmalaringiz mos keladi");
    if (v.experience === user.experience_level) reasons.push("Tajriba darajangiz mos");
    if (v.location && v.location.toLowerCase() === (user.city || "").toLowerCase()) reasons.push("Joylashuv mos");

    return { ...v, tags: vTags, matchPercent, reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 6);
}

function parseSpecialist(row) {
  const { password, ...safe } = row;
  try { safe.fields = JSON.parse(safe.fields || "[]"); } catch { safe.fields = []; }
  try { safe.categories = JSON.parse(safe.categories || "[]"); } catch { safe.categories = []; }
  try { safe.skills = JSON.parse(safe.skills || "[]"); } catch { safe.skills = []; }
  return safe;
}

function clientSideSpecialistMatch(query, specialists) {
  const lower = query.toLowerCase();

  return specialists.map((s) => {
    let score = 5;
    const reasons = [];

    const category = s.category || "";
    const isEducation = (s.fields || []).includes("Ta'lim");
    const isIT = (s.fields || []).includes("IT");

    if (/o'qituvchi|teacher|ustoz|muallim|ingliz|matematika|fizika/i.test(lower) && isEducation) {
      score += 30; reasons.push(`Kategoriya: ${category}`);
    }
    if (/dasturchi|developer|frontend|backend|mobile|ui.?ux|\bit\b/i.test(lower) && isIT) {
      score += 30; reasons.push(`Kategoriya: ${category}`);
    }

    const allText = [category, s.bio || "", ...(s.skills || [])].join(" ").toLowerCase();
    for (const word of lower.split(/\s+/)) {
      if (word.length > 2 && allText.includes(word)) { score += 8; reasons.push(`Ko'nikma: ${word}`); }
    }

    if (/senior|tajribali|yetuk|katta/i.test(lower) && s.experience_level === "Senior") {
      score += 20; reasons.push("Tajriba: Senior");
    }
    if (/middle|o'rta/i.test(lower) && s.experience_level === "Middle") {
      score += 20; reasons.push("Tajriba: Middle");
    }
    if (/junior|yangi|kam/i.test(lower) && s.experience_level === "Junior") {
      score += 20; reasons.push("Tajriba: Junior");
    }

    if (s.city && lower.includes(s.city.toLowerCase())) {
      score += 10; reasons.push(`Shahar: ${s.city}`);
    }

    return { ...s, matchPercent: Math.min(95, Math.max(10, score)), matchReasons: [...new Set(reasons)].slice(0, 3) };
  }).filter((s) => s.matchPercent > 15).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 4);
}

router.post("/search-specialists", async (req, res) => {
  try {
    const query = (req.body.query || "").trim();
    if (!query) return res.status(400).json({ error: "So'rov bo'sh bo'lishi mumkin emas" });

    if (/^(salom|assalom|hi|hello|hey)\b/i.test(query) && query.length < 20) {
      return res.json({
        text: "Salom! Menga qanday mutaxassis kerakligini yozing.\n\nMasalan:\n• \"5 yillik tajribaga ega React dasturchi kerak\"\n• \"Ingliz tili o'qituvchisi kerak, Toshkentda\"\n• \"Senior Python developer, masofaviy\"",
        specialists: [],
        ai: false,
      });
    }

    const rows = db.prepare("SELECT * FROM users WHERE role = 'specialist'").all();
    const specialists = rows.map(parseSpecialist);

    if (!specialists.length) {
      return res.json({ text: "Hozircha tizimda mutaxassislar mavjud emas.", specialists: [], ai: false });
    }

    if (!client) {
      const matched = clientSideSpecialistMatch(query, specialists);
      const text = matched.length
        ? `Sizning so'rovingiz bo'yicha **${matched.length} ta mutaxassis** topildi:\n\nEng mos natijalar:`
        : `Kechirasiz, "${query}" so'rovi bo'yicha mos mutaxassis topilmadi. Boshqa kalit so'zlar bilan qidirib ko'ring.`;
      return res.json({ text, specialists: matched, ai: false });
    }

    const specialistSummary = specialists.slice(0, 60).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      city: s.city,
      experience_level: s.experience_level,
      experience: s.experience,
      skills: s.skills,
      bio: (s.bio || "").slice(0, 150),
      rating: s.rating,
      verified: s.verified,
    }));

    const systemPrompt = `Sen TalentHub HR platformasining AI kadrlar yordamchisisan. Foydalanuvchi (ish beruvchi) qanday mutaxassis kerakligini tabiiy tilda yozadi, sen mavjud mutaxassislar orasidan eng mosini topib berishing kerak.

Faqat quyidagi JSON formatda javob ber (boshqa hech narsa yozma):
{"reply": "foydalanuvchiga qisqa javob, o'zbek tilida, 1-2 gap", "matches": [{"id": <son>, "matchPercent": <0-100>, "reasons": ["qisqa sabab", "..."]}]}

Eng mos 4 tagacha mutaxassisni tanla. Agar hech kim mos kelmasa, matches bo'sh massiv bo'lsin va reply'da buni tushuntir.`;

    const userPrompt = `So'rov: "${query}"

Mavjud mutaxassislar (${specialistSummary.length} ta):
${JSON.stringify(specialistSummary, null, 0)}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    const aiMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const matches = aiMatches.map((am) => {
      const s = specialists.find((sp) => sp.id === am.id);
      if (!s) return null;
      return { ...s, matchPercent: Math.min(95, Math.max(10, am.matchPercent || 50)), matchReasons: am.reasons || [] };
    }).filter(Boolean);

    const text = parsed.reply || (matches.length
      ? `Sizning so'rovingiz bo'yicha **${matches.length} ta mutaxassis** topildi:`
      : `Kechirasiz, "${query}" so'rovi bo'yicha mos mutaxassis topilmadi.`);

    res.json({ text, specialists: matches.slice(0, 4), ai: true });
  } catch (err) {
    console.error("AI specialist search error:", err);
    try {
      const rows = db.prepare("SELECT * FROM users WHERE role = 'specialist'").all();
      const specialists = rows.map(parseSpecialist);
      const matched = clientSideSpecialistMatch(req.body.query || "", specialists);
      return res.json({ text: "Eng mos natijalar:", specialists: matched, ai: false });
    } catch {
      return res.status(500).json({ error: "Server xatoligi" });
    }
  }
});

router.post("/match-jobs", authMiddleware, async (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const vacancies = db.prepare(`
      SELECT v.*, u.name as author_name
      FROM vacancies v LEFT JOIN users u ON v.employer_id = u.id
      WHERE v.status = 'Faol'
      ORDER BY v.created_at DESC
    `).all();

    if (!vacancies.length) return res.json({ matches: [] });

    const skills = JSON.parse(user.skills || "[]");

    if (!client) {
      const matches = clientSideMatch(user, vacancies);
      return res.json({ matches, ai: false });
    }

    const vacancySummary = vacancies.slice(0, 30).map((v) => ({
      id: v.id,
      title: v.title,
      company: v.company,
      location: v.location,
      salary: v.salary,
      experience: v.experience,
      category: v.category,
      tags: JSON.parse(v.tags || "[]"),
      description: (v.description || "").slice(0, 200),
    }));

    const systemPrompt = `Sen TalentHub HR platformasining AI mutaxassisisan. Foydalanuvchining ko'nikmalari, tajribasi va afzalliklariga asosan, eng mos ish takliflarini topib berishing kerak.

Har bir natija uchun:
- matchPercent: 0-100 orasida moslik foizi
- reasons: 2-3 ta qisqa sabab (o'zbek tilida, 5-10 so'z)

Natijalarni eng mosidan kam mosga qarab tartibla. Faqat JSON formatda javob ber.`;

    const userPrompt = `Foydalanuvchi ma'lumotlari:
- Kasbi: ${user.category || "Noma'lum"}
- Ko'nikmalar: ${skills.join(", ") || "Yo'q"}
- Tajriba: ${user.experience_level || "Junior"}
- Shahar: ${user.city || "Noma'lum"}
- Bio: ${(user.bio || "").slice(0, 300)}

Mavjud ishlar (${vacancySummary.length} ta):
${JSON.stringify(vacancySummary, null, 0)}

Eng mos 6 ta ishni topib ber. Har biriga matchPercent va reasons qo'sh. Faqat JSON array qaytar: [{id, matchPercent, reasons}]`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "[]";
    let aiMatches;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      aiMatches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      aiMatches = [];
    }

    const matches = aiMatches.map((am) => {
      const vac = vacancies.find((v) => v.id === am.id);
      if (!vac) return null;
      let vacTags;
      try { vacTags = JSON.parse(vac.tags || "[]"); } catch { vacTags = []; }
      return {
        ...vac,
        tags: vacTags,
        matchPercent: Math.min(95, Math.max(10, am.matchPercent || 50)),
        reasons: am.reasons || [],
      };
    }).filter(Boolean);

    if (matches.length < 3) {
      const fallback = clientSideMatch(user, vacancies).filter((v) => !matches.find((m) => m.id === v.id));
      matches.push(...fallback.slice(0, 6 - matches.length));
    }

    res.json({ matches: matches.slice(0, 6), ai: true });
  } catch (err) {
    console.error("AI match error:", err);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    const vacancies = db.prepare("SELECT * FROM vacancies WHERE status = 'Faol' ORDER BY created_at DESC").all();
    const matches = clientSideMatch(user || {}, vacancies);
    res.json({ matches, ai: false });
  }
});

module.exports = router;
