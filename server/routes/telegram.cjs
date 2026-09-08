const express = require("express");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth.cjs");
const { requireAdmin, requireSection } = require("../middleware/requireAdmin.cjs");
const { loadSession } = require("../scripts/lib/tgSession.cjs");

const router = express.Router();

const SESSION_FILE = path.join(__dirname, "..", ".tg-session");
const EXPORT_DIR = path.join(__dirname, "..", ".tg-export");

// In-memory status tracking for running imports
let importStatus = {
  running: false,
  type: null, // 'employees' or 'candidates' or 'fetch'
  startedAt: null,
  lastResult: null,
};

// Helper: check if Telegram session exists
function hasSession() {
  return fs.existsSync(SESSION_FILE);
}

// Helper: check if export data exists
function hasExportData() {
  const candidatesFile = path.join(EXPORT_DIR, "candidates.json");
  return fs.existsSync(candidatesFile);
}

// GET /api/telegram/status — check Telegram integration status
router.get("/status", authMiddleware, requireAdmin, requireSection("users"), async (req, res) => {
  try {
    const sessionExists = hasSession();
    const exportExists = hasExportData();
    const apiId = !!process.env.TELEGRAM_API_ID;
    const apiHash = !!process.env.TELEGRAM_API_HASH;
    const channel = process.env.TELEGRAM_CHANNEL || "UstozShogird";

    res.json({
      configured: apiId && apiHash,
      sessionExists,
      exportExists,
      channel,
      importRunning: importStatus.running,
      importType: importStatus.type,
      importStartedAt: importStatus.startedAt,
      lastResult: importStatus.lastResult,
    });
  } catch (err) {
    console.error("Telegram status error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// POST /api/telegram/fetch — fetch messages from Telegram channel
router.post("/fetch", authMiddleware, requireAdmin, requireSection("users"), async (req, res) => {
  try {
    if (!hasSession()) {
      return res.status(400).json({ error: "Telegram sessiya topilmadi. Avval login qiling." });
    }
    if (importStatus.running) {
      return res.status(409).json({ error: "Import jarayonda, kuting." });
    }

    const { maxMessages } = req.body || {};
    importStatus = {
      running: true,
      type: "fetch",
      startedAt: new Date().toISOString(),
      lastResult: null,
    };

    // Run fetch in background
    runTelegramFetch(maxMessages)
      .then((result) => {
        importStatus.running = false;
        importStatus.lastResult = { success: true, ...result };
        importStatus.type = null;
      })
      .catch((err) => {
        importStatus.running = false;
        importStatus.lastResult = { success: false, error: err.message };
        importStatus.type = null;
      });

    res.json({ message: "Telegram kanalidan xabarlar olish boshlandi.", running: true });
  } catch (err) {
    importStatus.running = false;
    console.error("Telegram fetch error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// POST /api/telegram/import — import parsed candidates or channel members
router.post("/import", authMiddleware, requireAdmin, requireSection("users"), async (req, res) => {
  try {
    if (!hasSession()) {
      return res.status(400).json({ error: "Telegram sessiya topilmadi. Avval login qiling." });
    }
    if (importStatus.running) {
      return res.status(409).json({ error: "Import jarayonda, kuting." });
    }

    const { type = "employees", dryRun = false } = req.body || {};
    if (!["employees", "candidates"].includes(type)) {
      return res.status(400).json({ error: "Noto'g'ri import turi. 'employees' yoki 'candidates' bo'lishi kerak." });
    }

    if (type === "candidates" && !hasExportData()) {
      return res.status(400).json({ error: "Avval Telegram kanalidan xabarlar oling ('/fetch')." });
    }

    importStatus = {
      running: true,
      type,
      startedAt: new Date().toISOString(),
      lastResult: null,
    };

    // Run import in background
    runTelegramImport(type, dryRun)
      .then((result) => {
        importStatus.running = false;
        importStatus.lastResult = { success: true, ...result };
        importStatus.type = null;
      })
      .catch((err) => {
        importStatus.running = false;
        importStatus.lastResult = { success: false, error: err.message };
        importStatus.type = null;
      });

    res.json({ message: `Telegram ${type === "employees" ? "a'zolari" : "nomzodlari"} importi boshlandi.`, running: true });
  } catch (err) {
    importStatus.running = false;
    console.error("Telegram import error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// --- Background task implementations ---

async function runTelegramFetch(maxMessages) {
  const { TelegramClient } = require("telegram");
  const { StringSession } = require("telegram/sessions");

  const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = loadSession();
  const channel = process.env.TELEGRAM_CHANNEL || "UstozShogird";

  // Ensure export dir exists
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const entity = await client.getEntity(channel);
  console.log(`[TG API] Fetching messages from "${entity.title}"...`);

  const FIELD_MAP = {
    "Xodim": "name",
    "Yosh": "age",
    "Texnologiya": "skills",
    "Telegram": "telegram",
    "Aloqa": "phone",
    "Hudud": "city",
    "Narxi": "price",
    "Kasbi": "profession",
    "Murojaat qilish vaqti": "contact_hours",
    "Maqsad": "bio",
  };

  function parseCandidatePost(text) {
    if (!text || !text.startsWith("Ish joyi kerak")) return null;
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const record = {};
    for (const line of lines) {
      const m = line.match(/^[^\p{L}]*([\p{L} ']+?):\s*(.+)$/u);
      if (!m) continue;
      const label = m[1].trim();
      const value = m[2].trim();
      const key = FIELD_MAP[label];
      if (key) record[key] = value;
    }
    if (!record.name) return null;
    return record;
  }

  const raw = [];
  const candidates = [];
  let offsetId = 0;
  const limit = maxMessages || Infinity;

  while (raw.length < limit) {
    const messages = await client.getMessages(entity, { limit: 100, offsetId });
    if (messages.length === 0) break;

    for (const m of messages) {
      raw.push({ id: m.id, date: m.date, text: m.message || "" });
      const parsed = parseCandidatePost(m.message);
      if (parsed) candidates.push({ msg_id: m.id, date: m.date, ...parsed });
      offsetId = m.id;
    }

    if (messages.length < 100) break;
  }

  fs.writeFileSync(path.join(EXPORT_DIR, "raw-messages.json"), JSON.stringify(raw, null, 2), "utf8");
  fs.writeFileSync(path.join(EXPORT_DIR, "candidates.json"), JSON.stringify(candidates, null, 2), "utf8");

  await client.disconnect();

  const result = {
    totalMessages: raw.length,
    candidatePosts: candidates.length,
  };
  console.log("[TG API] Fetch done:", result);
  return result;
}

async function runTelegramImport(type, dryRun) {
  const db = require("../db.cjs");
  await db.initSchema();

  if (type === "candidates") {
    return importCandidates(db, dryRun);
  } else {
    return importEmployees(db, dryRun);
  }
}

async function importCandidates(db, dryRun) {
  const bcrypt = require("bcryptjs");

  const exportFile = path.join(EXPORT_DIR, "candidates.json");
  if (!fs.existsSync(exportFile)) {
    throw new Error("candidates.json fayli topilmadi. Avval /fetch qiling.");
  }
  const candidates = JSON.parse(fs.readFileSync(exportFile, "utf8"));

  const PLACEHOLDER_PASSWORD_HASH = bcrypt.hashSync("tg-import-" + Date.now(), 10);

  function normTelegram(handle) {
    if (!handle) return "";
    return handle.replace(/^@/, "").trim().toLowerCase();
  }

  function normPhone(phone) {
    if (!phone) return "";
    return phone.replace(/[^\d+]/g, "");
  }

  function makeEmail(handle, phone, msgId) {
    const base = normTelegram(handle) || normPhone(phone).replace(/[^\d]/g, "") || `post${msgId}`;
    return `${base}@tg-import.local`;
  }

  // Dedupe
  const byKey = new Map();
  for (const c of candidates) {
    const key = normTelegram(c.telegram) || normPhone(c.phone) || `msg-${c.msg_id}`;
    const existing = byKey.get(key);
    if (!existing || c.msg_id > existing.msg_id) byKey.set(key, c);
  }
  const deduped = [...byKey.values()];

  const existingEmails = new Set((await db.prepare("SELECT email FROM users").all()).map((r) => r.email));
  const existingTelegrams = new Set(
    (await db.prepare("SELECT social_telegram FROM users WHERE social_telegram != ''").all()).map((r) => r.social_telegram.toLowerCase())
  );
  const existingPhones = new Set(
    (await db.prepare("SELECT phone FROM users WHERE phone != ''").all()).map((r) => normPhone(r.phone))
  );

  let inserted = 0;
  let skipped = 0;

  if (dryRun) {
    // Preview mode — don't write to DB
    const preview = [];
    for (const c of deduped) {
      const tgHandle = normTelegram(c.telegram);
      const phoneNorm = normPhone(c.phone);
      if ((tgHandle && existingTelegrams.has(tgHandle)) || (phoneNorm && existingPhones.has(phoneNorm))) {
        skipped++;
        continue;
      }
      const email = makeEmail(c.telegram, c.phone, c.msg_id);
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }
      preview.push({ name: c.name, telegram: c.telegram, phone: c.phone, skills: c.skills });
      inserted++;
      if (preview.length >= 30) break;
    }
    console.log(`[TG API] Candidates dry-run: would insert ${inserted}, skip ${skipped}`);
    return { candidates: candidates.length, deduped: deduped.length, wouldInsert: inserted, skipped, preview };
  }

  await db.transaction(async (trx) => {
    const insertUser = trx.prepare(`
      INSERT INTO users (name, email, password, phone, city, role, fields, categories, category, bio, avatar, hourly_price, skills, certificates, timeline, experience, experience_level, social_telegram)
      VALUES (?, ?, ?, ?, ?, 'specialist', '[]', ?, ?, ?, '', ?, ?, '[]', '[]', '', 'Junior', ?)
    `);

    for (const c of deduped) {
      const tgHandle = normTelegram(c.telegram);
      const phoneNorm = normPhone(c.phone);

      if ((tgHandle && existingTelegrams.has(tgHandle)) || (phoneNorm && existingPhones.has(phoneNorm))) {
        skipped++;
        continue;
      }

      const email = makeEmail(c.telegram, c.phone, c.msg_id);
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }
      existingEmails.add(email);
      if (tgHandle) existingTelegrams.add(tgHandle);
      if (phoneNorm) existingPhones.add(phoneNorm);

      const skills = (c.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await insertUser.run(
        c.name,
        email,
        PLACEHOLDER_PASSWORD_HASH,
        c.phone || "",
        c.city || "",
        JSON.stringify(c.profession ? [c.profession] : []),
        c.profession || "",
        c.bio || "",
        c.price || "",
        JSON.stringify(skills),
        c.telegram ? `t.me/${tgHandle}` : ""
      );
      inserted++;
    }
  });

  const result = { candidates: candidates.length, deduped: deduped.length, inserted, skipped };
  console.log("[TG API] Candidates import done:", result);
  return result;
}

async function importEmployees(db, dryRun) {
  const crypto = require("crypto");
  const bcrypt = require("bcryptjs");
  const { TelegramClient, Api } = require("telegram");
  const { StringSession } = require("telegram/sessions");

  const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = loadSession();
  const CHANNEL = process.env.TELEGRAM_CHANNEL || "UstozShogird";
  const IMPORT_LIMIT = parseInt(process.env.TELEGRAM_IMPORT_LIMIT || "100", 10);
  const SCAN_LIMIT = parseInt(process.env.TELEGRAM_SCAN_LIMIT || "1500", 10);

  const TEACHER_KEYWORDS = [
    "o'qituvchi", "ustoz", "repetitor", "murabbiy", "domla", "pedagog", "teacher", "mentor sifatida",
  ];
  const PROGRAMMER_KEYWORDS = [
    "dasturchi", "dasturlash", "developer", "programmer", "frontend", "front-end", "backend", "back-end",
    "full stack", "fullstack", "software engineer", "web dev", "mobile dev", "ios dev", "android dev",
    "python", "javascript", "java dev", "devops", "qa engineer", "data scientist", "dasturiy ta'minot",
  ];

  function normalize(text) {
    return (text || "").toLowerCase().replace(/[''′`]/g, "'");
  }

  function classify(text) {
    const norm = normalize(text);
    const matchedTeacher = TEACHER_KEYWORDS.filter((k) => norm.includes(k));
    const matchedProgrammer = PROGRAMMER_KEYWORDS.filter((k) => norm.includes(k));
    if (matchedProgrammer.length && !matchedTeacher.length) return { role: "programmer", matched: matchedProgrammer };
    if (matchedTeacher.length && !matchedProgrammer.length) return { role: "teacher", matched: matchedTeacher };
    if (matchedTeacher.length && matchedProgrammer.length) return { role: "teacher", matched: [...matchedTeacher, ...matchedProgrammer] };
    return null;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function titleCase(s) {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  console.log(`[TG API] Scanning "${CHANNEL}" channel members...`);
  const entity = await client.getEntity(CHANNEL);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, phone, city, role, fields, categories, category, bio, avatar, hourly_price, orders_count, rating, reviews_count, verified, online, experience, experience_level, skills, certificates, timeline, social_telegram, social_instagram, social_github)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const findExisting = db.prepare(`SELECT id FROM users WHERE email = ? OR (social_telegram <> '' AND social_telegram = ?)`);

  const placeholderHash = bcrypt.hashSync(crypto.randomBytes(24).toString("hex"), 10);

  let scanned = 0;
  let imported = 0;
  const preview = [];

  for await (const user of client.iterParticipants(entity, { limit: SCAN_LIMIT })) {
    scanned++;
    if (imported >= IMPORT_LIMIT) break;
    if (user.bot || user.deleted || user.self) continue;

    let about = "";
    try {
      const full = await client.invoke(new Api.users.GetFullUser({ id: user }));
      about = full.fullUser?.about || "";
    } catch {
      // Some users restrict profile access
    }
    await sleep(300);

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const username = user.username || "";
    const name = `${firstName} ${lastName}`.trim() || username || `Telegram foydalanuvchi ${user.id}`;

    const result = classify(`${about} ${firstName} ${lastName} ${username}`);
    if (!result) continue;

    const email = `tg_${user.id}@telegram.import`;
    if (await findExisting.get(email, username ? `t.me/${username}` : "__none__")) continue;

    const record = {
      name,
      email,
      password: placeholderHash,
      phone: "",
      city: "",
      role: "specialist",
      fields: JSON.stringify([result.role === "teacher" ? "Ta'lim" : "IT"]),
      categories: JSON.stringify([result.role === "teacher" ? "O'qituvchi" : "Dasturchi"]),
      category: result.role === "teacher" ? "O'qituvchi" : "Dasturchi",
      bio: about.slice(0, 500),
      avatar: "",
      hourly_price: "",
      orders_count: 0,
      rating: 0,
      reviews_count: 0,
      verified: 0,
      online: 0,
      experience: "",
      experience_level: "Middle",
      skills: JSON.stringify([...new Set(result.matched)].slice(0, 5).map(titleCase)),
      certificates: JSON.stringify([]),
      timeline: JSON.stringify([]),
      social_telegram: username ? `t.me/${username}` : "",
      social_instagram: "",
      social_github: "",
    };

    if (dryRun) {
      preview.push({ name, role: result.role, matched: result.matched, username });
    } else {
      await insertUser.run(
        record.name, record.email, record.password, record.phone, record.city, record.role,
        record.fields, record.categories, record.category, record.bio, record.avatar,
        record.hourly_price, record.orders_count, record.rating, record.reviews_count,
        record.verified, record.online, record.experience, record.experience_level,
        record.skills, record.certificates, record.timeline, record.social_telegram,
        record.social_instagram, record.social_github
      );
    }
    imported++;
  }

  await client.disconnect();

  const result = {
    scanned,
    imported,
    dryRun: !!dryRun,
    preview: dryRun ? preview.slice(0, 30) : undefined,
  };
  console.log("[TG API] Employees import done:", result);
  return result;
}

module.exports = router;
