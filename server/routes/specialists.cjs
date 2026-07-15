const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const { search, city, field, category } = req.query;

    let sql = `SELECT * FROM users WHERE role = 'specialist' AND 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR category LIKE ? OR skills LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (city) {
      sql += ` AND city = ?`;
      params.push(city);
    }
    if (field) {
      sql += ` AND fields LIKE ?`;
      params.push(`%${field}%`);
    }
    if (category) {
      sql += ` AND categories LIKE ?`;
      params.push(`%${category}%`);
    }

    sql += ` ORDER BY featured DESC, rating DESC, name ASC`;

    const specialists = db.prepare(sql).all(...params).map((s) => {
      const { password, ...safe } = s;
      safe.fields = JSON.parse(safe.fields);
      safe.categories = JSON.parse(safe.categories);
      safe.skills = JSON.parse(safe.skills);
      return safe;
    });

    res.json({ specialists, total: specialists.length });
  } catch (err) {
    console.error("Specialists list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'specialist'").get(req.params.id);
    if (!user) return res.status(404).json({ error: "Mutaxassis topilmadi" });

    const { password, ...safe } = user;
    safe.fields = JSON.parse(safe.fields);
    safe.categories = JSON.parse(safe.categories);
    safe.skills = JSON.parse(safe.skills);
    safe.certificates = JSON.parse(safe.certificates);
    safe.timeline = JSON.parse(safe.timeline);

    res.json({ specialist: safe });
  } catch (err) {
    console.error("Specialist detail error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/me/profile", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
