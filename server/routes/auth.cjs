const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db.cjs");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth.cjs");

const router = express.Router();

router.post("/register", (req, res) => {
  try {
    const { name, email, password, phone, city, role, fields, categories, category } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Ism, email va parol majburiy" });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, city, role, fields, categories, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, email, hashed,
      phone || "", city || "", role || "specialist",
      JSON.stringify(fields || []),
      JSON.stringify(categories || []),
      category || ""
    );

    const user = db.prepare("SELECT id,name,email,phone,city,role,fields,categories,category FROM users WHERE id = ?").get(result.lastInsertRowid);
    user.fields = JSON.parse(user.fields);
    user.categories = JSON.parse(user.categories);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/login", (req, res) => {
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

    const { password: _, ...safe } = user;
    safe.fields = JSON.parse(safe.fields);
    safe.categories = JSON.parse(safe.categories);
    safe.skills = JSON.parse(safe.skills);
    safe.certificates = JSON.parse(safe.certificates);
    safe.timeline = JSON.parse(safe.timeline);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

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

    const { password, ...safe } = user;
    safe.fields = JSON.parse(safe.fields);
    safe.categories = JSON.parse(safe.categories);
    safe.skills = JSON.parse(safe.skills);
    safe.certificates = JSON.parse(safe.certificates);
    safe.timeline = JSON.parse(safe.timeline);

    res.json({ user: safe });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
