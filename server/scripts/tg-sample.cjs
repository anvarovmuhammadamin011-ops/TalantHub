// Pulls a handful of recent messages from the target channel so we can see
// the actual post format before writing a full extraction/import script.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionFile = path.join(__dirname, "..", ".tg-session");

(async () => {
  const session = fs.readFileSync(sessionFile, "utf8").trim();
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const channel = await client.getEntity("UstozShogird");
  console.log("CHANNEL:", channel.className, channel.id.toString(), channel.title);

  const messages = await client.getMessages(channel, { limit: 15 });
  const sample = messages.map((m) => ({
    id: m.id,
    date: m.date,
    text: m.message,
    hasMedia: !!m.media,
  }));

  fs.writeFileSync(
    path.join(__dirname, "..", ".tg-sample.json"),
    JSON.stringify(sample, null, 2),
    "utf8"
  );
  console.log("DONE. Wrote", sample.length, "messages to server/.tg-sample.json");
  await client.disconnect();
  process.exit(0);
})();
