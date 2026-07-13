// Imports parsed candidate posts (server/.tg-export/candidates.json) into
// the TalentHub `users` table as role='specialist' profiles. Dedupes by
// telegram handle / phone, both within the batch and against existing rows,
// so the script is safe to re-run after fetching more history later.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("../db.cjs");

const exportFile = path.join(__dirname, "..", ".tg-export", "candidates.json");
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

// Keep the most recent post per person (highest msg_id) when the same
// telegram handle or phone appears multiple times in the fetched batch.
const byKey = new Map();
for (const c of candidates) {
  const key = normTelegram(c.telegram) || normPhone(c.phone) || `msg-${c.msg_id}`;
  const existing = byKey.get(key);
  if (!existing || c.msg_id > existing.msg_id) byKey.set(key, c);
}
const deduped = [...byKey.values()];

const existingEmails = new Set(db.prepare("SELECT email FROM users").all().map((r) => r.email));
const existingTelegrams = new Set(
  db.prepare("SELECT social_telegram FROM users WHERE social_telegram != ''").all().map((r) => r.social_telegram.toLowerCase())
);
const existingPhones = new Set(
  db.prepare("SELECT phone FROM users WHERE phone != ''").all().map((r) => normPhone(r.phone))
);

const insertUser = db.prepare(`
  INSERT INTO users (name, email, password, phone, city, role, fields, categories, category, bio, avatar, hourly_price, skills, certificates, timeline, experience, experience_level, social_telegram)
  VALUES (@name, @email, @password, @phone, @city, 'specialist', '[]', @categories, @category, @bio, '', @hourly_price, @skills, '[]', '[]', '', 'Junior', @social_telegram)
`);

let inserted = 0;
let skipped = 0;

const run = db.transaction(() => {
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

    insertUser.run({
      name: c.name,
      email,
      password: PLACEHOLDER_PASSWORD_HASH,
      phone: c.phone || "",
      city: c.city || "",
      categories: JSON.stringify(c.profession ? [c.profession] : []),
      category: c.profession || "",
      bio: c.bio || "",
      hourly_price: c.price || "",
      skills: JSON.stringify(skills),
      social_telegram: c.telegram ? `t.me/${tgHandle}` : "",
    });
    inserted++;
  }
});

run();

console.log(`Parsed candidates: ${candidates.length}, deduped: ${deduped.length}`);
console.log(`Inserted: ${inserted}, skipped (already existed): ${skipped}`);
