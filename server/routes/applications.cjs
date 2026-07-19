const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");
const { validateBody } = require("../middleware/validate.cjs");
const { applicationCreateSchema } = require("../schemas.cjs");

const router = express.Router();

const APPLICATION_STATUSES = ["Yuborildi", "Ko'rib chiqilmoqda", "Interview", "Qabul qilindi", "Rad etildi"];

// Mirrors src/lib/format.js's computeMatch — real skill/tag overlap, not a random or flat number.
// Returns null (not a fake default) when there isn't enough data on either side to compare.
function computeMatch(skills, tags) {
  if (!skills?.length || !tags?.length) return null;
  const lowerSkills = skills.map((s) => s.toLowerCase());
  const overlap = tags.filter((t) => lowerSkills.some((s) => s.includes(t.toLowerCase()) || t.toLowerCase().includes(s)));
  return Math.min(98, 55 + Math.round((overlap.length / tags.length) * 45));
}

router.get("/", authMiddleware, (req, res) => {
  try {
    const applications = db.prepare(`
      SELECT a.*, v.title as vacancy_title, v.company, v.company_logo, v.salary, v.location, v.format, v.experience, v.category,
             u.name as employer_name
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(req.userId);

    const stats = {
      total: applications.length,
      pending: applications.filter((a) => a.status === "Ko'rib chiqilmoqda" || a.status === "Yuborildi").length,
      interview: applications.filter((a) => a.status === "Interview").length,
      accepted: applications.filter((a) => a.status === "Qabul qilindi").length,
    };

    res.json({ applications, stats });
  } catch (err) {
    console.error("Applications list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/employer", authMiddleware, (req, res) => {
  try {
    const applications = db.prepare(`
      SELECT a.*, v.title as vacancy_title, v.id as vacancy_id_ref,
             u.name as specialist_name, u.category as specialist_category, u.avatar as specialist_avatar,
             u.rating as specialist_rating, u.reviews_count as specialist_reviews, u.experience as specialist_experience,
             u.experience_level as specialist_experience_level,
             u.orders_count as specialist_orders, u.phone as specialist_phone,
             u.social_telegram as specialist_telegram, u.email as specialist_email
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      JOIN users u ON a.user_id = u.id
      WHERE v.employer_id = ?
      ORDER BY a.created_at DESC
    `).all(req.userId).map((a) => {
      try { a.screening_answers = JSON.parse(a.screening_answers || "[]"); } catch { a.screening_answers = []; }
      return a;
    });

    res.json({ applications });
  } catch (err) {
    console.error("Employer applications error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/vacancy/:vacancyId", authMiddleware, (req, res) => {
  try {
    const vacancy = db.prepare("SELECT id, title, employer_id FROM vacancies WHERE id = ?").get(req.params.vacancyId);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    if (vacancy.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    const applications = db.prepare(`
      SELECT a.*, u.name as specialist_name, u.category as specialist_category, u.avatar as specialist_avatar,
             u.rating as specialist_rating, u.reviews_count as specialist_reviews, u.experience as specialist_experience,
             u.experience_level as specialist_experience_level,
             u.orders_count as specialist_orders, u.phone as specialist_phone,
             u.social_telegram as specialist_telegram, u.email as specialist_email
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.vacancy_id = ?
      ORDER BY a.created_at DESC
    `).all(vacancy.id).map((a) => {
      try { a.screening_answers = JSON.parse(a.screening_answers || "[]"); } catch { a.screening_answers = []; }
      return a;
    });

    res.json({ vacancy, applications });
  } catch (err) {
    console.error("Vacancy applications error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, validateBody(applicationCreateSchema), (req, res) => {
  try {
    const requester = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!requester || requester.role !== "specialist") {
      return res.status(403).json({ error: "Faqat mutaxassislar ariza yubora oladi" });
    }

    const { vacancy_id, resume_url, screening_answers, cover_letter } = req.body;
    if (!vacancy_id) return res.status(400).json({ error: "Vakansiya ID kerak" });

    const existing = db.prepare("SELECT id FROM applications WHERE vacancy_id = ? AND user_id = ?").get(vacancy_id, req.userId);
    if (existing) return res.status(409).json({ error: "Siz allaqachon ariza yuborgansiz" });

    const specialist = db.prepare("SELECT skills FROM users WHERE id = ?").get(req.userId);
    const vacancy = db.prepare("SELECT tags FROM vacancies WHERE id = ?").get(vacancy_id);
    let specialistSkills = [];
    let vacancyTags = [];
    try { specialistSkills = JSON.parse(specialist?.skills || "[]"); } catch { specialistSkills = []; }
    try { vacancyTags = JSON.parse(vacancy?.tags || "[]"); } catch { vacancyTags = []; }
    const matchPercent = computeMatch(specialistSkills, vacancyTags);

    const result = db.prepare("INSERT INTO applications (vacancy_id, user_id, status, match_percent, resume_url, screening_answers, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      vacancy_id, req.userId, "Yuborildi", matchPercent, resume_url || "", JSON.stringify(screening_answers || []), cover_letter || ""
    );

    const application = db.prepare(`
      SELECT a.*, v.title as vacancy_title, v.company, v.salary, v.location, v.employer_id
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    if (application.employer_id) {
      const specialist = db.prepare("SELECT name FROM users WHERE id = ?").get(req.userId);
      db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'application', 'Yangi ariza', ?, '/applications')`).run(
        application.employer_id, `${specialist?.name || "Nomzod"} "${application.vacancy_title}" vakansiyasiga ariza yubordi`
      );
      if (req.app.get("io")) {
        req.app.get("io").to(`user_${application.employer_id}`).emit("notification", {
          type: "application", title: "Yangi ariza", description: `${specialist?.name || "Nomzod"} "${application.vacancy_title}" vakansiyasiga ariza yubordi`
        });
      }
    }

    res.json({ application });
  } catch (err) {
    console.error("Application create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id/status", authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri status qiymati" });
    }

    const application = db.prepare(`
      SELECT a.*, v.employer_id FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!application) return res.status(404).json({ error: "Ariza topilmadi" });
    if (application.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);

    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'application', 'Ariza yangilandi', ?, '/applications')`).run(
      application.user_id, `Arizangiz holati "${status}" ga o'zgartirildi`
    );

    if (req.app.get("io")) {
      req.app.get("io").to(`user_${application.user_id}`).emit("notification", {
        type: "application", title: "Ariza yangilandi", description: `Arizangiz holati "${status}" ga o'zgartirildi`
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Application update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const application = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
    if (!application) return res.status(404).json({ error: "Ariza topilmadi" });
    if (application.user_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Application delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
