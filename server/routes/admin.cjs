const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");
const { requireAdmin } = require("../middleware/requireAdmin.cjs");

const router = express.Router();

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

router.patch("/users/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    if (Number(req.params.id) === req.userId) {
      return res.status(400).json({ error: "O'zingizni bloklay olmaysiz" });
    }

    const { verified, blocked, blocked_reason } = req.body;
    const sets = [];
    const params = [];

    if (verified !== undefined) { sets.push("verified = ?"); params.push(verified ? 1 : 0); }
    if (blocked !== undefined) { sets.push("blocked = ?"); params.push(blocked ? 1 : 0); }
    if (blocked_reason !== undefined) { sets.push("blocked_reason = ?"); params.push(blocked_reason); }

    if (sets.length === 0) return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });

    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    const user = db.prepare("SELECT id,name,email,role,verified,blocked,blocked_reason FROM users WHERE id = ?").get(req.params.id);
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
    res.json({ success: true });
  } catch (err) {
    console.error("Admin vacancy status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/vacancies/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const vacancy = db.prepare("SELECT id FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    db.prepare("DELETE FROM applications WHERE vacancy_id = ?").run(req.params.id);
    db.prepare("DELETE FROM vacancies WHERE id = ?").run(req.params.id);
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

module.exports = router;
