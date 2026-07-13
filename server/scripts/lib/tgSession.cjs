const fs = require("fs");
const path = require("path");

const AUTH_TMP_PATH = path.join(__dirname, "..", "..", ".tg-auth-tmp.json");
const SESSION_PATH = path.join(__dirname, "..", "..", ".tg-session");

function saveAuthTmp(data) {
  fs.writeFileSync(AUTH_TMP_PATH, JSON.stringify(data));
}

function loadAuthTmp() {
  if (!fs.existsSync(AUTH_TMP_PATH)) {
    throw new Error(
      "Login jarayoni boshlanmagan. Avval `node server/scripts/tg-request-code.cjs` ni ishga tushiring."
    );
  }
  return JSON.parse(fs.readFileSync(AUTH_TMP_PATH, "utf8"));
}

function clearAuthTmp() {
  if (fs.existsSync(AUTH_TMP_PATH)) fs.unlinkSync(AUTH_TMP_PATH);
}

function saveSession(sessionString) {
  fs.writeFileSync(SESSION_PATH, sessionString, { mode: 0o600 });
}

function loadSession() {
  if (!fs.existsSync(SESSION_PATH)) {
    throw new Error(
      "Saqlangan Telegram sessiya topilmadi. Avval login skriptlarini ishga tushiring:\n" +
        "  1) node server/scripts/tg-request-code.cjs\n" +
        "  2) node server/scripts/tg-complete-login.cjs"
    );
  }
  return fs.readFileSync(SESSION_PATH, "utf8").trim();
}

module.exports = { saveAuthTmp, loadAuthTmp, clearAuthTmp, saveSession, loadSession };
