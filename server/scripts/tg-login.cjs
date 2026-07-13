// One-time interactive login for the GramJS (MTProto) client used to read
// channel history. Run this once to produce server/.tg-session, then reuse
// that session in tg-fetch-channel.cjs without logging in again.
//
// Since this process can't read stdin interactively from the harness, the
// phone code / 2FA password are picked up by polling small marker files
// (server/.tg-code, server/.tg-password) that get written externally once
// the human supplies them.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const phone = process.env.TELEGRAM_PHONE;

const sessionFile = path.join(__dirname, "..", ".tg-session");
const codeFile = path.join(__dirname, "..", ".tg-code");
const passwordFile = path.join(__dirname, "..", ".tg-password");

function waitForFile(file, marker) {
  return new Promise((resolve) => {
    console.log(marker);
    const check = () => {
      if (fs.existsSync(file)) {
        const val = fs.readFileSync(file, "utf8").trim();
        fs.unlinkSync(file);
        resolve(val);
      } else {
        setTimeout(check, 1500);
      }
    };
    check();
  });
}

(async () => {
  const existing = fs.existsSync(sessionFile)
    ? fs.readFileSync(sessionFile, "utf8").trim()
    : "";
  const client = new TelegramClient(new StringSession(existing), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => phone,
    phoneCode: async () => waitForFile(codeFile, "WAITING_FOR_CODE"),
    password: async () => waitForFile(passwordFile, "WAITING_FOR_PASSWORD"),
    onError: (err) => console.error("LOGIN_ERROR", err.message || err),
  });

  fs.writeFileSync(sessionFile, client.session.save());
  console.log("LOGGED_IN");
  await client.disconnect();
  process.exit(0);
})();
