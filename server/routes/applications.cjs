const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

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
             u.orders_count as specialist_orders
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      JOIN users u ON a.user_id = u.id
      WHERE v.employer_id = ?
      ORDER BY a.created_at DESC
    `).all(req.userId);

    res.json({ applications });
  } catch (err) {
    console.error("Employer applications error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, (req, res) => {
  try {
    const { vacancy_id } = req.body;
    if (!vacancy_id) return res.status(400).json({ error: "Vakansiya ID kerak" });

    const existing = db.prepare("SELECT id FROM applications WHERE vacancy_id = ? AND user_id = ?").get(vacancy_id, req.userId);
    if (existing) return res.status(409).json({ error: "Siz allaqachon ariza yuborgansiz" });

    const matchPercent = Math.floor(60 + Math.random() * 35);

    const result = db.prepare("INSERT INTO applications (vacancy_id, user_id, status, match_percent) VALUES (?, ?, ?, ?)").run(vacancy_id, req.userId, "Ko'rib chiqilmoqda", matchPercent);

    const application = db.prepare(`
      SELECT a.*, v.title as vacancy_title, v.company, v.salary, v.location
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.json({ application });
  } catch (err) {
    console.error("Application create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id/status", authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Application update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
