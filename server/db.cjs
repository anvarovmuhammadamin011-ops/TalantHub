const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.TALENTHUB_DB_PATH || path.join(__dirname, "talenthub.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    city TEXT DEFAULT '',
    role TEXT DEFAULT 'specialist',
    fields TEXT DEFAULT '[]',
    categories TEXT DEFAULT '[]',
    category TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    location TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    experience_level TEXT DEFAULT 'Junior',
    salary TEXT DEFAULT '',
    hourly_price TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    certificates TEXT DEFAULT '[]',
    timeline TEXT DEFAULT '[]',
    orders_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    online INTEGER DEFAULT 0,
    social_telegram TEXT DEFAULT '',
    social_instagram TEXT DEFAULT '',
    social_github TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vacancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT DEFAULT '',
    location TEXT DEFAULT '',
    salary TEXT DEFAULT '',
    salary_min INTEGER DEFAULT 0,
    salary_max INTEGER DEFAULT 0,
    format TEXT DEFAULT 'Ofis',
    experience TEXT DEFAULT 'Junior',
    category TEXT DEFAULT 'IT',
    tags TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    requirements TEXT DEFAULT '[]',
    conditions TEXT DEFAULT '[]',
    company_rating REAL DEFAULT 4.5,
    company_reviews INTEGER DEFAULT 0,
    employer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vacancy_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Yuborildi',
    match_percent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vacancy_id) REFERENCES vacancies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    specialist_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    status TEXT DEFAULT 'Yangi',
    priority TEXT DEFAULT 'O''rta',
    rating INTEGER DEFAULT 0,
    review TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id),
    FOREIGN KEY (specialist_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    link TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );
`);

try {
  db.exec(`ALTER TABLE orders ADD COLUMN rating INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE orders ADD COLUMN review TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN profile_updated_at DATETIME`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN blocked INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN blocked_reason TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN status TEXT DEFAULT 'Faol'`);
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'UZS',
    method TEXT DEFAULT 'Payme',
    status TEXT DEFAULT 'Tasdiqlangan',
    type TEXT DEFAULT 'tolov',
    description TEXT DEFAULT '',
    order_id INTEGER,
    commission INTEGER DEFAULT 0,
    refund INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tariffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    duration_days INTEGER DEFAULT 30,
    max_vacancies INTEGER DEFAULT 3,
    max_contacts INTEGER DEFAULT 10,
    features TEXT DEFAULT '[]',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER DEFAULT 10,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    tariff_id INTEGER,
    expires_at DATETIME,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tariff_id) REFERENCES tariffs(id)
  );

  CREATE TABLE IF NOT EXISTS sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'Yuborildi',
    provider TEXT DEFAULT 'ESMS',
    cost INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS push_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT DEFAULT '',
    body TEXT DEFAULT '',
    status TEXT DEFAULT 'Yuborildi',
    clicked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'uz',
    value TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(key, lang)
  );

  CREATE TABLE IF NOT EXISTS content_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    severity TEXT DEFAULT 'O''rta',
    status TEXT DEFAULT 'Korib chiqilmoqda',
    auto_detected INTEGER DEFAULT 0,
    reviewed_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tariffs_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tariff_id INTEGER NOT NULL,
    starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    vacancies_used INTEGER DEFAULT 0,
    contacts_used INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tariff_id) REFERENCES tariffs(id)
  );

  CREATE TABLE IF NOT EXISTS login_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    opened_by INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT DEFAULT 'Ochiq',
    resolution TEXT DEFAULT '',
    resolved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (opened_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'Ochiq',
    response TEXT DEFAULT '',
    handled_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_name, name)
  );
`);

const defaultCategories = [
  ["IT", "Frontend Developer"], ["IT", "Backend Developer"], ["IT", "Mobile Developer"],
  ["IT", "UI/UX Designer"], ["IT", "DevOps Engineer"], ["IT", "Data Scientist"],
  ["IT", "QA Engineer"], ["IT", "Project Manager"], ["IT", "AI/ML Engineer"], ["IT", "Cyber Security"],
  ["Ta'lim", "Ingliz tili o'qituvchisi"], ["Ta'lim", "Matematika o'qituvchisi"], ["Ta'lim", "Fizika o'qituvchisi"],
  ["Ta'lim", "Informatika o'qituvchisi"], ["Ta'lim", "Biologiya o'qituvchisi"], ["Ta'lim", "Tarix o'qituvchisi"],
  ["Ta'lim", "Kimyo o'qituvchisi"], ["Ta'lim", "Geografiya o'qituvchisi"], ["Ta'lim", "Adabiyot o'qituvchisi"],
  ["Ta'lim", "SAT o'qituvchisi"],
];
const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (group_name, name, sort_order) VALUES (?, ?, ?)");
defaultCategories.forEach(([group, name], i) => insertCategory.run(group, name, i));

// Retired joke placeholder category — remove any row already inserted by an older seed run.
db.prepare("DELETE FROM categories WHERE group_name = 'IT' AND name = 'Vibecoder'").run();

// The DEFAULT for these two columns used to be the misspelled "Orta" (missing the apostrophe
// that's part of correct Uzbek spelling), while every actual form in the app always inserted
// the correctly-spelled "O'rta" — so rows created via the default (no explicit value passed)
// ended up with a different spelling than everything else. Backfill existing rows.
db.prepare("UPDATE orders SET priority = 'O''rta' WHERE priority = 'Orta'").run();
db.prepare("UPDATE content_flags SET severity = 'O''rta' WHERE severity = 'Orta'").run();

try {
  db.exec(`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0`);
  // The post-registration onboarding wizard is a new flow — retroactively marking every
  // pre-existing account as completed keeps it from popping up for already-active users.
  db.exec(`UPDATE users SET onboarding_completed = 1`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN start_date TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE applications ADD COLUMN cover_letter TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE content_flags ADD COLUMN reporter_id INTEGER`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE content_flags ADD COLUMN resolution_note TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN admin_role TEXT DEFAULT 'super_admin'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN featured INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'category'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN oauth_provider TEXT DEFAULT 'local'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE orders ADD COLUMN specialist_rating INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE orders ADD COLUMN specialist_review TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN employment_type TEXT DEFAULT 'To''liq stavka'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN schedule TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN gender TEXT DEFAULT 'Farqi yo''q'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN responsibilities TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN salary_details TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN day_off TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE applications ADD COLUMN resume_url TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN roles TEXT DEFAULT NULL`);
} catch (e) {}
db.exec(`UPDATE users SET roles = '["' || role || '"]' WHERE roles IS NULL AND role IN ('specialist','employer','admin')`);
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN reject_reason TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN views INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN moderated_by INTEGER`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN moderated_at DATETIME`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN english_level TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN openings_count INTEGER DEFAULT 1`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN contact_method TEXT DEFAULT 'Platforma orqali'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN screening_questions TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN salary_type TEXT DEFAULT 'Kelishiladi'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE applications ADD COLUMN screening_answers TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN directions TEXT DEFAULT '[]'`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN company_name TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN company_logo TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN industry TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN employee_count TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN company_description TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN website TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN social_linkedin TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN address TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN notification_prefs TEXT DEFAULT '{"new_application":true,"vacancy_status":true,"messages":true}'`);
} catch (e) {}
// verification_requests predates these columns on some existing databases (the table was
// created before institution/specialty/year were added to the schema, so CREATE TABLE IF NOT
// EXISTS silently skipped them) — backfill explicitly, the same way every other migration here does.
try {
  db.exec(`ALTER TABLE verification_requests ADD COLUMN institution TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE verification_requests ADD COLUMN specialty TEXT DEFAULT ''`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE verification_requests ADD COLUMN year INTEGER DEFAULT 0`);
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS verification_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    document_url TEXT DEFAULT '',
    document_name TEXT DEFAULT '',
    institution TEXT DEFAULT '',
    specialty TEXT DEFAULT '',
    year INTEGER DEFAULT 0,
    stir TEXT DEFAULT '',
    status TEXT DEFAULT 'Kutilmoqda',
    reject_reason TEXT DEFAULT '',
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS saved_vacancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vacancy_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vacancy_id) REFERENCES vacancies(id),
    UNIQUE (user_id, vacancy_id)
  );

  CREATE TABLE IF NOT EXISTS saved_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT DEFAULT '',
    query TEXT DEFAULT '',
    category TEXT DEFAULT '',
    location TEXT DEFAULT '',
    format TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_search_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saved_search_id INTEGER NOT NULL,
    vacancy_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saved_search_id) REFERENCES saved_searches(id),
    FOREIGN KEY (vacancy_id) REFERENCES vacancies(id),
    UNIQUE (saved_search_id, vacancy_id)
  );

  -- Minimal self-hosted pageview analytics — no third-party tracker, no cookies.
  -- Registrations/applications/vacancy-views already have first-class counts
  -- elsewhere (users, applications, vacancies.views); this only fills the gap:
  -- overall traffic and which pages get visited.
  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
`);

// Raw pageview rows aren't kept forever — the aggregates that matter (signups, applications,
// vacancy views) already live in their own tables, so this is disposable, high-volume data.
db.prepare("DELETE FROM analytics_events WHERE created_at < datetime('now','-90 days')").run();

const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
insertSetting.run("vacancy_moderation_mode", "pre");

// Migrate from the old generic subscription-tier tariffs to the per-listing promotion
// tariffs (Standart/TOP/Premium e'lon) used by the Cloz.uz-style wallet page. Demo
// promo_codes referencing the old tariffs are unused by any UI — just unlink them so the
// FK constraint (foreign_keys = ON, above) doesn't block the delete.
const oldTariffNames = ["Boshlang'ich", "Professional", "Korporativ"];
const oldTariffPlaceholders = oldTariffNames.map(() => "?").join(",");
db.prepare(`UPDATE promo_codes SET tariff_id = NULL WHERE tariff_id IN (SELECT id FROM tariffs WHERE name IN (${oldTariffPlaceholders}))`).run(...oldTariffNames);
db.prepare(`DELETE FROM tariffs_users WHERE tariff_id IN (SELECT id FROM tariffs WHERE name IN (${oldTariffPlaceholders}))`).run(...oldTariffNames);
db.prepare(`DELETE FROM tariffs WHERE name IN (${oldTariffPlaceholders})`).run(...oldTariffNames);
if (db.prepare("SELECT COUNT(*) as c FROM tariffs").get().c === 0) {
  const insertTariff = db.prepare("INSERT INTO tariffs (name, price, duration_days, max_vacancies, max_contacts, features) VALUES (?, ?, ?, ?, ?, ?)");
  insertTariff.run("Standart e'lon", 0, 30, 999, 999, JSON.stringify(["Oddiy joylashtirish", "Standart ko'rinishda ro'yxatda"]));
  insertTariff.run("TOP e'lon", 149000, 14, 999, 999, JSON.stringify(["Vakansiyalar ro'yxati boshida chiqadi", "14 kun davomida"]));
  insertTariff.run("Premium e'lon", 299000, 30, 999, 999, JSON.stringify(["Maxsus belgi va rang bilan ajratiladi", "TOP + alohida dizayn", "30 kun davomida"]));
}

const defaultSkills = [
  "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
  "Tarix", "Ona tili", "Informatika", "Geografiya", "Musiqa", "Jismoniy tarbiya",
];
const insertSkill = db.prepare("INSERT OR IGNORE INTO categories (group_name, name, type, sort_order) VALUES ('', ?, 'skill', ?)");
defaultSkills.forEach((name, i) => insertSkill.run(name, i));

module.exports = db;
