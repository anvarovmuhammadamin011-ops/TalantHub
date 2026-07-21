const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, city, field, category } = req.query;

    let sql = `SELECT * FROM users WHERE role = 'specialist' AND 1=1`;
    const params = [];

    // ILIKE, not LIKE — Postgres's LIKE is case-sensitive by default (SQLite's isn't for
    // ASCII), and this is user-facing search matching that needs to stay case-insensitive.
    if (search) {
      sql += ` AND (name ILIKE ? OR category ILIKE ? OR skills ILIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (city) {
      sql += ` AND city = ?`;
      params.push(city);
    }
    if (field) {
      sql += ` AND fields ILIKE ?`;
      params.push(`%${field}%`);
    }
    if (category) {
      sql += ` AND categories ILIKE ?`;
      params.push(`%${category}%`);
    }

    sql += ` ORDER BY featured DESC, rating DESC, name ASC`;

    const specialists = (await db.prepare(sql).all(...params)).map((s) => {
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

router.get("/:id", async (req, res) => {
  try {
    const user = await db.prepare("SELECT * FROM users WHERE id = ? AND role = 'specialist'").get(req.params.id);
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

module.exports = router;
