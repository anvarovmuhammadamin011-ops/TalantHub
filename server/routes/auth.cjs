const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const db = require("../db.cjs");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth.cjs");
const { rateLimit } = require("../middleware/rateLimit.cjs");
const { validateBody } = require("../middleware/validate.cjs");
const { registerSchema, loginSchema } = require("../schemas.cjs");

const router = express.Router();
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

function toSafeUser(row) {
  const { password, ...safe } = row;
  safe.fields = JSON.parse(safe.fields || "[]");
  safe.categories = JSON.parse(safe.categories || "[]");
  safe.skills = JSON.parse(safe.skills || "[]");
  safe.certificates = JSON.parse(safe.certificates || "[]");
  safe.timeline = JSON.parse(safe.timeline || "[]");
  try { safe.roles = JSON.parse(safe.roles || "[]"); } catch { safe.roles = [safe.role]; }
  try { safe.notification_prefs = JSON.parse(safe.notification_prefs || "{}"); } catch { safe.notification_prefs = {}; }
  return safe;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/callback/google";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value || "";
      const name = profile.displayName || "";
      const avatar = profile.photos?.[0]?.value || "";

      let user = await db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId);

      if (!user && email) {
        user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }

      if (user) {
        if (!user.google_id) {
          await db.prepare("UPDATE users SET google_id = ?, oauth_provider = 'google', avatar = CASE WHEN avatar = '' THEN ? ELSE avatar END WHERE id = ?").run(googleId, avatar, user.id);
        }
        return done(null, user);
      }

      const result = await db.prepare(`
        INSERT INTO users (name, email, password, avatar, google_id, oauth_provider, role)
        VALUES (?, ?, '', ?, ?, 'google', 'specialist')
      `).run(name, email, avatar, googleId);

      const newUser = await db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

router.post("/register", authRateLimit, validateBody(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone, city, role, fields, categories, category } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Ism, email va parol majburiy" });
    }

    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    const safeRole = role === "employer" ? "employer" : "specialist";

    const hashed = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, city, role, roles, fields, categories, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name, email, hashed,
      phone || "", city || "", safeRole, JSON.stringify([safeRole]),
      JSON.stringify(fields || []),
      JSON.stringify(categories || []),
      category || ""
    );

    const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    const user = toSafeUser(row);

    const token = jwt.sign({ id: user.id, email: user.email, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/login", authRateLimit, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email va parol majburiy" });
    }

    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    }

    if (user.blocked) {
      return res.status(403).json({ error: "Hisobingiz bloklangan. Administrator bilan bog'laning." });
    }

    const safe = toSafeUser(user);

    const token = jwt.sign({ id: user.id, email: user.email, tokenVersion: user.token_version || 0 }, JWT_SECRET, { expiresIn: "7d" });

    try {
      const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString().split(",")[0].trim();
      await db.prepare("INSERT INTO login_events (user_id, ip, user_agent) VALUES (?, ?, ?)").run(
        user.id, ip, req.headers["user-agent"] || ""
      );
    } catch (e) {
      console.error("Login event log error:", e);
    }

    res.json({ token, user: safe });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Invalidates every token issued for this user (this one included) by bumping token_version.
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    await db.prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?").run(req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const EDITABLE_FIELDS = [
  "name", "bio", "phone", "city", "avatar", "experience", "experience_level",
  "salary", "hourly_price", "social_telegram", "social_instagram", "social_github",
  "company_name", "company_logo", "industry", "employee_count", "company_description",
  "website", "social_linkedin", "address",
];
const EDITABLE_JSON_FIELDS = ["skills", "certificates", "timeline", "notification_prefs"];
const PROFILE_EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

router.patch("/me", authMiddleware, async (req, res) => {
  try {
    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({ error: "Ism bo'sh bo'lishi mumkin emas" });
    }

    const touchesProfileFields = EDITABLE_FIELDS.some((key) => req.body[key] !== undefined);

    if (touchesProfileFields) {
      const current = await db.prepare("SELECT profile_updated_at FROM users WHERE id = ?").get(req.userId);
      if (current?.profile_updated_at) {
        const elapsed = Date.now() - new Date(current.profile_updated_at + "Z").getTime();
        if (elapsed < PROFILE_EDIT_COOLDOWN_MS) {
          return res.status(429).json({
            error: "Profilni faqat 24 soatda bir marta tahrirlash mumkin",
            retry_after_seconds: Math.ceil((PROFILE_EDIT_COOLDOWN_MS - elapsed) / 1000),
          });
        }
      }
    }

    const sets = [];
    const params = [];

    for (const key of EDITABLE_FIELDS) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }
    for (const key of EDITABLE_JSON_FIELDS) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(req.body[key]));
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "Yangilanadigan maydon topilmadi" });
    }

    if (touchesProfileFields) sets.push("profile_updated_at = CURRENT_TIMESTAMP");
    params.push(req.userId);
    await db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Marks the post-registration onboarding wizard as done. Deliberately separate from PATCH /me —
// it doesn't touch profile_updated_at, so finishing onboarding never eats into the 24h profile
// edit cooldown the wizard itself just used to save skills/bio/etc.
router.post("/onboarding/complete", authMiddleware, async (req, res) => {
  try {
    await db.prepare("UPDATE users SET onboarding_completed = 1 WHERE id = ?").run(req.userId);
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ error: "Eski va yangi parol majburiy" });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: "Yangi parol kamida 8 belgidan iborat bo'lishi kerak" });
    }

    const user = await db.prepare("SELECT password FROM users WHERE id = ?").get(req.userId);
    if (!user || !bcrypt.compareSync(old_password, user.password)) {
      return res.status(401).json({ error: "Eski parol noto'g'ri" });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    await db.prepare("UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?").run(hashed, req.userId);

    // Bumping token_version invalidates the token that authenticated this very request, so
    // issue a fresh one (matching the new version) in the response — otherwise the client
    // would be logged out by its own password-change request.
    const updated = await db.prepare("SELECT email, token_version FROM users WHERE id = ?").get(req.userId);
    const token = jwt.sign({ id: req.userId, email: updated.email, tokenVersion: updated.token_version }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Soft delete: blocks the account, invalidates its sessions, and frees up the email/phone
// so the person can register again later. Deliberately does NOT hard-delete the row —
// this account is referenced by other users' chats, orders, and applications, and a hard
// delete would either violate those foreign keys or silently break their history.
router.post("/delete-account", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Parolni kiriting" });

    const user = await db.prepare("SELECT id, role, password FROM users WHERE id = ?").get(req.userId);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    if (user.role === "admin") return res.status(403).json({ error: "Admin akkauntini shu yerdan o'chirib bo'lmaydi" });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Parol noto'g'ri" });
    }

    const anonymizedEmail = `deleted_${user.id}_${Date.now()}@deleted.talenthub`;
    await db.prepare(`
      UPDATE users
      SET blocked = 1, blocked_reason = ?, email = ?, phone = '', password = '', token_version = token_version + 1
      WHERE id = ?
    `).run("Foydalanuvchi tomonidan o'chirilgan", anonymizedEmail, user.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const SWITCHABLE_ROLES = ["specialist", "employer"];

async function currentRoles(userId) {
  const row = await db.prepare("SELECT roles, role FROM users WHERE id = ?").get(userId);
  try {
    const parsed = JSON.parse(row.roles || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : [row.role];
  } catch {
    return [row.role];
  }
}

// Adds a role to the account's unlocked-roles list without switching to it.
router.post("/roles/unlock", authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!SWITCHABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    const current = await db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (current?.role === "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const roles = await currentRoles(req.userId);
    if (!roles.includes(role)) roles.push(role);
    await db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(JSON.stringify(roles), req.userId);

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Unlock role error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Switches the account's active role to one already present in its unlocked-roles list.
router.post("/switch-role", authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!SWITCHABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    const current = await db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (current?.role === "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const roles = await currentRoles(req.userId);
    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Bu rol ochilmagan. Avval uni oching." });
    }
    await db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.userId);

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Switch role error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// --- Google OAuth ---
router.get("/google", (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: "Google OAuth konfiguratsiya qilinmagan. GOOGLE_CLIENT_ID va GOOGLE_CLIENT_SECRET .env faylga qo'shing." });
  }
  // Only carry an explicit role intent (e.g. from the Register page's employer button) as
  // OAuth `state`. A plain Login-page click passes no role and must never touch an existing
  // account's role.
  const options = { scope: ["profile", "email"] };
  if (req.query.role === "employer" || req.query.role === "specialist") {
    options.state = req.query.role;
  }
  passport.authenticate("google", options)(req, res, next);
});

router.get("/callback/google", (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
  }
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }, async (err, user) => {
    if (err || !user) return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    const role = req.query.state === "employer" ? "employer" : "specialist";
    if (user.role !== "admin" && req.query.state) {
      const roles = await currentRoles(user.id);
      if (!roles.includes(role)) roles.push(role);
      await db.prepare("UPDATE users SET role = ?, roles = ? WHERE id = ?").run(role, JSON.stringify(roles), user.id);
    }
    const token = jwt.sign({ id: user.id, email: user.email, tokenVersion: user.token_version || 0 }, JWT_SECRET, { expiresIn: "7d" });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;
