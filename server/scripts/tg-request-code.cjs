require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { saveAuthTmp } = require("./lib/tgSession.cjs");

async function main() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const phone = process.env.TELEGRAM_PHONE;

  if (!apiId || !apiHash || !phone) {
    console.error(
      "TELEGRAM_API_ID, TELEGRAM_API_HASH va TELEGRAM_PHONE server/.env faylida to'ldirilishi kerak."
    );
    process.exit(1);
  }

  const stringSession = new StringSession("");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  const result = await client.sendCode({ apiId, apiHash }, phone);

  saveAuthTmp({
    session: stringSession.save(),
    phoneCodeHash: result.phoneCodeHash,
    phone,
  });

  console.log("Kod Telegram ilovangizga yuborildi.");
  console.log(
    "Endi kodni server/.env fayliga TELEGRAM_CODE=xxxxx qilib yozing (kerak bo'lsa TELEGRAM_PASSWORD ham) va quyidagini ishga tushiring:"
  );
  console.log("  node server/scripts/tg-complete-login.cjs");

  await client.disconnect();
}

main().catch((err) => {
  console.error("Xatolik:", err.message || err);
  process.exit(1);
});
