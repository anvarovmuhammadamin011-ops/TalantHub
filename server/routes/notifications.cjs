const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.userId);

    const unread = notifications.filter((n) => !n.read).length;

    res.json({ notifications, unread });
  } catch (err) {
    console.error("Notifications list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id/read", authMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/read-all", authMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
