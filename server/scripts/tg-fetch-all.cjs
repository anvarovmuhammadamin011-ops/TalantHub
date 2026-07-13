// Fetches the full message history of the target channel and parses the
// structured "Ish joyi kerak" (candidate/xodim) posts into specialist-shaped
// records. Writes two files for review:
//   server/.tg-export/raw-messages.json   -- every message, untouched
//   server/.tg-export/candidates.json     -- parsed #xodim candidate posts
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionFile = path.join(__dirname, "..", ".tg-session");
const exportDir = path.join(__dirname, "..", ".tg-export");
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

// Field label -> key. Labels appear as "🔤 Label: value" lines.
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
    // strip leading emoji and split on first colon
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

(async () => {
  const session = fs.readFileSync(sessionFile, "utf8").trim();
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const channel = await client.getEntity("UstozShogird");
  console.log("Fetching full history of", channel.title, "...");

  const maxMessages = parseInt(process.argv[2], 10) || Infinity;

  const raw = [];
  const candidates = [];
  let offsetId = 0;
  let batchCount = 0;

  while (raw.length < maxMessages) {
    const messages = await client.getMessages(channel, { limit: 100, offsetId });
    if (messages.length === 0) break;

    for (const m of messages) {
      raw.push({ id: m.id, date: m.date, text: m.message || "" });
      const parsed = parseCandidatePost(m.message);
      if (parsed) candidates.push({ msg_id: m.id, date: m.date, ...parsed });
      offsetId = m.id;
    }

    batchCount++;
    console.log(`  batch ${batchCount}: total raw=${raw.length}, candidates=${candidates.length}, oldest id so far=${offsetId}`);
    if (messages.length < 100) break;
  }

  fs.writeFileSync(path.join(exportDir, "raw-messages.json"), JSON.stringify(raw, null, 2), "utf8");
  fs.writeFileSync(path.join(exportDir, "candidates.json"), JSON.stringify(candidates, null, 2), "utf8");

  console.log("DONE.");
  console.log("Total messages:", raw.length);
  console.log("Parsed candidate (xodim) posts:", candidates.length);

  await client.disconnect();
  process.exit(0);
})();
