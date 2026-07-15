const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

const VALID_TARGET_TYPES = ["vacancy", "specialist", "profile", "user", "chat", "order"];

router.post("/", authMiddleware, (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body;
    if (!target_type || !VALID_TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({ error: "Noto'g'ri shikoyat turi" });
    }
    if (!target_id || !reason || !reason.trim()) {
      return res.status(400).json({ error: "Sabab va maqsad ko'rsatilishi shart" });
    }

    const result = db.prepare(`
      INSERT INTO content_flags (target_type, target_id, reason, severity, status, auto_detected)
      VALUES (?, ?, ?, 'O''rta', 'Ko''rib chiqilmoqda', 0)
    `).run(target_type, Number(target_id), reason.trim());

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Report create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
