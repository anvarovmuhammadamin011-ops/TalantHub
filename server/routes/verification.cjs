const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.post("/", authMiddleware, (req, res) => {
  try {
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!user || (user.role !== "specialist" && user.role !== "employer")) {
      return res.status(403).json({ error: "Faqat mutaxassis yoki ish beruvchilar verifikatsiya so'rashi mumkin" });
    }

    const { document_url, document_name, stir } = req.body;
    const type = user.role;

    if (type === "specialist" && (!document_url || !document_url.trim())) {
      return res.status(400).json({ error: "Diplom yoki sertifikat havolasi kiritilishi shart" });
    }
    if (type === "employer" && (!stir || !stir.trim())) {
      return res.status(400).json({ error: "STIR raqami kiritilishi shart" });
    }

    const pending = db.prepare("SELECT id FROM verification_requests WHERE user_id = ? AND status = 'Kutilmoqda'").get(req.userId);
    if (pending) return res.status(409).json({ error: "Sizda hali ko'rib chiqilayotgan so'rov mavjud" });

    const result = db.prepare(`
      INSERT INTO verification_requests (user_id, type, document_url, document_name, stir)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, type, document_url || "", document_name || "", stir || "");

    const request = db.prepare("SELECT * FROM verification_requests WHERE id = ?").get(result.lastInsertRowid);
    res.json({ request });
  } catch (err) {
    console.error("Verification create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/mine", authMiddleware, (req, res) => {
  try {
    const requests = db.prepare("SELECT * FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC").all(req.userId);
    res.json({ requests });
  } catch (err) {
    console.error("Verification list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
