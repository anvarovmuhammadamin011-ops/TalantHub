// Postgres-era draft of auth.cjs — only change from the original is `async`/`await` around
// the two db.prepare(...).get(...) calls, since db.cjs's methods are now async. Not yet wired
// in (index.cjs and every route still require the original auth.cjs).
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../db.cjs");

function loadOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const secretPath = path.join(__dirname, "../.jwt_secret");
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, "utf8").trim();
  }

  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

const JWT_SECRET = loadOrCreateSecret();

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token topilmadi" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare("SELECT token_version FROM users WHERE id = ?").get(decoded.id);
    if (!user || (decoded.tokenVersion || 0) !== (user.token_version || 0)) {
      return res.status(401).json({ error: "Token muddati tugagan" });
    }
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token muddati tugagan" });
  }
}

async function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare("SELECT token_version FROM users WHERE id = ?").get(decoded.id);
    if (user && (decoded.tokenVersion || 0) === (user.token_version || 0)) {
      req.userId = decoded.id;
    }
  } catch {}
  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware, JWT_SECRET };
