const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const { search, location, format, experience, category } = req.query;

    let sql = `
      SELECT v.*, u.name as author_name
      FROM vacancies v
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (v.title LIKE ? OR v.company LIKE ? OR v.tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      sql += ` AND v.location LIKE ?`;
      params.push(`%${location}%`);
    }
    if (format) {
      sql += ` AND v.format = ?`;
      params.push(format);
    }
    if (experience) {
      sql += ` AND v.experience = ?`;
      params.push(experience);
    }
    if (category) {
      sql += ` AND v.category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY v.created_at DESC`;

    const vacancies = db.prepare(sql).all(...params).map((v) => ({
      ...v,
      tags: JSON.parse(v.tags),
      requirements: JSON.parse(v.requirements),
      conditions: JSON.parse(v.conditions),
    }));

    res.json({ vacancies, total: vacancies.length });
  } catch (err) {
    console.error("Vacancies list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const vacancy = db.prepare(`
      SELECT v.*, u.name as author_name, u.id as author_id
      FROM vacancies v
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });

    vacancy.tags = JSON.parse(vacancy.tags);
    vacancy.requirements = JSON.parse(vacancy.requirements);
    vacancy.conditions = JSON.parse(vacancy.conditions);

    res.json({ vacancy });
  } catch (err) {
    console.error("Vacancy detail error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, (req, res) => {
  try {
    const { title, company, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "Sarlavha va kompaniya majburiy" });
    }

    const stmt = db.prepare(`
      INSERT INTO vacancies (title, company, company_logo, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions, employer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title, company, "🏢",
      location || "", salary || "",
      salary_min || 0, salary_max || 0,
      format || "Ofis", experience || "Junior",
      category || "IT",
      JSON.stringify(tags || []),
      description || "",
      JSON.stringify(requirements || []),
      JSON.stringify(conditions || []),
      req.userId
    );

    const vacancy = db.prepare("SELECT * FROM vacancies WHERE id = ?").get(result.lastInsertRowid);
    vacancy.tags = JSON.parse(vacancy.tags);
    vacancy.requirements = JSON.parse(vacancy.requirements);
    vacancy.conditions = JSON.parse(vacancy.conditions);

    res.json({ vacancy });
  } catch (err) {
    console.error("Vacancy create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const vacancy = db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    if (vacancy.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    db.prepare("DELETE FROM applications WHERE vacancy_id = ?").run(req.params.id);
    db.prepare("DELETE FROM vacancies WHERE id = ?").run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Vacancy delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
