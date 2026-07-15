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

// ---------- Dashboard: health ----------
router.get("/health", authMiddleware, requireAdmin, (req, res) => {
  try {
    const start = Date.now();
    db.prepare("SELECT 1").get();
    const dbLatencyMs = Date.now() - start;
    const errors24h = db.prepare(
      "SELECT COUNT(*) as c FROM sms_logs WHERE status != 'Yetkazildi' AND created_at >= datetime('now','-1 day')"
    ).get().c;

    res.json({
      status: "ok",
      db_latency_ms: dbLatencyMs,
      uptime_seconds: Math.round(process.uptime()),
      node_version: process.version,
      sms_errors_24h: errors24h,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Admin health error:", err);
    res.status(500).json({ status: "error", error: "Server xatoligi" });
  }
});

// ---------- Foydalanuvchilar: sessions ----------
router.get("/sessions", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    let sql = `
      SELECT l.id, l.user_id, l.ip, l.user_agent, l.created_at, u.name as user_name, u.email as user_email, u.role as user_role
      FROM login_events l JOIN users u ON l.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ` ORDER BY l.created_at DESC LIMIT ?`;
    params.push(Number(limit));
    const sessions = db.prepare(sql).all(...params);
    res.json({ sessions });
  } catch (err) {
    console.error("Admin sessions error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Moderatsiya: shikoyatlar / flaglar ----------
router.get("/flags", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status, severity } = req.query;
    let sql = `SELECT f.*, r.name as reviewed_by_name FROM content_flags f LEFT JOIN users r ON f.reviewed_by = r.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ` AND f.status = ?`; params.push(status); }
    if (severity) { sql += ` AND f.severity = ?`; params.push(severity); }
    sql += ` ORDER BY f.created_at DESC`;
    const flags = db.prepare(sql).all(...params);
    res.json({ flags });
  } catch (err) {
    console.error("Admin flags list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/flags/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status, severity } = req.body;
    const flag = db.prepare("SELECT id FROM content_flags WHERE id = ?").get(req.params.id);
    if (!flag) return res.status(404).json({ error: "Shikoyat topilmadi" });

    const sets = ["reviewed_by = ?"];
    const params = [req.userId];
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (severity !== undefined) { sets.push("severity = ?"); params.push(severity); }
    params.push(req.params.id);

    db.prepare(`UPDATE content_flags SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    logAdmin(req.userId, "flag_update", "content_flag", req.params.id, `status=${status || ""}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin flag update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/flags/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM content_flags WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "flag_delete", "content_flag", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin flag delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Operatsiyalar: nizolar ----------
router.get("/disputes", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT d.*, o.title as order_title, o.price as order_price, u.name as opened_by_name, r.name as resolved_by_name
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN users u ON d.opened_by = u.id
      LEFT JOIN users r ON d.resolved_by = r.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND d.status = ?`; params.push(status); }
    sql += ` ORDER BY d.created_at DESC`;
    const disputes = db.prepare(sql).all(...params);
    res.json({ disputes });
  } catch (err) {
    console.error("Admin disputes list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/disputes/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status, resolution } = req.body;
    const dispute = db.prepare("SELECT * FROM disputes WHERE id = ?").get(req.params.id);
    if (!dispute) return res.status(404).json({ error: "Nizo topilmadi" });

    const sets = ["updated_at = CURRENT_TIMESTAMP"];
    const params = [];
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (resolution !== undefined) { sets.push("resolution = ?"); params.push(resolution); }
    if (status && status !== "Ochiq") { sets.push("resolved_by = ?"); params.push(req.userId); }
    params.push(req.params.id);

    db.prepare(`UPDATE disputes SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    logAdmin(req.userId, "dispute_update", "dispute", req.params.id, `status=${status || ""}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin dispute update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Operatsiyalar: support ----------
router.get("/support", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM support_tickets s JOIN users u ON s.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND s.status = ?`; params.push(status); }
    sql += ` ORDER BY s.created_at DESC`;
    const tickets = db.prepare(sql).all(...params);
    res.json({ tickets });
  } catch (err) {
    console.error("Admin support list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/support/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status, response } = req.body;
    const ticket = db.prepare("SELECT * FROM support_tickets WHERE id = ?").get(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Murojaat topilmadi" });

    const sets = ["updated_at = CURRENT_TIMESTAMP", "handled_by = ?"];
    const params = [req.userId];
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (response !== undefined) { sets.push("response = ?"); params.push(response); }
    params.push(req.params.id);

    db.prepare(`UPDATE support_tickets SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    if (response) {
      db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'info', 'Support javob berdi', ?, '/profile')`).run(
        ticket.user_id, `"${ticket.subject}" bo'yicha javob keldi`
      );
      if (req.app.get("io")) {
        req.app.get("io").to(`user_${ticket.user_id}`).emit("notification", {
          type: "info", title: "Support javob berdi", description: `"${ticket.subject}" bo'yicha javob keldi`
        });
      }
    }

    logAdmin(req.userId, "support_update", "support_ticket", req.params.id, `status=${status || ""}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin support update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Marketing: broadcast ----------
router.post("/broadcast", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { title, description, link, audience } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Sarlavha kiritilishi shart" });

    let targets;
    if (audience === "specialist" || audience === "employer") {
      targets = db.prepare("SELECT id FROM users WHERE role = ?").all(audience);
    } else {
      targets = db.prepare("SELECT id FROM users WHERE role != 'admin'").all();
    }

    const insertNotif = db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'broadcast', ?, ?, ?)`);
    const insertPush = db.prepare(`INSERT INTO push_logs (user_id, title, body, status) VALUES (?, ?, ?, 'Yuborildi')`);

    const run = db.transaction((rows) => {
      for (const t of rows) {
        insertNotif.run(t.id, title.trim(), description || "", link || "");
        insertPush.run(t.id, title.trim(), description || "");
      }
    });
    run(targets);

    if (req.app.get("io")) {
      for (const t of targets) {
        req.app.get("io").to(`user_${t.id}`).emit("notification", { type: "broadcast", title: title.trim(), description: description || "" });
      }
    }

    logAdmin(req.userId, "broadcast_send", "broadcast", null, `audience=${audience || "all"}, recipients=${targets.length}, title=${title.trim()}`);
    res.json({ success: true, recipients: targets.length });
  } catch (err) {
    console.error("Admin broadcast error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Marketing: promo kodlar ----------
router.get("/promo", authMiddleware, requireAdmin, (req, res) => {
  try {
    const promos = db.prepare(`
      SELECT p.*, t.name as tariff_name FROM promo_codes p LEFT JOIN tariffs t ON p.tariff_id = t.id ORDER BY p.created_at DESC
    `).all();
    res.json({ promos });
  } catch (err) {
    console.error("Admin promo list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/promo", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { code, discount_percent, max_uses, tariff_id, expires_at } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: "Kod kiritilishi shart" });

    const result = db.prepare(`
      INSERT INTO promo_codes (code, discount_percent, max_uses, tariff_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(code.trim().toUpperCase(), Number(discount_percent) || 10, Number(max_uses) || 100, tariff_id || null, expires_at || null);

    logAdmin(req.userId, "promo_create", "promo_code", result.lastInsertRowid, code.trim().toUpperCase());
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin promo create error:", err);
    if (String(err.message || "").includes("UNIQUE")) return res.status(409).json({ error: "Bu kod allaqachon mavjud" });
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/promo/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { active, discount_percent, max_uses, expires_at } = req.body;
    const sets = [];
    const params = [];
    if (active !== undefined) { sets.push("active = ?"); params.push(active ? 1 : 0); }
    if (discount_percent !== undefined) { sets.push("discount_percent = ?"); params.push(Number(discount_percent)); }
    if (max_uses !== undefined) { sets.push("max_uses = ?"); params.push(Number(max_uses)); }
    if (expires_at !== undefined) { sets.push("expires_at = ?"); params.push(expires_at); }
    if (sets.length === 0) return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });
    params.push(req.params.id);
    db.prepare(`UPDATE promo_codes SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    logAdmin(req.userId, "promo_update", "promo_code", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin promo update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/promo/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM promo_codes WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "promo_delete", "promo_code", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin promo delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Sozlamalar: kategoriyalar ----------
router.get("/categories", authMiddleware, requireAdmin, (req, res) => {
  try {
    const categories = db.prepare("SELECT * FROM categories ORDER BY group_name, sort_order, name").all();
    res.json({ categories });
  } catch (err) {
    console.error("Admin categories list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/categories", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { group_name, name } = req.body;
    if (!group_name || !name || !name.trim()) return res.status(400).json({ error: "Guruh va nom kiritilishi shart" });
    const result = db.prepare("INSERT INTO categories (group_name, name) VALUES (?, ?)").run(group_name, name.trim());
    logAdmin(req.userId, "category_create", "category", result.lastInsertRowid, `${group_name}: ${name.trim()}`);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin category create error:", err);
    if (String(err.message || "").includes("UNIQUE")) return res.status(409).json({ error: "Bu kategoriya allaqachon mavjud" });
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/categories/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { active, name } = req.body;
    const sets = [];
    const params = [];
    if (active !== undefined) { sets.push("active = ?"); params.push(active ? 1 : 0); }
    if (name !== undefined && name.trim()) { sets.push("name = ?"); params.push(name.trim()); }
    if (sets.length === 0) return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });
    params.push(req.params.id);
    db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    logAdmin(req.userId, "category_update", "category", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin category update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/categories/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "category_delete", "category", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin category delete error:", err);
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

router.get("/finance/transactions", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { method, status, period, page = 1, limit = 50 } = req.query;
    let sql = `SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE 1=1`;
    const params = [];
    if (method) { sql += ` AND t.method = ?`; params.push(method); }
    if (status) { sql += ` AND t.status = ?`; params.push(status); }
    if (period === "today") { sql += ` AND t.created_at >= date('now')`; }
    else if (period === "week") { sql += ` AND t.created_at >= datetime('now','-7 days')`; }
    else if (period === "month") { sql += ` AND t.created_at >= datetime('now','-30 days')`; }
    const countSql = sql.replace("SELECT t.*, u.name as user_name, u.email as user_email", "SELECT COUNT(*) as total");
    const total = db.prepare(countSql).get(...params).total;
    sql += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const transactions = db.prepare(sql).all(...params);
    res.json({ transactions, total });
  } catch (err) {
    console.error("Admin finance transactions error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/finance/stats", authMiddleware, requireAdmin, (req, res) => {
  try {
    const total_income = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE status='Tasdiqlangan' AND type='tolov'").get().v;
    const total_commission = db.prepare("SELECT COALESCE(SUM(commission),0) as v FROM transactions WHERE status='Tasdiqlangan'").get().v;
    const total_refunds = db.prepare("SELECT COALESCE(SUM(refund),0) as v FROM transactions WHERE refund > 0").get().v;
    const today_income = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE status='Tasdiqlangan' AND created_at >= date('now')").get().v;
    const month_income = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE status='Tasdiqlangan' AND created_at >= datetime('now','-30 days')").get().v;
    const transactions_count = db.prepare("SELECT COUNT(*) as c FROM transactions").get().c;
    const payme_count = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE method='Payme'").get().c;
    const click_count = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE method='Click'").get().c;

    const daily = db.prepare(`
      SELECT date(created_at) as day, SUM(amount) as income, SUM(commission) as commission
      FROM transactions WHERE status='Tasdiqlangan' AND created_at >= datetime('now','-30 days')
      GROUP BY date(created_at) ORDER BY day
    `).all();

    res.json({ total_income, total_commission, total_refunds, today_income, month_income, transactions_count, payme_count, click_count, daily });
  } catch (err) {
    console.error("Admin finance stats error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/finance/transactions/:id/refund", authMiddleware, requireAdmin, (req, res) => {
  try {
    const tx = db.prepare("SELECT id, amount FROM transactions WHERE id = ?").get(req.params.id);
    if (!tx) return res.status(404).json({ error: "Tranzaksiya topilmadi" });
    db.prepare("UPDATE transactions SET refund = amount, status = 'Qaytarildi' WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "refund", "transaction", req.params.id, `amount=${tx.amount}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin refund error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/tariffs", authMiddleware, requireAdmin, (req, res) => {
  try {
    const tariffs = db.prepare("SELECT * FROM tariffs ORDER BY price ASC").all().map((t) => ({ ...t, features: JSON.parse(t.features) }));
    res.json({ tariffs });
  } catch (err) {
    console.error("Admin tariffs error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/tariffs", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, price, duration_days, max_vacancies, max_contacts, features } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: "Nomi va narxi majburiy" });
    const result = db.prepare("INSERT INTO tariffs (name, price, duration_days, max_vacancies, max_contacts, features) VALUES (?, ?, ?, ?, ?, ?)").run(
      name, Number(price), Number(duration_days) || 30, Number(max_vacancies) || 3, Number(max_contacts) || 10, JSON.stringify(features || [])
    );
    logAdmin(req.userId, "tariff_create", "tariff", result.lastInsertRowid, name);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin tariff create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/tariffs/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { name, price, duration_days, max_vacancies, max_contacts, features, active } = req.body;
    const sets = [], params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name); }
    if (price !== undefined) { sets.push("price = ?"); params.push(Number(price)); }
    if (duration_days !== undefined) { sets.push("duration_days = ?"); params.push(Number(duration_days)); }
    if (max_vacancies !== undefined) { sets.push("max_vacancies = ?"); params.push(Number(max_vacancies)); }
    if (max_contacts !== undefined) { sets.push("max_contacts = ?"); params.push(Number(max_contacts)); }
    if (features !== undefined) { sets.push("features = ?"); params.push(JSON.stringify(features)); }
    if (active !== undefined) { sets.push("active = ?"); params.push(active ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ error: "Maydon topilmadi" });
    params.push(req.params.id);
    db.prepare(`UPDATE tariffs SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    logAdmin(req.userId, "tariff_update", "tariff", req.params.id, sets.join(", "));
    res.json({ success: true });
  } catch (err) {
    console.error("Admin tariff update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/tariffs/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM tariffs WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "tariff_delete", "tariff", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin tariff delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/promos", authMiddleware, requireAdmin, (req, res) => {
  try {
    const promos = db.prepare(`
      SELECT p.*, t.name as tariff_name
      FROM promo_codes p LEFT JOIN tariffs t ON p.tariff_id = t.id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ promos });
  } catch (err) {
    console.error("Admin promos error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/promos", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { code, discount_percent, max_uses, tariff_id, expires_at } = req.body;
    if (!code) return res.status(400).json({ error: "Kod majburiy" });
    const result = db.prepare("INSERT INTO promo_codes (code, discount_percent, max_uses, tariff_id, expires_at) VALUES (?, ?, ?, ?, ?)").run(
      code.toUpperCase(), Number(discount_percent) || 10, Number(max_uses) || 100, tariff_id || null, expires_at || null
    );
    logAdmin(req.userId, "promo_create", "promo", result.lastInsertRowid, code.toUpperCase());
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin promo create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/promos/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { active } = req.body;
    db.prepare("UPDATE promo_codes SET active = ? WHERE id = ?").run(active ? 1 : 0, req.params.id);
    logAdmin(req.userId, "promo_update", "promo", req.params.id, `active=${active}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin promo update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/promos/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM promo_codes WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "promo_delete", "promo", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin promo delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/sms", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status, provider } = req.query;
    let sql = "SELECT * FROM sms_logs WHERE 1=1";
    const params = [];
    if (status) { sql += ` AND status = ?`; params.push(status); }
    if (provider) { sql += ` AND provider = ?`; params.push(provider); }
    sql += " ORDER BY created_at DESC LIMIT 200";
    const logs = db.prepare(sql).all(...params);
    const stats = {
      total: db.prepare("SELECT COUNT(*) as c FROM sms_logs").get().c,
      delivered: db.prepare("SELECT COUNT(*) as c FROM sms_logs WHERE delivered = 1").get().c,
      failed: db.prepare("SELECT COUNT(*) as c FROM sms_logs WHERE status = 'Xatolik'").get().c,
      total_cost: db.prepare("SELECT COALESCE(SUM(cost),0) as v FROM sms_logs").get().v,
    };
    res.json({ logs, stats });
  } catch (err) {
    console.error("Admin SMS error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/push", authMiddleware, requireAdmin, (req, res) => {
  try {
    const logs = db.prepare("SELECT * FROM push_logs ORDER BY created_at DESC LIMIT 200").all();
    const stats = {
      total: db.prepare("SELECT COUNT(*) as c FROM push_logs").get().c,
      clicked: db.prepare("SELECT COUNT(*) as c FROM push_logs WHERE clicked = 1").get().c,
      delivered: db.prepare("SELECT COUNT(*) as c FROM push_logs WHERE status = 'Yuborildi'").get().c,
    };
    res.json({ logs, stats });
  } catch (err) {
    console.error("Admin push error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/health", authMiddleware, requireAdmin, (req, res) => {
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const io = req.app.get("io");
    const socketCount = io ? io.engine.clientsCount || 0 : 0;
    const onlineUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE online = 1").get().c;
    const errorCount = db.prepare("SELECT COUNT(*) as c FROM admin_logs WHERE action LIKE '%error%'").get().c;
    const totalRequests = db.prepare("SELECT COUNT(*) as c FROM admin_logs").get().c;
    res.json({
      status: "Faol",
      uptime: Math.floor(uptime),
      memory_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      memory_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      socket_connections: socketCount,
      online_users: onlineUsers,
      error_rate: totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(1) : "0.0",
      db_size: Math.round(require("fs").statSync(require("path").join(__dirname, "..", "talenthub.db")).size / 1024),
      node_version: process.version,
      platform: process.platform,
    });
  } catch (err) {
    console.error("Admin health error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/translations", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { lang, search } = req.query;
    let sql = "SELECT * FROM translations WHERE 1=1";
    const params = [];
    if (lang) { sql += " AND lang = ?"; params.push(lang); }
    if (search) { sql += " AND (key LIKE ? OR value LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    sql += " ORDER BY key ASC";
    const translations = db.prepare(sql).all(...params);
    res.json({ translations });
  } catch (err) {
    console.error("Admin translations error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/translations", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { key, lang, value } = req.body;
    if (!key || !lang) return res.status(400).json({ error: "Kalit va til majburiy" });
    db.prepare("INSERT OR REPLACE INTO translations (key, lang, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").run(key, lang, value || "");
    logAdmin(req.userId, "translation_upsert", "translation", null, `${lang}:${key}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin translation upsert error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/translations/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM translations WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "translation_delete", "translation", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin translation delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/flags", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT f.*, u.name as reviewer_name FROM content_flags f LEFT JOIN users u ON f.reviewed_by = u.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ` AND f.status = ?`; params.push(status); }
    sql += " ORDER BY f.created_at DESC LIMIT 200";
    const flags = db.prepare(sql).all(...params);
    res.json({ flags });
  } catch (err) {
    console.error("Admin flags error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/flags/:id", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare("UPDATE content_flags SET status = ?, reviewed_by = ? WHERE id = ?").run(status || "Tasdiqlangan", req.userId, req.params.id);
    logAdmin(req.userId, "flag_review", "flag", req.params.id, `status=${status}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin flag update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/flags", authMiddleware, requireAdmin, (req, res) => {
  try {
    const { target_type, target_id, reason, severity } = req.body;
    if (!target_type || !target_id) return res.status(400).json({ error: "Target majburiy" });
    const result = db.prepare("INSERT INTO content_flags (target_type, target_id, reason, severity, auto_detected) VALUES (?, ?, ?, ?, 0)").run(
      target_type, Number(target_id), reason || "", severity || "Orta"
    );
    logAdmin(req.userId, "flag_create", "flag", result.lastInsertRowid, `${target_type}:${target_id}`);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin flag create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
