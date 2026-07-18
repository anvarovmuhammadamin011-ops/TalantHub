const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/me", authMiddleware, (req, res) => {
  try {
    const balanceRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ? AND status = 'Tasdiqlangan'").get(req.userId);
    const transactions = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.userId);
    const activeTariff = db.prepare(`
      SELECT tu.*, t.name, t.price, t.duration_days, t.max_vacancies, t.max_contacts, t.features
      FROM tariffs_users tu JOIN tariffs t ON tu.tariff_id = t.id
      WHERE tu.user_id = ? AND tu.active = 1 AND tu.expires_at > CURRENT_TIMESTAMP
      ORDER BY tu.starts_at DESC LIMIT 1
    `).get(req.userId);

    if (activeTariff) activeTariff.features = JSON.parse(activeTariff.features || "[]");

    res.json({ balance: balanceRow.balance, transactions, active_tariff: activeTariff || null });
  } catch (err) {
    console.error("Wallet me error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/tariffs", authMiddleware, (req, res) => {
  try {
    const tariffs = db.prepare("SELECT * FROM tariffs WHERE active = 1 ORDER BY price ASC").all()
      .map((t) => ({ ...t, features: JSON.parse(t.features || "[]") }));
    res.json({ tariffs });
  } catch (err) {
    console.error("Tariffs list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Demo-only "purchase": no real payment gateway, just records the transaction and activates the tariff.
router.post("/subscribe", authMiddleware, (req, res) => {
  try {
    const { tariff_id } = req.body;
    const tariff = db.prepare("SELECT * FROM tariffs WHERE id = ? AND active = 1").get(tariff_id);
    if (!tariff) return res.status(404).json({ error: "Tarif topilmadi" });

    const balanceRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ? AND status = 'Tasdiqlangan'").get(req.userId);
    if (balanceRow.balance < tariff.price) {
      return res.status(400).json({ error: "Balansingiz yetarli emas" });
    }

    const transaction = db.transaction(() => {
      db.prepare(`INSERT INTO transactions (user_id, amount, method, status, type, description) VALUES (?, ?, 'Balans', 'Tasdiqlangan', 'tolov', ?)`)
        .run(req.userId, -tariff.price, `"${tariff.name}" tarifi faollashtirildi`);

      db.prepare("UPDATE tariffs_users SET active = 0 WHERE user_id = ? AND active = 1").run(req.userId);

      db.prepare(`
        INSERT INTO tariffs_users (user_id, tariff_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, '+' || ? || ' days'))
      `).run(req.userId, tariff.id, tariff.duration_days);
    });
    transaction();

    res.json({ success: true });
  } catch (err) {
    console.error("Wallet subscribe error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const DEMO_TOPUP_PRESETS = [50000, 100000, 300000, 500000, 1000000];

// Self-service demo balance top-up — no real payment gateway (Payme/Click) is wired up here
// on purpose; this just records a transaction so the wallet UI has something to demo.
router.post("/demo-topup", authMiddleware, (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!DEMO_TOPUP_PRESETS.includes(amount)) {
      return res.status(400).json({ error: "Noto'g'ri summa" });
    }

    db.prepare(`INSERT INTO transactions (user_id, amount, method, status, type, description) VALUES (?, ?, 'Demo', 'Tasdiqlangan', 'demo_topup', 'Demo balans to''ldirish')`)
      .run(req.userId, amount);

    res.json({ success: true });
  } catch (err) {
    console.error("Wallet demo top-up error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
