const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  try {
    const searches = db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM saved_search_matches m WHERE m.saved_search_id = s.id) as match_count
      FROM saved_searches s
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.userId);

    res.json({ searches });
  } catch (err) {
    console.error("Saved searches list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, (req, res) => {
  try {
    const { name, query, category, location, format, experience } = req.body;
    if (!query && !category && !location && !format && !experience) {
      return res.status(400).json({ error: "Kamida bitta qidiruv shart topilishi kerak" });
    }

    const result = db.prepare(`
      INSERT INTO saved_searches (user_id, name, query, category, location, format, experience)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, name || "", query || "", category || "", location || "", format || "", experience || "");

    const search = db.prepare("SELECT *, 0 as match_count FROM saved_searches WHERE id = ?").get(result.lastInsertRowid);
    res.json({ search });
  } catch (err) {
    console.error("Saved search create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const search = db.prepare("SELECT * FROM saved_searches WHERE id = ?").get(req.params.id);
    if (!search) return res.status(404).json({ error: "Topilmadi" });
    if (search.user_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    db.prepare("DELETE FROM saved_search_matches WHERE saved_search_id = ?").run(req.params.id);
    db.prepare("DELETE FROM saved_searches WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Saved search delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
