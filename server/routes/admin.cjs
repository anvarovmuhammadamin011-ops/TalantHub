const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");
const { requireAdmin, requireSection, DEFAULT_SECTION_ROLES, RBAC_SETTINGS_KEY, getSectionRoles } = require("../middleware/requireAdmin.cjs");

const router = express.Router();

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}

function sendCsv(res, filename, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("﻿" + toCsv(rows));
}

function logAdmin(adminId, action, targetType, targetId, details) {
  try {
    db.prepare(`INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`)
      .run(adminId, action, targetType || "", targetId || null, details || "");
  } catch (e) {
    console.error("Admin log error:", e);
  }
}

router.get("/stats", authMiddleware, requireAdmin, requireSection("stats"), (req, res) => {
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
    const verified_users = db.prepare("SELECT COUNT(*) as c FROM users WHERE verified = 1").get().c;
    const blocked_users = db.prepare("SELECT COUNT(*) as c FROM users WHERE blocked = 1").get().c;
    const featured_users = db.prepare("SELECT COUNT(*) as c FROM users WHERE featured = 1").get().c;

    const signups_by_day = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now','-13 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();
    const signupsByDayMap = Object.fromEntries(signups_by_day.map((r) => [r.date, r.count]));
    const signups_series = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      signups_series.push({ date: d, count: signupsByDayMap[d] || 0 });
    }

    const users_by_city = db.prepare(`
      SELECT city, COUNT(*) as count FROM users
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city ORDER BY count DESC LIMIT 5
    `).all();

    const vacanciesByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM vacancies
      WHERE created_at >= datetime('now','-29 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at) ASC
    `).all();
    const vacanciesByDayMap = Object.fromEntries(vacanciesByDay.map((r) => [r.date, r.count]));
    const vacancies_30d_series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      vacancies_30d_series.push({ date: d, count: vacanciesByDayMap[d] || 0 });
    }

    const vacancies_pending = db.prepare("SELECT COUNT(*) as c FROM vacancies WHERE status='Kutilmoqda'").get().c;
    const vacancies_needs_fix = db.prepare("SELECT COUNT(*) as c FROM vacancies WHERE status='Tuzatish kerak'").get().c;

    const directionCounts = {};
    for (const row of db.prepare("SELECT category, directions FROM vacancies").all()) {
      let dirs = [];
      try { dirs = JSON.parse(row.directions || "[]"); } catch { dirs = []; }
      const keys = dirs.length ? dirs : [row.category];
      for (const key of keys) {
        if (!key) continue;
        directionCounts[key] = (directionCounts[key] || 0) + 1;
      }
    }
    const top_directions = Object.entries(directionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const hired = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status = 'Qabul qilindi'").get().c;
    const conversion = {
      total_applications: applications_total,
      hired,
      rate: applications_total > 0 ? Math.round((hired / applications_total) * 1000) / 10 : 0,
    };

    res.json({
      users_total, specialists, employers, admins, vacancies_total, vacancies_active, vacancies_pending, vacancies_needs_fix,
      orders_total, orders_active, orders_completed,
      applications_total, messages_total, new_users_7d, verified_users, blocked_users, featured_users, signups_series, users_by_city,
      vacancies_30d_series, top_directions, conversion,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/users", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    let sql = `SELECT id,name,email,phone,city,role,admin_role,verified,blocked,blocked_reason,featured,rating,reviews_count,orders_count,created_at FROM users WHERE 1=1`;
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
    } else if (status === "featured") {
      sql += ` AND featured = 1`;
    }

    const countSql = sql.replace("SELECT id,name,email,phone,city,role,admin_role,verified,blocked,blocked_reason,featured,rating,reviews_count,orders_count,created_at", "SELECT COUNT(*) as total");
    const total = db.prepare(countSql).get(...params).total;

    sql += ` ORDER BY featured DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const users = db.prepare(sql).all(...params);
    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const VALID_ROLES = ["specialist", "employer", "admin"];
const VALID_ADMIN_ROLES = ["super_admin", "moderator", "support"];

router.patch("/users/:id", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const isSelf = targetId === req.userId;

    const target = db.prepare("SELECT id, role, admin_role, name FROM users WHERE id = ?").get(targetId);
    if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const { verified, blocked, blocked_reason, featured, rating, reviews_count, role, admin_role, name, phone, city } = req.body;
    const actor = db.prepare("SELECT admin_role FROM users WHERE id = ?").get(req.userId);
    const actorIsSuperAdmin = (actor?.admin_role || "super_admin") === "super_admin";

    if (isSelf && (blocked !== undefined || role !== undefined)) {
      return res.status(400).json({ error: "O'zingizni bloklay yoki rolingizni o'zgartira olmaysiz" });
    }
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    if (admin_role !== undefined) {
      if (!actorIsSuperAdmin) return res.status(403).json({ error: "Faqat Super Admin admin rolini o'zgartira oladi" });
      if (!VALID_ADMIN_ROLES.includes(admin_role)) return res.status(400).json({ error: "Noto'g'ri admin roli" });
      if ((role || target.role) !== "admin") return res.status(400).json({ error: "Admin roli faqat 'admin' foydalanuvchilarga tegishli" });
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
    if (featured !== undefined) { sets.push("featured = ?"); params.push(featured ? 1 : 0); logDetails.push(`featured=${featured ? 1 : 0}`); }
    if (blocked !== undefined) { sets.push("blocked = ?"); params.push(blocked ? 1 : 0); logDetails.push(`blocked=${blocked ? 1 : 0}`); }
    if (blocked_reason !== undefined) { sets.push("blocked_reason = ?"); params.push(blocked_reason); }
    if (rating !== undefined) { sets.push("rating = ?"); params.push(Number(rating)); logDetails.push(`rating=${rating}`); }
    if (reviews_count !== undefined) { sets.push("reviews_count = ?"); params.push(Number(reviews_count)); logDetails.push(`reviews_count=${reviews_count}`); }
    if (role !== undefined) {
      sets.push("role = ?"); params.push(role); logDetails.push(`role=${role}`);
      if (role === "specialist" || role === "employer") {
        // Admin-set roles only ever add to the unlocked-roles list, never revoke — an admin
        // "demoting" someone to specialist shouldn't strip their ability to self-switch back.
        let roles = [];
        try { roles = JSON.parse(db.prepare("SELECT roles FROM users WHERE id = ?").get(targetId)?.roles || "[]"); } catch { roles = []; }
        if (!Array.isArray(roles)) roles = [];
        if (!roles.includes(role)) roles.push(role);
        sets.push("roles = ?"); params.push(JSON.stringify(roles));
      }
    }
    if (admin_role !== undefined) { sets.push("admin_role = ?"); params.push(admin_role); logDetails.push(`admin_role=${admin_role}`); }
    if (name !== undefined && name.trim()) { sets.push("name = ?"); params.push(name.trim()); }
    if (phone !== undefined) { sets.push("phone = ?"); params.push(phone); }
    if (city !== undefined) { sets.push("city = ?"); params.push(city); }

    if (sets.length === 0) return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });

    params.push(targetId);
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    logAdmin(req.userId, "user_update", "user", targetId, `${target.name}: ${logDetails.join(", ")}`);

    const user = db.prepare("SELECT id,name,email,role,admin_role,verified,blocked,blocked_reason,featured,rating,reviews_count,phone,city FROM users WHERE id = ?").get(targetId);
    res.json({ user });
  } catch (err) {
    console.error("Admin user update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/vacancies/:id/detail", authMiddleware, requireAdmin, requireSection("vacancies"), (req, res) => {
  try {
    const vacancy = db.prepare(`
      SELECT v.*, u.name as author_name, u.email as author_email, u.company_name as author_company
      FROM vacancies v LEFT JOIN users u ON v.employer_id = u.id
      WHERE v.id = ?
    `).get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });

    vacancy.tags = JSON.parse(vacancy.tags || "[]");
    vacancy.requirements = JSON.parse(vacancy.requirements || "[]");
    vacancy.conditions = JSON.parse(vacancy.conditions || "[]");
    vacancy.responsibilities = JSON.parse(vacancy.responsibilities || "[]");
    vacancy.directions = JSON.parse(vacancy.directions || "[]");
    vacancy.screening_questions = JSON.parse(vacancy.screening_questions || "[]");

    const applications = db.prepare(`
      SELECT a.id, a.status, a.match_percent, a.created_at, u.id as user_id, u.name as specialist_name
      FROM applications a JOIN users u ON a.user_id = u.id
      WHERE a.vacancy_id = ? ORDER BY a.created_at DESC
    `).all(vacancy.id);

    res.json({ vacancy, applications });
  } catch (err) {
    console.error("Admin vacancy detail error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/vacancies", authMiddleware, requireAdmin, requireSection("vacancies"), (req, res) => {
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
      directions: JSON.parse(v.directions || "[]"),
    }));

    res.json({ vacancies });
  } catch (err) {
    console.error("Admin vacancies list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const VACANCY_MODERATION_STATUSES = ["Faol", "Tuzatish kerak", "Nofaol", "Arxivlangan"];

router.patch("/vacancies/:id/status", authMiddleware, requireAdmin, requireSection("vacancies"), (req, res) => {
  try {
    const { status, reject_reason } = req.body;
    if (!VACANCY_MODERATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri status" });
    }

    const vacancy = db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });

    db.prepare(`
      UPDATE vacancies SET status = ?, reject_reason = ?, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, status === "Tuzatish kerak" ? (reject_reason || "") : "", req.userId, req.params.id);

    logAdmin(req.userId, "vacancy_status", "vacancy", req.params.id, `status=${status}`);

    if (vacancy.employer_id) {
      const title = status === "Faol" ? "Vakansiya tasdiqlandi"
        : status === "Tuzatish kerak" ? "Vakansiya tuzatish talab qiladi"
        : status === "Nofaol" ? "Vakansiya to'xtatildi"
        : "Vakansiya arxivlandi";
      const description = status === "Faol" ? `"${vacancy.title}" e'loningiz tasdiqlandi va endi barchaga ko'rinadi.`
        : status === "Tuzatish kerak" ? `"${vacancy.title}": ${reject_reason || "Sabab ko'rsatilmagan"}`
        : `"${vacancy.title}" e'loningiz holati o'zgardi.`;

      db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'vacancy', ?, ?, '/dashboard')`)
        .run(vacancy.employer_id, title, description);

      if (req.app.get("io")) {
        req.app.get("io").to(`user_${vacancy.employer_id}`).emit("notification", { type: "vacancy", title, description });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin vacancy status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/wallet/adjust", authMiddleware, requireAdmin, requireSection("finance"), (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    const amountNum = Number(amount);
    if (!user_id || !amountNum) return res.status(400).json({ error: "user_id va amount majburiy" });

    const target = db.prepare("SELECT id, name FROM users WHERE id = ?").get(user_id);
    if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    db.prepare(`INSERT INTO transactions (user_id, amount, method, status, type, description) VALUES (?, ?, 'Admin', 'Tasdiqlangan', 'demo_topup', ?)`)
      .run(user_id, amountNum, description || "Administrator tomonidan balans to'ldirildi");

    logAdmin(req.userId, "wallet_adjust", "user", user_id, `${target.name}: ${amountNum > 0 ? "+" : ""}${amountNum}`);

    res.json({ success: true });
  } catch (err) {
    console.error("Wallet adjust error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/vacancies/:id", authMiddleware, requireAdmin, requireSection("vacancies"), (req, res) => {
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

// ---------- Moliya / To'lovlar ----------
router.get("/finance/stats", authMiddleware, requireAdmin, requireSection("finance"), (req, res) => {
  try {
    const revenue = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE status = 'Tasdiqlangan' AND amount > 0 AND type != 'demo_topup'
    `).get().total;
    const refunded = db.prepare(`SELECT COALESCE(SUM(refund), 0) as total FROM transactions WHERE status = 'Qaytarildi'`).get().total;
    const topups = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'Tasdiqlangan' AND type = 'demo_topup'
    `).get().total;
    const transactionCount = db.prepare("SELECT COUNT(*) as c FROM transactions").get().c;
    const activeTariffs = db.prepare("SELECT COUNT(*) as c FROM tariffs_users WHERE active = 1 AND expires_at > CURRENT_TIMESTAMP").get().c;

    const tariffSales = db.prepare(`
      SELECT t.name, COUNT(tu.id) as sales, COALESCE(SUM(t.price), 0) as revenue
      FROM tariffs_users tu JOIN tariffs t ON tu.tariff_id = t.id
      GROUP BY t.id ORDER BY sales DESC
    `).all();

    const revenueByDay = db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE status = 'Tasdiqlangan' AND amount > 0 AND type != 'demo_topup' AND created_at >= datetime('now','-29 days')
      GROUP BY date(created_at) ORDER BY date(created_at) ASC
    `).all();
    const revenueByDayMap = Object.fromEntries(revenueByDay.map((r) => [r.date, r.total]));
    const revenue_30d_series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      revenue_30d_series.push({ date: d, total: revenueByDayMap[d] || 0 });
    }

    res.json({ revenue, refunded, topups, transactionCount, activeTariffs, tariffSales, revenue_30d_series });
  } catch (err) {
    console.error("Admin finance stats error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/finance/transactions", authMiddleware, requireAdmin, requireSection("finance"), (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 30 } = req.query;
    let sql = `
      SELECT tr.*, u.name as user_name, u.email as user_email
      FROM transactions tr LEFT JOIN users u ON tr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND tr.status = ?`; params.push(status); }
    if (type) { sql += ` AND tr.type = ?`; params.push(type); }
    if (search) { sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }

    const countSql = sql.replace("SELECT tr.*, u.name as user_name, u.email as user_email", "SELECT COUNT(*) as total");
    const total = db.prepare(countSql).get(...params).total;

    sql += ` ORDER BY tr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const transactions = db.prepare(sql).all(...params);
    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("Admin finance transactions error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/finance/transactions/:id/refund", authMiddleware, requireAdmin, requireSection("finance"), (req, res) => {
  try {
    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!tx) return res.status(404).json({ error: "Tranzaksiya topilmadi" });
    if (tx.status !== "Tasdiqlangan" || tx.amount <= 0) {
      return res.status(400).json({ error: "Faqat tasdiqlangan, musbat summali to'lovlarni qaytarish mumkin" });
    }

    db.prepare(`UPDATE transactions SET status = 'Qaytarildi', refund = ? WHERE id = ?`).run(tx.amount, tx.id);

    const user = db.prepare("SELECT name FROM users WHERE id = ?").get(tx.user_id);
    logAdmin(req.userId, "transaction_refund", "transaction", tx.id, `${user?.name || tx.user_id}: -${tx.amount} (${tx.description || tx.type})`);

    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'order', 'To''lov qaytarildi', ?, '/wallet')`)
      .run(tx.user_id, `"${tx.description || tx.type}" uchun ${tx.amount.toLocaleString("ru-RU")} so'm qaytarildi`);

    res.json({ success: true });
  } catch (err) {
    console.error("Admin refund error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Eksport (CSV) ----------
router.get("/export/users", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
  try {
    const rows = db.prepare("SELECT id, name, email, phone, city, role, verified, blocked, rating, reviews_count, created_at FROM users ORDER BY id").all();
    sendCsv(res, "users.csv", rows);
  } catch (err) {
    console.error("Export users error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/export/vacancies", authMiddleware, requireAdmin, requireSection("vacancies"), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.id, v.title, v.company, u.name as employer, v.category, v.status, v.views,
        (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as applications_count, v.created_at
      FROM vacancies v LEFT JOIN users u ON v.employer_id = u.id ORDER BY v.id
    `).all();
    sendCsv(res, "vacancies.csv", rows);
  } catch (err) {
    console.error("Export vacancies error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/export/applications", authMiddleware, requireAdmin, requireSection("applications"), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.id, u.name as specialist, v.title as vacancy, a.status, a.match_percent, a.created_at
      FROM applications a JOIN users u ON a.user_id = u.id JOIN vacancies v ON a.vacancy_id = v.id
      ORDER BY a.id
    `).all();
    sendCsv(res, "applications.csv", rows);
  } catch (err) {
    console.error("Export applications error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/export/transactions", authMiddleware, requireAdmin, requireSection("finance"), (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT tr.id, u.name as user_name, u.email as user_email, tr.amount, tr.method, tr.type, tr.status, tr.description, tr.created_at
      FROM transactions tr LEFT JOIN users u ON tr.user_id = u.id ORDER BY tr.id
    `).all();
    sendCsv(res, "transactions.csv", rows);
  } catch (err) {
    console.error("Export transactions error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/orders", authMiddleware, requireAdmin, requireSection("orders"), (req, res) => {
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

router.patch("/orders/:id/status", authMiddleware, requireAdmin, requireSection("orders"), (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !status.trim()) return res.status(400).json({ error: "Holat kiritilishi shart" });

    const order = db.prepare("SELECT id, employer_id, specialist_id, title FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });

    db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);
    logAdmin(req.userId, "order_status", "order", req.params.id, `status=${status}`);

    for (const userId of [order.employer_id, order.specialist_id]) {
      db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'order', 'Buyurtma holati yangilandi', ?, '/orders')`).run(
        userId, `"${order.title}" holati "${status}" ga o'zgartirildi`
      );
      if (req.app.get("io")) {
        req.app.get("io").to(`user_${userId}`).emit("notification", { type: "order", title: "Buyurtma holati yangilandi", description: `Holat: "${status}"` });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin order status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/orders/:id", authMiddleware, requireAdmin, requireSection("orders"), (req, res) => {
  try {
    const order = db.prepare("SELECT id, title FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
    db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "order_delete", "order", req.params.id, order.title);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin order delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/applications", authMiddleware, requireAdmin, requireSection("applications"), (req, res) => {
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

router.patch("/applications/:id/status", authMiddleware, requireAdmin, requireSection("applications"), (req, res) => {
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

router.delete("/applications/:id", authMiddleware, requireAdmin, requireSection("applications"), (req, res) => {
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

// ---------- Foydalanuvchilar: sessions ----------
router.get("/sessions", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
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

// ---------- Moderatsiya: shikoyatlar (Shikoyatlar navbati) ----------
router.get("/flags", authMiddleware, requireAdmin, requireSection("reports"), (req, res) => {
  try {
    const { status, severity, target_type } = req.query;
    let sql = `
      SELECT f.*, r.name as reviewed_by_name, rep.name as reporter_name, rep.email as reporter_email
      FROM content_flags f
      LEFT JOIN users r ON f.reviewed_by = r.id
      LEFT JOIN users rep ON f.reporter_id = rep.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND f.status = ?`; params.push(status); }
    if (severity) { sql += ` AND f.severity = ?`; params.push(severity); }
    if (target_type) { sql += ` AND f.target_type = ?`; params.push(target_type); }
    sql += ` ORDER BY f.created_at DESC`;
    const flags = db.prepare(sql).all(...params);
    res.json({ flags });
  } catch (err) {
    console.error("Admin flags list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// status: "Ko'rib chiqilmoqda" | "Tasdiqlangan" (asosli) | "Rad etilgan" (asossiz)
// block=true va target_type="user" bo'lsa, shikoyat qilingan foydalanuvchi bloklanadi.
router.patch("/flags/:id", authMiddleware, requireAdmin, requireSection("reports"), (req, res) => {
  try {
    const { status, severity, resolution_note, block } = req.body;
    const flag = db.prepare("SELECT * FROM content_flags WHERE id = ?").get(req.params.id);
    if (!flag) return res.status(404).json({ error: "Shikoyat topilmadi" });

    const sets = ["reviewed_by = ?"];
    const params = [req.userId];
    if (status !== undefined) { sets.push("status = ?"); params.push(status); }
    if (severity !== undefined) { sets.push("severity = ?"); params.push(severity); }
    if (resolution_note !== undefined) { sets.push("resolution_note = ?"); params.push(resolution_note); }
    params.push(req.params.id);

    db.prepare(`UPDATE content_flags SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    let blocked = false;
    if (block && flag.target_type === "user" && status === "Tasdiqlangan") {
      db.prepare("UPDATE users SET blocked = 1, blocked_reason = ? WHERE id = ?").run(
        resolution_note || flag.reason || "Shikoyat asosida bloklandi", flag.target_id
      );
      blocked = true;
      logAdmin(req.userId, "user_block_via_report", "user", flag.target_id, `flag#${flag.id}: ${flag.reason}`);
    }

    logAdmin(req.userId, "flag_update", "content_flag", req.params.id, `status=${status || ""}${blocked ? ", user blocked" : ""}`);
    res.json({ success: true, blocked });
  } catch (err) {
    console.error("Admin flag update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/flags/:id", authMiddleware, requireAdmin, requireSection("reports"), (req, res) => {
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
router.get("/disputes", authMiddleware, requireAdmin, requireSection("disputes"), (req, res) => {
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

router.patch("/disputes/:id", authMiddleware, requireAdmin, requireSection("disputes"), (req, res) => {
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
router.get("/support", authMiddleware, requireAdmin, requireSection("support_tickets"), (req, res) => {
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

router.patch("/support/:id", authMiddleware, requireAdmin, requireSection("support_tickets"), (req, res) => {
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
router.post("/broadcast", authMiddleware, requireAdmin, requireSection("broadcast"), (req, res) => {
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

// ---------- Sozlamalar: kategoriyalar / ko'nikmalar (mini-CMS) ----------
// type: 'category' (yo'nalishlar, group_name = "IT"/"Ta'lim" kabi soha) yoki 'skill' (ko'nikmalar ro'yxati)
router.get("/categories", authMiddleware, requireAdmin, requireSection("categories"), (req, res) => {
  try {
    const { type } = req.query;
    let sql = "SELECT * FROM categories WHERE 1=1";
    const params = [];
    if (type) { sql += " AND type = ?"; params.push(type); }
    sql += " ORDER BY type, group_name, sort_order, name";
    const categories = db.prepare(sql).all(...params);
    res.json({ categories });
  } catch (err) {
    console.error("Admin categories list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/categories", authMiddleware, requireAdmin, requireSection("categories"), (req, res) => {
  try {
    const { group_name, name, type } = req.body;
    const kind = type === "skill" ? "skill" : "category";
    if (!name || !name.trim()) return res.status(400).json({ error: "Nom kiritilishi shart" });
    if (kind === "category" && !group_name) return res.status(400).json({ error: "Yo'nalish (guruh) kiritilishi shart" });
    const result = db.prepare("INSERT INTO categories (group_name, name, type) VALUES (?, ?, ?)").run(group_name || "", name.trim(), kind);
    logAdmin(req.userId, "category_create", "category", result.lastInsertRowid, `${kind} ${group_name || ""}: ${name.trim()}`);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin category create error:", err);
    if (String(err.message || "").includes("UNIQUE")) return res.status(409).json({ error: "Bu nom allaqachon mavjud" });
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/categories/:id", authMiddleware, requireAdmin, requireSection("categories"), (req, res) => {
  try {
    const { active, name, hidden } = req.body;
    const sets = [];
    const params = [];
    if (active !== undefined) { sets.push("active = ?"); params.push(active ? 1 : 0); }
    if (hidden !== undefined) { sets.push("active = ?"); params.push(hidden ? 0 : 1); }
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

router.delete("/categories/:id", authMiddleware, requireAdmin, requireSection("categories"), (req, res) => {
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    logAdmin(req.userId, "category_delete", "category", req.params.id, "");
    res.json({ success: true });
  } catch (err) {
    console.error("Admin category delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Verifikatsiya navbati ----------
router.get("/verification", authMiddleware, requireAdmin, requireSection("verification"), (req, res) => {
  try {
    const { status, type } = req.query;
    let sql = `
      SELECT v.*, u.name as user_name, u.email as user_email, u.role as user_role, r.name as reviewed_by_name
      FROM verification_requests v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN users r ON v.reviewed_by = r.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND v.status = ?`; params.push(status); }
    if (type) { sql += ` AND v.type = ?`; params.push(type); }
    sql += ` ORDER BY v.created_at DESC`;
    const requests = db.prepare(sql).all(...params);
    res.json({ requests });
  } catch (err) {
    console.error("Admin verification list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/verification/:id", authMiddleware, requireAdmin, requireSection("verification"), (req, res) => {
  try {
    const { status, reject_reason } = req.body;
    if (!["Tasdiqlangan", "Rad etildi"].includes(status)) {
      return res.status(400).json({ error: "Holat 'Tasdiqlangan' yoki 'Rad etildi' bo'lishi kerak" });
    }
    if (status === "Rad etildi" && (!reject_reason || !reject_reason.trim())) {
      return res.status(400).json({ error: "Rad etish sababi kiritilishi shart" });
    }

    const request = db.prepare("SELECT * FROM verification_requests WHERE id = ?").get(req.params.id);
    if (!request) return res.status(404).json({ error: "So'rov topilmadi" });

    db.prepare(`
      UPDATE verification_requests SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, status === "Rad etildi" ? reject_reason.trim() : "", req.userId, req.params.id);

    if (status === "Tasdiqlangan") {
      db.prepare("UPDATE users SET verified = 1 WHERE id = ?").run(request.user_id);
    }

    const notifTitle = status === "Tasdiqlangan" ? "Verifikatsiya tasdiqlandi" : "Verifikatsiya rad etildi";
    const notifDesc = status === "Tasdiqlangan"
      ? "Hujjatlaringiz tekshirildi va profilingiz tasdiqlangan deb belgilandi."
      : `Hujjatlaringiz rad etildi. Sabab: ${reject_reason.trim()}`;
    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'verification', ?, ?, '/profile')`).run(
      request.user_id, notifTitle, notifDesc
    );
    if (req.app.get("io")) {
      req.app.get("io").to(`user_${request.user_id}`).emit("notification", { type: "verification", title: notifTitle, description: notifDesc });
    }

    logAdmin(req.userId, "verification_review", "verification_request", req.params.id, `status=${status}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin verification update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Foydalanuvchilar: bulk amallar ----------
router.patch("/users/bulk", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
  try {
    const { ids, action, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "Foydalanuvchilar tanlanmagan" });
    if (!["block", "unblock", "verify", "unverify"].includes(action)) return res.status(400).json({ error: "Noto'g'ri amal" });

    const targetIds = ids.map(Number).filter((id) => id !== req.userId);
    if (targetIds.length === 0) return res.status(400).json({ error: "O'zingizni bloklay olmaysiz" });

    const placeholders = targetIds.map(() => "?").join(",");
    if (action === "block") {
      db.prepare(`UPDATE users SET blocked = 1, blocked_reason = ? WHERE id IN (${placeholders})`).run(reason || "Ommaviy bloklash", ...targetIds);
    } else if (action === "unblock") {
      db.prepare(`UPDATE users SET blocked = 0, blocked_reason = '' WHERE id IN (${placeholders})`).run(...targetIds);
    } else if (action === "verify") {
      db.prepare(`UPDATE users SET verified = 1 WHERE id IN (${placeholders})`).run(...targetIds);
    } else if (action === "unverify") {
      db.prepare(`UPDATE users SET verified = 0 WHERE id IN (${placeholders})`).run(...targetIds);
    }

    logAdmin(req.userId, `bulk_${action}`, "user", null, `ids=${targetIds.join(",")}`);
    res.json({ success: true, updated: targetIds.length });
  } catch (err) {
    console.error("Admin bulk users error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Foydalanuvchi: batafsil sahifa ----------
router.get("/users/:id/detail", authMiddleware, requireAdmin, requireSection("users"), (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = db.prepare("SELECT id,name,email,phone,city,role,admin_role,verified,blocked,blocked_reason,featured,rating,reviews_count,orders_count,created_at,bio,avatar FROM users WHERE id = ?").get(id);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    const applications = db.prepare(`
      SELECT a.*, v.title as vacancy_title FROM applications a JOIN vacancies v ON a.vacancy_id = v.id WHERE a.user_id = ? ORDER BY a.created_at DESC
    `).all(id);

    const orders = db.prepare(`
      SELECT o.*, e.name as employer_name, s.name as specialist_name
      FROM orders o LEFT JOIN users e ON o.employer_id = e.id LEFT JOIN users s ON o.specialist_id = s.id
      WHERE o.employer_id = ? OR o.specialist_id = ? ORDER BY o.created_at DESC
    `).all(id, id);

    const vacancies = db.prepare("SELECT id, title, status, created_at FROM vacancies WHERE employer_id = ? ORDER BY created_at DESC").all(id);

    const reportsFiled = db.prepare("SELECT * FROM content_flags WHERE reporter_id = ? ORDER BY created_at DESC").all(id);
    const reportsReceived = db.prepare("SELECT * FROM content_flags WHERE target_type = 'user' AND target_id = ? ORDER BY created_at DESC").all(id);

    const verification = db.prepare("SELECT * FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC").all(id);

    const lastLogin = db.prepare("SELECT ip, user_agent, created_at FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(id);
    const loginHistory = db.prepare("SELECT ip, user_agent, created_at FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(id);

    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").all(id);
    const balance = transactions.filter((t) => t.status === "Tasdiqlangan").reduce((sum, t) => sum + t.amount, 0);

    res.json({ user, applications, orders, vacancies, reportsFiled, reportsReceived, verification, lastLogin: lastLogin || null, loginHistory, transactions, balance });
  } catch (err) {
    console.error("Admin user detail error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Sozlamalar: umumiy (masalan vakansiya moderatsiyasi rejimi) ----------
router.get("/tariffs", authMiddleware, requireAdmin, requireSection("system"), (req, res) => {
  try {
    const tariffs = db.prepare("SELECT * FROM tariffs ORDER BY price ASC").all()
      .map((t) => ({ ...t, features: JSON.parse(t.features || "[]") }));
    res.json({ tariffs });
  } catch (err) {
    console.error("Admin tariffs list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/tariffs/:id", authMiddleware, requireAdmin, requireSection("system"), (req, res) => {
  try {
    const { name, price, duration_days, features, active } = req.body;
    const tariff = db.prepare("SELECT * FROM tariffs WHERE id = ?").get(req.params.id);
    if (!tariff) return res.status(404).json({ error: "Tarif topilmadi" });

    db.prepare(`
      UPDATE tariffs SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        duration_days = COALESCE(?, duration_days),
        features = COALESCE(?, features),
        active = COALESCE(?, active)
      WHERE id = ?
    `).run(
      name || null,
      price !== undefined ? Number(price) : null,
      duration_days !== undefined ? Number(duration_days) : null,
      features ? JSON.stringify(features) : null,
      active !== undefined ? (active ? 1 : 0) : null,
      req.params.id
    );

    logAdmin(req.userId, "tariff_update", "tariff", req.params.id, `${tariff.name}: price=${price ?? tariff.price}`);

    const updated = db.prepare("SELECT * FROM tariffs WHERE id = ?").get(req.params.id);
    res.json({ tariff: { ...updated, features: JSON.parse(updated.features || "[]") } });
  } catch (err) {
    console.error("Admin tariff update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const VALID_ADMIN_SUBROLES = ["moderator", "support"];

// Permissions management is deliberately gated on adminRole === "super_admin" directly
// (not via requireSection) so a moderator/support account can never edit the permission
// matrix even if the matrix itself was misconfigured to allow it.
router.get("/permissions", authMiddleware, requireAdmin, (req, res) => {
  if (req.adminRole !== "super_admin") return res.status(403).json({ error: "Faqat Super Admin ruxsatlarni ko'ra oladi" });
  res.json({ permissions: getSectionRoles(), defaults: DEFAULT_SECTION_ROLES });
});

router.patch("/permissions", authMiddleware, requireAdmin, (req, res) => {
  try {
    if (req.adminRole !== "super_admin") return res.status(403).json({ error: "Faqat Super Admin ruxsatlarni o'zgartira oladi" });

    const { section, roles } = req.body;
    if (!section || !Array.isArray(roles) || roles.some((r) => !VALID_ADMIN_SUBROLES.includes(r))) {
      return res.status(400).json({ error: "Noto'g'ri bo'lim yoki rol ro'yxati" });
    }

    const current = getSectionRoles();
    current[section] = ["super_admin", ...roles];
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(RBAC_SETTINGS_KEY, JSON.stringify(current));

    logAdmin(req.userId, "permissions_update", "setting", null, `${section}=${roles.join(",")}`);
    res.json({ permissions: current });
  } catch (err) {
    console.error("Admin permissions update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// ---------- Kontent moderatsiyasi: taqiqlangan so'zlar bo'yicha ommaviy skanerlash ----------
router.post("/moderation/scan", authMiddleware, requireAdmin, requireSection("reports"), (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'banned_words'").get();
    const words = (row?.value || "").split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
    if (words.length === 0) return res.status(400).json({ error: "Avval Sozlamalarda taqiqlangan so'zlar ro'yxatini kiriting" });

    const alreadyFlagged = new Set(
      db.prepare("SELECT target_type || ':' || target_id as k FROM content_flags WHERE auto_detected = 1 AND status != 'Rad etilgan'").all().map((r) => r.k)
    );

    let flagged = 0;
    const scanTarget = (targetType, id, text) => {
      const key = `${targetType}:${id}`;
      if (alreadyFlagged.has(key)) return;
      const lower = (text || "").toLowerCase();
      const hit = words.find((w) => lower.includes(w));
      if (!hit) return;
      db.prepare(`INSERT INTO content_flags (target_type, target_id, reason, severity, status, auto_detected) VALUES (?, ?, ?, 'Yuqori', 'Ko''rib chiqilmoqda', 1)`)
        .run(targetType, id, `Taqiqlangan so'z topildi: "${hit}"`);
      alreadyFlagged.add(key);
      flagged++;
    };

    for (const u of db.prepare("SELECT id, bio FROM users WHERE bio != ''").all()) scanTarget("user", u.id, u.bio);
    for (const v of db.prepare("SELECT id, description FROM vacancies WHERE description != ''").all()) scanTarget("vacancy", v.id, v.description);

    logAdmin(req.userId, "content_scan", "content_flags", null, `${flagged} ta yangi belgi topildi`);
    res.json({ success: true, flagged, scannedWords: words.length });
  } catch (err) {
    console.error("Admin moderation scan error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/settings", authMiddleware, requireAdmin, requireSection("system"), (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json({ settings });
  } catch (err) {
    console.error("Admin settings list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/settings/:key", authMiddleware, requireAdmin, requireSection("system"), (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "Qiymat kiritilishi shart" });
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(req.params.key, String(value));
    logAdmin(req.userId, "setting_update", "setting", null, `${req.params.key}=${value}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin setting update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/logs", authMiddleware, requireAdmin, requireSection("logs"), (req, res) => {
  try {
    const { search, action } = req.query;
    let sql = `
      SELECT l.*, a.name as admin_name
      FROM admin_logs l
      LEFT JOIN users a ON l.admin_id = a.id
      WHERE 1=1
    `;
    const params = [];
    if (search) { sql += ` AND (a.name LIKE ? OR l.details LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (action) { sql += ` AND l.action = ?`; params.push(action); }
    sql += ` ORDER BY l.created_at DESC LIMIT 200`;
    const logs = db.prepare(sql).all(...params);
    const actions = db.prepare("SELECT DISTINCT action FROM admin_logs ORDER BY action").all().map((r) => r.action);
    res.json({ logs, actions });
  } catch (err) {
    console.error("Admin logs error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/flags", authMiddleware, requireAdmin, requireSection("reports"), (req, res) => {
  try {
    const { target_type, target_id, reason, severity } = req.body;
    if (!target_type || !target_id) return res.status(400).json({ error: "Target majburiy" });
    const result = db.prepare("INSERT INTO content_flags (target_type, target_id, reason, severity, status, auto_detected) VALUES (?, ?, ?, ?, ?, 0)").run(
      target_type, Number(target_id), reason || "", severity || "O'rta", "Ko'rib chiqilmoqda"
    );
    logAdmin(req.userId, "flag_create", "flag", result.lastInsertRowid, `${target_type}:${target_id}`);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error("Admin flag create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
