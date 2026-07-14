const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");
const { requireAdmin } = require("../middleware/requireAdmin.cjs");

const router = express.Router();

function logAdmin(adminId, action, targetType, targetId, details) {
  try {
    db.prepare(`INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`)
      .run(adminId, action, targetType || "", targetId || null, details || "");
  } catch (e) {
    console.error("Admin log error:", e);
  }
}

router.get("/stats", authMiddleware, requireAdmin, (req, res) => {
  try {
    const users_total = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const specialists = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='specialist'").get().c;
    const employers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='employer'").get().c;
    const admins = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='admin'").get().c;
    const vacancies_total = db.prepare("SELECT COUNT(*) as c FROM vacancies").get().c;
    const vacancies_active = db.prepare("SELECT COUNT(*) as c FROM vacancies WHERE status='Faol'").get().c;
    const orders_total = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
    const orders_active = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('Yangi','Qabul qilindi','Jarayonda')").get().c;
    const orders_completed = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='Tugatildi'").get().c;
    const applications_total = db.prepare("SELECT COUNT(*) as c FROM applications").get().c;
    const messages_total = db.prepare("SELECT COUNT(*) as c FROM messages").get().c;
    const new_users_7d = db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now','-7 days')").get().c;

    res.json({ users_total, specialists, employers, admins, vacancies_total, vacancies_active, orders_total, orders_active, orders_completed, applications_total, messages_total, new_users_7d });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/users", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    let sql = `SELECT id,name,email,phone,city,role,verified,blocked,blocked_reason,rating,reviews_count,orders_count,created_at FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    if (status === "blocked") {
      sql += ` AND blocked = 1`;
    } else if (status === "active") {
      sql += ` AND blocked = 0`;
    }

    const countSql = sql.replace("SELECT id,name,email,phone,city,role,verified,blocked,blocked_reason,rating,reviews_count,orders_count,created_at", "SELECT COUNT(*) as total");
    const total = db.prepare(countSql).get(...params).total;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const users = db.prepare(sql).all(...params);
    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const VALID_ROLES = ["specialist", "employer", "admin"];

router.patch("/users/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const isSelf = targetId === req.userId;

    const target = db.prepare("SELECT id, role, name FROM users WHERE id = ?").get(targetId);
    if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const { verified, blocked, blocked_reason, rating, reviews_count, role, name, phone, city } = req.body;

    if (isSelf && (blocked !== undefined || role !== undefined)) {
      return res.status(400).json({ error: "O'zingizni bloklay yoki rolingizni o'zgartira olmaysiz" });
    }
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    if (rating !== undefined && (Number(rating) < 0 || Number(rating) > 5)) {
      return res.status(400).json({ error: "Reyting 0-5 orasida bo'lishi kerak" });
    }
    if (reviews_count !== undefined && Number(reviews_count) < 0) {
      return res.status(400).json({ error: "Sharhlar soni manfiy bo'lishi mumkin emas" });
    }

    const sets = [];
    const params = [];
    const logDetails = [];

    if (verified !== undefined) { sets.push("verified = ?"); params.push(verified ? 1 : 0); logDetails.push(`verified=${verified ? 1 : 0}`); }
    if (blocked !== undefined) { sets.push("blocked = ?"); params.push(blocked ? 1 : 0); logDetails.push(`blocked=${blocked ? 1 : 0}`); }
    if (blocked_reason !== undefined) { sets.push("blocked_reason = ?"); params.push(blocked_reason); }
    if (rating !== undefined) { sets.push("rating = ?"); params.push(Number(rating)); logDetails.push(`rating=${rating}`); }
    if (reviews_count !== undefined) { sets.push("reviews_count = ?"); params.push(Number(reviews_count)); logDetails.push(`reviews_count=${reviews_count}`); }
    if (role !== undefined) { sets.push("role = ?"); params.push(role); logDetails.push(`role=${role}`); }
    if (name !== undefined && name.trim()) { sets.push("name = ?"); params.push(name.trim()); }
    if (phone !== undefined) { sets.push("phone = ?"); params.push(phone); }
    if (city !== undefined) { sets.push("city = ?"); params.push(city); }

    if (sets.length === 0) return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });

    params.push(targetId);
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    logAdmin(req.userId, "user_update", "user", targetId, `${target.name}: ${logDetails.join(", ")}`);

    const user = db.prepare("SELECT id,name,email,role,verified,blocked,blocked_reason,rating,reviews_count,phone,city FROM users WHERE id = ?").get(targetId);
    res.json({ user });
  } catch (err) {
    console.error("Admin user update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/vacancies", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT v.*, u.name as author_name,
        (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as applications_count
      FROM vacancies v LEFT JOIN users u ON v.employer_id = u.id WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (v.title LIKE ? OR v.company LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND v.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY v.created_at DESC`;
    const vacancies = db.prepare(sql).all(...params).map((v) => ({
      ...v, tags: JSON.parse(v.tags), requirements: JSON.parse(v.requirements), conditions: JSON.parse(v.conditions),
    }));

    res.json({ vacancies });
  } catch (err) {
    console.error("Admin vacancies list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/vacancies/:id/status", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare("UPDATE vacancies SET status = ? WHERE id = ?").run(status, req.params.id);
    logAdmin(req.userId, "vacancy_status", "vacancy", req.params.id, `status=${status}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin vacancy status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/vacancies/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const vacancy = db.prepare("SELECT id, title FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    db.prepare("DELETE FROM applications WHERE vacancy_id = ?").run(req.params.id);
    db.prepare("DELETE FROM vacancies WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "vacancy_delete", "vacancy", req.params.id, vacancy.title);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin vacancy delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/orders", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT o.*, e.name as employer_name, s.name as specialist_name
      FROM orders o
      LEFT JOIN users e ON o.employer_id = e.id
      LEFT JOIN users s ON o.specialist_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND o.status = ?`; params.push(status); }
    sql += ` ORDER BY o.created_at DESC`;
    const orders = db.prepare(sql).all(...params);
    res.json({ orders });
  } catch (err) {
    console.error("Admin orders list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/applications", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT a.*, v.title as vacancy_title, u.name as specialist_name, u.email as specialist_email
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (v.title LIKE ? OR u.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY a.created_at DESC`;
    const applications = db.prepare(sql).all(...params);
    res.json({ applications });
  } catch (err) {
    console.error("Admin applications list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/applications/:id/status", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const application = db.prepare("SELECT id, user_id FROM applications WHERE id = ?").get(req.params.id);
    if (!application) return res.status(404).json({ error: "Ariza topilmadi" });

    db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
    logAdmin(req.userId, "application_status", "application", req.params.id, `status=${status}`);

    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'application', 'Ariza yangilandi', ?, '/applications')`).run(
      application.user_id, `Administrator arizangiz holatini "${status}" ga o'zgartirdi`
    );
    if (req.app.get("io")) {
      req.app.get("io").to(`user_${application.user_id}`).emit("notification", {
        type: "application", title: "Ariza yangilandi", description: `Holat: "${status}"`
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin application status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/applications/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const application = db.prepare("SELECT id FROM applications WHERE id = ?").get(req.params.id);
    if (!application) return res.status(404).json({ error: "Ariza topilmadi" });
    db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "application_delete", "application", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin application delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/logs", authMiddleware, requireAdmin, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, a.name as admin_name
      FROM admin_logs l
      LEFT JOIN users a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 200
    `).all();
    res.json({ logs });
  } catch (err) {
    console.error("Admin logs error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
