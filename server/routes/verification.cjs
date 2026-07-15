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

    const { document_url, document_name, institution, specialty, year, stir } = req.body;
    const type = user.role;

    if (type === "specialist") {
      if (!document_url || !document_url.trim()) {
        return res.status(400).json({ error: "Diplom yoki sertifikat havolasi kiritilishi shart" });
      }
    }
    if (type === "employer" && (!stir || !stir.trim())) {
      return res.status(400).json({ error: "STIR raqami kiritilishi shart" });
    }

    const pending = db.prepare("SELECT id FROM verification_requests WHERE user_id = ? AND status = 'Kutilmoqda'").get(req.userId);
    if (pending) return res.status(409).json({ error: "Sizda hali ko'rib chiqilayotgan so'rov mavjud" });

    const result = db.prepare(`
      INSERT INTO verification_requests (user_id, type, document_url, document_name, institution, specialty, year, stir)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, type, document_url || "", document_name || "", institution || "", specialty || "", year || 0, stir || "");

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

router.get("/admin/pending", authMiddleware, (req, res) => {
  try {
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const requests = db.prepare(`
      SELECT vr.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM verification_requests vr
      LEFT JOIN users u ON vr.user_id = u.id
      WHERE vr.status = 'Kutilmoqda'
      ORDER BY vr.created_at ASC
    `).all();
    res.json({ requests });
  } catch (err) {
    console.error("Admin pending error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/admin/all", authMiddleware, (req, res) => {
  try {
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const requests = db.prepare(`
      SELECT vr.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM verification_requests vr
      LEFT JOIN users u ON vr.user_id = u.id
      ORDER BY vr.created_at DESC
    `).all();
    res.json({ requests });
  } catch (err) {
    console.error("Admin all error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id", authMiddleware, (req, res) => {
  try {
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const { status, reject_reason } = req.body;
    if (!["Tasdiqlangan", "Rad etildi"].includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri status" });
    }

    const request = db.prepare("SELECT * FROM verification_requests WHERE id = ?").get(req.params.id);
    if (!request) return res.status(404).json({ error: "So'rov topilmadi" });

    db.prepare(`
      UPDATE verification_requests SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, reject_reason || "", req.userId, req.params.id);

    if (status === "Tasdiqlangan") {
      db.prepare("UPDATE users SET verified = 1 WHERE id = ?").run(request.user_id);
    }

    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'verification', ?, ?, '/profile')`).run(
      request.user_id,
      status === "Tasdiqlangan" ? "Verifikatsiya tasdiqlandi" : "Verifikatsiya rad etildi",
      status === "Tasdiqlangan" ? "Tabriklaymiz! Sizning hisobingiz tasdiqlandi." : `Sabab: ${reject_reason || "Ko'rsatilmagan"}`
    );

    if (req.app.get("io")) {
      req.app.get("io").to(`user_${request.user_id}`).emit("notification", {
        type: "verification",
        title: status === "Tasdiqlangan" ? "Verifikatsiya tasdiqlandi" : "Verifikatsiya rad etildi",
        description: status === "Tasdiqlangan" ? "Hisobingiz tasdiqlandi" : reject_reason || ""
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Verification review error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
