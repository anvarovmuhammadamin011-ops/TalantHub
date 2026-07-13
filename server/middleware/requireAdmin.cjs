const db = require("../db.cjs");

function requireAdmin(req, res, next) {
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Faqat administrator uchun ruxsat" });
  }
  next();
}

module.exports = { requireAdmin };
