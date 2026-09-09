// Telefon raqamiga Telegram bot orqali tasdiqlash kodi yuborish.
// Muhim Telegram cheklovi: Bot API faqat botni /start qilgan chat_id ga xabar
// yubera oladi — ixtiyoriy telefon raqamiga to'g'ridan-to'g'ri yozib bo'lmaydi.
// Shuning uchun oqim shunday:
//  1. POST /api/auth/phone/send-code — kod generatsiya qilinadi, agar shu telefon
//     botda ro'yxatdan o'tgan bo'lsa (webhook orqali bog'langan) real Telegram
//     xabar yuboriladi, bo'lmasa kod server logga yoziladi va dev rejimda
//     javobda debugCode sifatida qaytadi.
//  2. Foydalanuvchi bot havolasi (t.me/<bot>?start=<phone>) orqali botni start
//     qilsa, POST /api/telegram/webhook telefon <-> chat_id bog'laydi va keyingi
//     kodlar real Telegramga boradi.
//  3. POST /api/auth/phone/verify-code — kodni tekshiradi.

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// phone(E.164, masalan +998901234567) -> { code, expiresAt, attempts, lastSentAt, chatId }
const codes = new Map();
// phone -> chatId (botni start qilgan foydalanuvchilar)
const phoneToChat = new Map();

function normalizeUzPhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("998")) d = d.slice(3);
  else if (d.length === 10 && d.startsWith("71")) d = d.slice(0); // shahar kodi bilan bo'lsa ham
  else if (d.startsWith("8") && d.length === 11) d = d.slice(1);
  // 9 xonali mobil raqam kutiladi
  if (!/^\d{9}$/.test(d)) return null;
  return "+998" + d;
}

function isValidUzPhone(input) {
  return normalizeUzPhone(input) !== null;
}

function maskPhone(phone) {
  if (!phone || phone.length < 5) return phone;
  return phone.slice(0, 7) + "***" + phone.slice(-2);
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return { ok: false, reason: "bot_not_configured" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, reason: data.ok ? null : data.description || "send_failed" };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

function botLinkFor(phone) {
  const username = (process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "");
  if (!username) return null;
  const normalized = normalizeUzPhone(phone) || phone;
  return `https://t.me/${username}?start=${encodeURIComponent(normalized)}`;
}

async function createAndSendCode(phone) {
  const normalized = normalizeUzPhone(phone);
  if (!normalized) return { error: "Telefon raqam noto'g'ri. +998 XX XXX XX XX formatda kiriting." };

  const now = Date.now();
  const prev = codes.get(normalized);
  if (prev && now - prev.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - prev.lastSentAt)) / 1000);
    return { error: `Iltimos, ${waitSec} soniyadan keyin qayta urinib ko'ring.`, retryAfter: waitSec };
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  codes.set(normalized, { code, expiresAt: now + CODE_TTL_MS, attempts: 0, lastSentAt: now });

  const chatId = phoneToChat.get(normalized);
  let sentVia = "demo";
  let telegramOk = false;

  if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
    const text = `🔐 <b>TalentHub tasdiqlash kodi:</b> <code>${code}</code>\n\nKod 5 daqiqa amal qiladi. Hech kimga bermang.`;
    const r = await sendTelegramMessage(chatId, text);
    telegramOk = r.ok;
    sentVia = r.ok ? "telegram" : "demo";
    if (!r.ok) console.log(`[phone-verify] TG send failed for ${maskPhone(normalized)}: ${r.reason}. Code: ${code}`);
  } else {
    console.log(`[phone-verify] Code for ${maskPhone(normalized)}: ${code} (bot bog'lanmagan — demo rejim)`);
  }

  const isDev = !process.env.VERCEL && process.env.NODE_ENV !== "production";
  return {
    phone: normalized,
    sentVia,
    telegramOk,
    botLink: botLinkFor(normalized),
    botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    chatLinked: !!chatId,
    // Prod'da kodni hech qachon javobda qaytarmaymiz; dev'da qulaylik uchun qaytaramiz.
    ...(isDev ? { debugCode: code } : {}),
  };
}

function checkCode(phone, code) {
  const normalized = normalizeUzPhone(phone);
  if (!normalized) return { ok: false, error: "Telefon raqam noto'g'ri." };
  const entry = codes.get(normalized);
  if (!entry) return { ok: false, error: "Avval kodni yuboring." };
  if (Date.now() > entry.expiresAt) {
    codes.delete(normalized);
    return { ok: false, error: "Kod muddati tugagan. Yangi kod oling." };
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    codes.delete(normalized);
    return { ok: false, error: "Urinishlar soni tugadi. Yangi kod oling." };
  }
  if (String(code).trim() !== entry.code) return { ok: false, error: "Noto'g'ri kod. Qaytadan urinib ko'ring." };
  codes.delete(normalized);
  return { ok: true, phone: normalized };
}

function linkChat(phone, chatId) {
  const normalized = normalizeUzPhone(phone);
  if (!normalized || !chatId) return null;
  phoneToChat.set(normalized, String(chatId));
  return normalized;
}

function getChatFor(phone) {
  return phoneToChat.get(normalizeUzPhone(phone) || "") || null;
}

module.exports = {
  normalizeUzPhone,
  isValidUzPhone,
  createAndSendCode,
  checkCode,
  linkChat,
  getChatFor,
  botLinkFor,
  sendTelegramMessage,
};
