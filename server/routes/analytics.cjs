const express = require("express");
const db = require("../db.cjs");
const { optionalAuthMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

const MAX_PATH_LENGTH = 500;

router.post("/track", optionalAuthMiddleware, (req, res) => {
  try {
    const path = String(req.body?.path || "").slice(0, MAX_PATH_LENGTH);
    if (!path) return res.status(400).json({ error: "path kerak" });

    db.prepare("INSERT INTO analytics_events (path, user_id) VALUES (?, ?)").run(path, req.userId || null);
    res.status(204).end();
  } catch (err) {
    console.error("Analytics track error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
