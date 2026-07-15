const db = require("../db.cjs");

function requireAdmin(req, res, next) {
  const user = db.prepare("SELECT role, admin_role FROM users WHERE id = ?").get(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Faqat administrator uchun ruxsat" });
  }
  req.adminRole = user.admin_role || "super_admin";
  next();
}

// Har bir admin bo'limi qaysi admin_role'larga ochiq ekanini belgilaydi.
// Ro'yxatda bo'lmagan bo'lim faqat super_admin uchun ochiq bo'ladi.
const SECTION_ROLES = {
  stats: ["super_admin"],
  users: ["super_admin", "support"],
  vacancies: ["super_admin", "moderator"],
  orders: ["super_admin"],
  applications: ["super_admin", "moderator"],
  reports: ["super_admin", "moderator"],
  verification: ["super_admin", "moderator"],
  categories: ["super_admin", "moderator"],
  broadcast: ["super_admin", "support"],
  support_tickets: ["super_admin", "support"],
  logs: ["super_admin"],
  finance: ["super_admin"],
  marketing: ["super_admin"],
  system: ["super_admin"],
};

function requireSection(section) {
  return (req, res, next) => {
    const allowed = SECTION_ROLES[section] || ["super_admin"];
    if (req.adminRole === "super_admin" || allowed.includes(req.adminRole)) return next();
    return res.status(403).json({ error: "Ushbu bo'lim uchun ruxsatingiz yo'q" });
  };
}

module.exports = { requireAdmin, requireSection, SECTION_ROLES };
