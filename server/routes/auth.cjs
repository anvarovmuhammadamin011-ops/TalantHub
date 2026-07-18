const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const db = require("../db.cjs");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth.cjs");
const { rateLimit } = require("../middleware/rateLimit.cjs");

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
  }, (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value || "";
      const name = profile.displayName || "";
      const avatar = profile.photos?.[0]?.value || "";

      let user = db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId);

      if (!user && email) {
        user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      }

      if (user) {
        if (!user.google_id) {
          db.prepare("UPDATE users SET google_id = ?, oauth_provider = 'google', avatar = CASE WHEN avatar = '' THEN ? ELSE avatar END WHERE id = ?").run(googleId, avatar, user.id);
        }
        return done(null, user);
      }

      const result = db.prepare(`
        INSERT INTO users (name, email, password, avatar, google_id, oauth_provider, role)
        VALUES (?, ?, '', ?, ?, 'google', 'specialist')
      `).run(name, email, avatar, googleId);

      const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      return done(null, newUser);
    } catch (err) {
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    done(null, user);
  });
}

router.post("/register", authRateLimit, (req, res) => {
  try {
    const { name, email, password, phone, city, role, fields, categories, category } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Ism, email va parol majburiy" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    const safeRole = role === "employer" ? "employer" : "specialist";

    const hashed = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, city, role, roles, fields, categories, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, email, hashed,
      phone || "", city || "", safeRole, JSON.stringify([safeRole]),
      JSON.stringify(fields || []),
      JSON.stringify(categories || []),
      category || ""
    );

    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    const user = toSafeUser(row);

    const token = jwt.sign({ id: user.id, email: user.email, tokenVersion: 0 }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/login", authRateLimit, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email va parol majburiy" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
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
      db.prepare("INSERT INTO login_events (user_id, ip, user_agent) VALUES (?, ?, ?)").run(
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

router.get("/me", authMiddleware, (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Invalidates every token issued for this user (this one included) by bumping token_version.
router.post("/logout", authMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?").run(req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const EDITABLE_FIELDS = [
  "bio", "phone", "city", "avatar", "experience", "experience_level",
  "salary", "hourly_price", "social_telegram", "social_instagram", "social_github",
];
const EDITABLE_JSON_FIELDS = ["skills", "certificates", "timeline"];
const PROFILE_EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

router.patch("/me", authMiddleware, (req, res) => {
  try {
    const touchesProfileFields = EDITABLE_FIELDS.some((key) => req.body[key] !== undefined);

    if (touchesProfileFields) {
      const current = db.prepare("SELECT profile_updated_at FROM users WHERE id = ?").get(req.userId);
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
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

const SWITCHABLE_ROLES = ["specialist", "employer"];

function currentRoles(userId) {
  const row = db.prepare("SELECT roles, role FROM users WHERE id = ?").get(userId);
  try {
    const parsed = JSON.parse(row.roles || "[]");
    return Array.isArray(parsed) && parsed.length ? parsed : [row.role];
  } catch {
    return [row.role];
  }
}

// Adds a role to the account's unlocked-roles list without switching to it.
router.post("/roles/unlock", authMiddleware, (req, res) => {
  try {
    const { role } = req.body;
    if (!SWITCHABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    const current = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (current?.role === "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const roles = currentRoles(req.userId);
    if (!roles.includes(role)) roles.push(role);
    db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(JSON.stringify(roles), req.userId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error("Unlock role error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// Switches the account's active role to one already present in its unlocked-roles list.
router.post("/switch-role", authMiddleware, (req, res) => {
  try {
    const { role } = req.body;
    if (!SWITCHABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: "Noto'g'ri rol" });
    }
    const current = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (current?.role === "admin") return res.status(403).json({ error: "Ruxsat yo'q" });

    const roles = currentRoles(req.userId);
    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Bu rol ochilmagan. Avval uni oching." });
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.userId);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
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
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }, (err, user) => {
    if (err || !user) return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    const role = req.query.state === "employer" ? "employer" : "specialist";
    if (user.role !== "admin" && req.query.state) {
      const roles = currentRoles(user.id);
      if (!roles.includes(role)) roles.push(role);
      db.prepare("UPDATE users SET role = ?, roles = ? WHERE id = ?").run(role, JSON.stringify(roles), user.id);
    }
    const token = jwt.sign({ id: user.id, email: user.email, tokenVersion: user.token_version || 0 }, JWT_SECRET, { expiresIn: "7d" });
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;
