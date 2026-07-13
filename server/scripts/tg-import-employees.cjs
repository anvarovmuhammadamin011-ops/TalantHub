require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { loadSession } = require("./lib/tgSession.cjs");
const db = require("../db.cjs");

const CHANNEL = process.env.TELEGRAM_CHANNEL || "UstozShogird";
const IMPORT_LIMIT = parseInt(process.env.TELEGRAM_IMPORT_LIMIT || "100", 10);
const SCAN_LIMIT = parseInt(process.env.TELEGRAM_SCAN_LIMIT || "1500", 10);
const DRY_RUN = process.argv.includes("--dry-run");

const TEACHER_KEYWORDS = [
  "o'qituvchi",
  "ustoz",
  "repetitor",
  "murabbiy",
  "domla",
  "pedagog",
  "teacher",
  "mentor sifatida",
];

const PROGRAMMER_KEYWORDS = [
  "dasturchi",
  "dasturlash",
  "developer",
  "programmer",
  "frontend",
  "front-end",
  "backend",
  "back-end",
  "full stack",
  "fullstack",
  "software engineer",
  "web dev",
  "mobile dev",
  "ios dev",
  "android dev",
  "python",
  "javascript",
  "java dev",
  "devops",
  "qa engineer",
  "data scientist",
  "dasturiy ta'minot",
];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[‘’′`]/g, "'");
}

function classify(text) {
  const norm = normalize(text);
  const matchedTeacher = TEACHER_KEYWORDS.filter((k) => norm.includes(k));
  const matchedProgrammer = PROGRAMMER_KEYWORDS.filter((k) => norm.includes(k));

  if (matchedProgrammer.length && !matchedTeacher.length) {
    return { role: "programmer", matched: matchedProgrammer };
  }
  if (matchedTeacher.length && !matchedProgrammer.length) {
    return { role: "teacher", matched: matchedTeacher };
  }
  if (matchedTeacher.length && matchedProgrammer.length) {
    // Both mentioned (e.g. "dasturlash o'qituvchisi") — treat as teacher of a tech subject.
    return { role: "teacher", matched: [...matchedTeacher, ...matchedProgrammer] };
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = loadSession();

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  console.log(`"${CHANNEL}" kanalidan a'zolar olinmoqda...`);
  const entity = await client.getEntity(CHANNEL);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, phone, city, role, fields, categories, category, bio, avatar, hourly_price, orders_count, rating, reviews_count, verified, online, experience, experience_level, skills, certificates, timeline, social_telegram, social_instagram, social_github)
    VALUES (@name, @email, @password, @phone, @city, @role, @fields, @categories, @category, @bio, @avatar, @hourly_price, @orders_count, @rating, @reviews_count, @verified, @online, @experience, @experience_level, @skills, @certificates, @timeline, @social_telegram, @social_instagram, @social_github)
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
    } catch (err) {
      // Some users restrict profile access; skip enrichment for them.
    }
    await sleep(300);

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const username = user.username || "";
    const name = `${firstName} ${lastName}`.trim() || username || `Telegram foydalanuvchi ${user.id}`;

    const result = classify(`${about} ${firstName} ${lastName} ${username}`);
    if (!result) continue;

    const email = `tg_${user.id}@telegram.import`;
    if (findExisting.get(email, username ? `t.me/${username}` : "__none__")) continue;

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

    if (DRY_RUN) {
      preview.push({ name, role: result.role, matched: result.matched, username });
    } else {
      insertUser.run(record);
    }
    imported++;
  }

  await client.disconnect();

  console.log(`Skanerlangan a'zolar: ${scanned}`);
  console.log(`${DRY_RUN ? "Mos topilgan (dry-run, DBga yozilmadi)" : "Import qilingan"}: ${imported}`);
  if (DRY_RUN) {
    for (const p of preview.slice(0, 30)) {
      console.log(`  [${p.role}] ${p.name} (@${p.username || "—"}) — ${p.matched.join(", ")}`);
    }
    if (preview.length > 30) console.log(`  ...va yana ${preview.length - 30} ta`);
  }
}

main().catch((err) => {
  console.error("Xatolik:", err.message || err);
  process.exit(1);
});
