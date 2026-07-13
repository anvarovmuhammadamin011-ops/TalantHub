const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  try {
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    let orders;

    if (user && user.role === "employer") {
      orders = db.prepare(`
        SELECT o.*, u.name as specialist_name, u.category as specialist_category, u.avatar as specialist_avatar, u.rating as specialist_rating
        FROM orders o
        LEFT JOIN users u ON o.specialist_id = u.id
        WHERE o.employer_id = ?
        ORDER BY o.created_at DESC
      `).all(req.userId);
    } else {
      orders = db.prepare(`
        SELECT o.*, u.name as employer_name, u.avatar as employer_avatar
        FROM orders o
        LEFT JOIN users u ON o.employer_id = u.id
        WHERE o.specialist_id = ?
        ORDER BY o.created_at DESC
      `).all(req.userId);
    }

    const stats = {
      total: orders.length,
      new: orders.filter((o) => o.status === "Yangi").length,
      active: orders.filter((o) => o.status === "Jarayonda" || o.status === "Qabul qilindi").length,
      completed: orders.filter((o) => o.status === "Tugatildi").length,
    };

    res.json({ orders, stats });
  } catch (err) {
    console.error("Orders list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, (req, res) => {
  try {
    const { specialist_id, title, description, price, deadline, priority } = req.body;
    if (!specialist_id || !title) {
      return res.status(400).json({ error: "Mutaxassis va sarlavha majburiy" });
    }

    const result = db.prepare(`
      INSERT INTO orders (employer_id, specialist_id, title, description, price, deadline, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, 'Yangi', ?)
    `).run(req.userId, specialist_id, title, description || "", price || "", deadline || "", priority || "O'rta");

    db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'order', 'Yangi zakaz', ?, '/orders')`).run(
      specialist_id,
      `"${title}" — yangi zakaz sizga yuborildi`
    );

    const order = db.prepare(`
      SELECT o.*, u.name as specialist_name, u.category as specialist_category
      FROM orders o LEFT JOIN users u ON o.specialist_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);

    if (req.app.get("io")) {
      req.app.get("io").to(`user_${specialist_id}`).emit("notification", {
        type: "order", title: "Yangi zakaz", description: `"${title}" — yangi zakaz`
      });
    }

    res.json({ order });
  } catch (err) {
    console.error("Order create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id/status", authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Zakaz topilmadi" });

    db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, req.params.id);

    const notifyUserId = order.employer_id === req.userId ? order.specialist_id : order.employer_id;
    const statusText = {
      "Qabul qilindi": "Zakazingiz qabul qilindi!",
      "Jarayonda": "Zakaz boshlandi!",
      "Tugatildi": "Zakaz tugatildi!",
      "Bekor qilindi": "Zakaz bekor qilindi",
    };

    if (statusText[status]) {
      db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'order', ?, ?, '/orders')`).run(
        notifyUserId, statusText[status], `"${order.title}" — ${status}`
      );

      if (req.app.get("io")) {
        req.app.get("io").to(`user_${notifyUserId}`).emit("notification", {
          type: "order", title: statusText[status], description: `"${order.title}"`
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Order update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
