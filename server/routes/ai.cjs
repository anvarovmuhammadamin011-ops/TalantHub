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

    return { ...v, matchPercent, reasons: reasons.slice(0, 3) };
  }).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 6);
}

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
      return {
        ...vac,
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
