require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { computeCheck } = require("telegram/Password");
const { loadAuthTmp, clearAuthTmp, saveSession } = require("./lib/tgSession.cjs");

async function main() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const code = process.env.TELEGRAM_CODE;
  const password = process.env.TELEGRAM_PASSWORD;

  if (!apiId || !apiHash) {
    console.error("TELEGRAM_API_ID va TELEGRAM_API_HASH server/.env faylida bo'lishi kerak.");
    process.exit(1);
  }
  if (!code) {
    console.error(
      "TELEGRAM_CODE topilmadi. Telegramdan kelgan kodni server/.env fayliga TELEGRAM_CODE=xxxxx qilib yozing."
    );
    process.exit(1);
  }

  const { session, phoneCodeHash, phone } = loadAuthTmp();
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      })
    );
  } catch (err) {
    if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
      if (!password) {
        console.error(
          "Bu akkauntda 2 bosqichli tasdiqlash (2FA) yoqilgan. server/.env fayliga TELEGRAM_PASSWORD=... qo'shing va qayta ishga tushiring."
        );
        process.exit(1);
      }
      const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
      const passwordSrpCheck = await computeCheck(passwordSrpResult, password);
      await client.invoke(new Api.auth.CheckPassword({ password: passwordSrpCheck }));
    } else {
      throw err;
    }
  }

  saveSession(stringSession.save());
  clearAuthTmp();

  console.log("Login muvaffaqiyatli! Sessiya server/.tg-session fayliga saqlandi.");
  console.log("Endi kanal a'zolarini olish uchun ishga tushiring:");
  console.log("  node server/scripts/tg-import-employees.cjs --dry-run");

  await client.disconnect();
}

main().catch((err) => {
  console.error("Xatolik:", err.message || err);
  process.exit(1);
});
