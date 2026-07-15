const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.post("/", authMiddleware, (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Mavzu kiritilishi shart" });
    }

    const result = db.prepare(`
      INSERT INTO support_tickets (user_id, subject, message, status)
      VALUES (?, ?, ?, 'Ochiq')
    `).run(req.userId, subject.trim(), (message || "").trim());

    const ticket = db.prepare("SELECT * FROM support_tickets WHERE id = ?").get(result.lastInsertRowid);
    res.json({ ticket });
  } catch (err) {
    console.error("Support ticket create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/mine", authMiddleware, (req, res) => {
  try {
    const tickets = db.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
    res.json({ tickets });
  } catch (err) {
    console.error("Support tickets list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
