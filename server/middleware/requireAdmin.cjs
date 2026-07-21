const db = require("../db.cjs");

function requireAdmin(req, res, next) {
  const user = db.prepare("SELECT role, admin_role FROM users WHERE id = ?").get(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Faqat administrator uchun ruxsat" });
  }
  req.adminRole = user.admin_role || "super_admin";
  next();
}

// Default matrix — used whenever a section has no override stored in `settings`.
// super_admin always has full access regardless of this map (checked separately below).
const DEFAULT_SECTION_ROLES = {
  stats: ["super_admin"],
  users: ["super_admin", "support"],
  vacancies: ["super_admin", "moderator"],
  orders: ["super_admin"],
  disputes: ["super_admin"],
  applications: ["super_admin", "moderator"],
  reports: ["super_admin", "moderator"],
  verification: ["super_admin", "moderator"],
  categories: ["super_admin", "moderator"],
  companies: ["super_admin", "moderator", "support"],
  broadcast: ["super_admin", "support"],
  support_tickets: ["super_admin", "support"],
  logs: ["super_admin"],
  finance: ["super_admin"],
  marketing: ["super_admin"],
  system: ["super_admin"],
};

const RBAC_SETTINGS_KEY = "rbac_permissions";

// Admin-editable overrides live in settings.rbac_permissions as JSON; sections not present
// there fall back to DEFAULT_SECTION_ROLES. Read fresh each call — this is an admin-only,
// low-traffic path, so a DB round-trip per request is not worth caching.
function getSectionRoles() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(RBAC_SETTINGS_KEY);
    const overrides = row ? JSON.parse(row.value) : {};
    return { ...DEFAULT_SECTION_ROLES, ...overrides };
  } catch {
    return DEFAULT_SECTION_ROLES;
  }
}

function requireSection(section) {
  return (req, res, next) => {
    const roles = getSectionRoles();
    const allowed = roles[section] || ["super_admin"];
    if (req.adminRole === "super_admin" || allowed.includes(req.adminRole)) return next();
    return res.status(403).json({ error: "Ushbu bo'lim uchun ruxsatingiz yo'q" });
  };
}

module.exports = { requireAdmin, requireSection, DEFAULT_SECTION_ROLES, RBAC_SETTINGS_KEY, getSectionRoles };
