// PostgreSQL-backed replacement for the old better-sqlite3 db.cjs. Every route file does
// `const db = require("../db.cjs")` and then `db.prepare(sql).get/all/run(...)` — this module
// preserves that exact shape so call sites only need `async`/`await` added, not rewritten SQL.
// The one real difference: every method is now async (Postgres is a network DB, there's no
// synchronous driver), and there's a new `db.transaction()` for the handful of call sites that
// genuinely need multi-statement atomicity (better-sqlite3's `db.transaction()` doesn't translate
// directly to a pooled async client).
//
// NOT YET WIRED IN. This file is drafted and ready to test but server/db.cjs still points at
// better-sqlite3 — the live app is unaffected until this is verified against a real DATABASE_URL
// and swapped in deliberately.
const { Pool, types } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — see server/.env.example");
}

// Postgres returns TIMESTAMP columns as JS Date objects and COUNT()/SUM() as strings (to avoid
// precision loss on values bigger than a JS number can hold) by default. The app throughout
// expects plain strings for timestamps (e.g. `new Date(row.created_at + "Z")`) and real numbers
// for aggregates (e.g. `stats.users_total === 0`) — override globally rather than patch every
// call site.
types.setTypeParser(1114, (val) => val); // timestamp without time zone
types.setTypeParser(20, (val) => parseInt(val, 10)); // int8 / bigint (COUNT)
types.setTypeParser(1700, (val) => parseFloat(val)); // numeric (SUM)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 10,
  connectionTimeoutMillis: 15000,
});

// node-postgres emits 'error' on a pooled client that hits a network-level error while idle
// (Neon's autosuspend/connection recycling makes this more likely than an always-on Postgres).
// Unhandled, this is an uncaught EventEmitter error that can crash the process.
pool.on("error", (err) => console.error("pg pool error:", err));

function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Wraps either the pool (autocommit, a fresh connection per call) or a single checked-out
// client (inside a transaction) with the same .prepare(sql).get/all/run(...) + .exec(sql) shape.
function makeExecutor(queryable) {
  return {
    prepare(sql) {
      const pgSql = toPgSql(sql);
      const isInsert = /^\s*insert\s+into/i.test(sql);
      const hasReturning = /\breturning\b/i.test(sql);
      const runSql = isInsert && !hasReturning ? `${pgSql} RETURNING id` : pgSql;

      return {
        async get(...params) {
          const res = await queryable.query(pgSql, params);
          return res.rows[0];
        },
        async all(...params) {
          const res = await queryable.query(pgSql, params);
          return res.rows;
        },
        async run(...params) {
          const res = await queryable.query(runSql, params);
          return { changes: res.rowCount, lastInsertRowid: res.rows[0]?.id };
        },
      };
    },
    // Multi-statement, unparameterized batches only (CREATE TABLE / ALTER TABLE blocks) — pg's
    // simple query protocol allows multiple ;-separated statements when no params are passed.
    async exec(sql) {
      await queryable.query(sql);
    },
  };
}

const db = makeExecutor(pool);

// For the handful of call sites that need real multi-statement atomicity (e.g. wallet
// subscribe: debit + deactivate old tariff + activate new one must all-or-nothing apply).
// Usage: await db.transaction(async (trx) => { await trx.prepare(...).run(...); ... });
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const trx = makeExecutor(client);
    const result = await fn(trx);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Everything that used to run synchronously at module-load time (CommonJS has no top-level
// await, and there's no synchronous Postgres driver) now lives here — called once from
// index.cjs's startup sequence before server.listen().
async function initSchema() {
  // --- Phase 1: tables, in FK-dependency order --------------------------------------------
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vacancies (
      id SERIAL PRIMARY KEY,
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
      employer_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'Yuborildi',
      match_percent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      employer_id INTEGER NOT NULL REFERENCES users(id),
      specialist_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price TEXT DEFAULT '',
      deadline TEXT DEFAULT '',
      status TEXT DEFAULT 'Yangi',
      priority TEXT DEFAULT 'O''rta',
      rating INTEGER DEFAULT 0,
      review TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT DEFAULT 'info',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id),
      user2_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      chat_id INTEGER NOT NULL REFERENCES chats(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id INTEGER,
      details TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tariffs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER DEFAULT 30,
      max_vacancies INTEGER DEFAULT 3,
      max_contacts INTEGER DEFAULT 10,
      features TEXT DEFAULT '[]',
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'UZS',
      method TEXT DEFAULT 'Payme',
      status TEXT DEFAULT 'Tasdiqlangan',
      type TEXT DEFAULT 'tolov',
      description TEXT DEFAULT '',
      order_id INTEGER,
      commission INTEGER DEFAULT 0,
      refund INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent INTEGER DEFAULT 10,
      max_uses INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      tariff_id INTEGER REFERENCES tariffs(id),
      expires_at TIMESTAMP,
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'Yuborildi',
      provider TEXT DEFAULT 'ESMS',
      cost INTEGER DEFAULT 0,
      delivered INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      title TEXT DEFAULT '',
      body TEXT DEFAULT '',
      status TEXT DEFAULT 'Yuborildi',
      clicked INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS translations (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      lang TEXT NOT NULL DEFAULT 'uz',
      value TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(key, lang)
    );

    CREATE TABLE IF NOT EXISTS content_flags (
      id SERIAL PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      severity TEXT DEFAULT 'O''rta',
      status TEXT DEFAULT 'Korib chiqilmoqda',
      auto_detected INTEGER DEFAULT 0,
      reviewed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tariffs_users (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      tariff_id INTEGER NOT NULL REFERENCES tariffs(id),
      starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      vacancies_used INTEGER DEFAULT 0,
      contacts_used INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS login_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      opened_by INTEGER NOT NULL REFERENCES users(id),
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'Ochiq',
      resolution TEXT DEFAULT '',
      resolved_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject TEXT NOT NULL,
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'Ochiq',
      response TEXT DEFAULT '',
      handled_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      group_name TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_name, name)
    );

    CREATE TABLE IF NOT EXISTS verification_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      document_url TEXT DEFAULT '',
      document_name TEXT DEFAULT '',
      institution TEXT DEFAULT '',
      specialty TEXT DEFAULT '',
      year INTEGER DEFAULT 0,
      stir TEXT DEFAULT '',
      status TEXT DEFAULT 'Kutilmoqda',
      reject_reason TEXT DEFAULT '',
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS saved_vacancies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, vacancy_id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT DEFAULT '',
      query TEXT DEFAULT '',
      category TEXT DEFAULT '',
      location TEXT DEFAULT '',
      format TEXT DEFAULT '',
      experience TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saved_search_matches (
      id SERIAL PRIMARY KEY,
      saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id),
      vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (saved_search_id, vacancy_id)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      path TEXT NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
  `);

  // --- Phase 2: columns added after the original launch, in the order they were added ------
  await db.exec(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS review TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked INTEGER DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Faol';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed INTEGER DEFAULT 0;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '';
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT DEFAULT '';
    ALTER TABLE content_flags ADD COLUMN IF NOT EXISTS reporter_id INTEGER;
    ALTER TABLE content_flags ADD COLUMN IF NOT EXISTS resolution_note TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'super_admin';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS featured INTEGER DEFAULT 0;
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'category';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider TEXT DEFAULT 'local';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS specialist_rating INTEGER DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS specialist_review TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'To''liq stavka';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Farqi yo''q';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS responsibilities TEXT DEFAULT '[]';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_details TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS day_off TEXT DEFAULT '';
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT DEFAULT NULL;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS reject_reason TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS moderated_by INTEGER;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS english_level TEXT DEFAULT '';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS openings_count INTEGER DEFAULT 1;
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS contact_method TEXT DEFAULT 'Platforma orqali';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS screening_questions TEXT DEFAULT '[]';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'Kelishiladi';
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS screening_answers TEXT DEFAULT '[]';
    ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS directions TEXT DEFAULT '[]';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_count TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_description TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs TEXT DEFAULT '{"new_application":true,"vacancy_status":true,"messages":true}';
    ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT '';
    ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT '';
    ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 0;
  `);

  // --- Phase 3: one-off backfills + idempotent seed data ------------------------------------
  const defaultCategories = [
    ["IT", "Frontend Developer"], ["IT", "Backend Developer"], ["IT", "Mobile Developer"],
    ["IT", "UI/UX Designer"], ["IT", "DevOps Engineer"], ["IT", "Data Scientist"],
    ["IT", "QA Engineer"], ["IT", "Project Manager"], ["IT", "AI/ML Engineer"], ["IT", "Cyber Security"],
    ["Ta'lim", "Ingliz tili o'qituvchisi"], ["Ta'lim", "Matematika o'qituvchisi"], ["Ta'lim", "Fizika o'qituvchisi"],
    ["Ta'lim", "Informatika o'qituvchisi"], ["Ta'lim", "Biologiya o'qituvchisi"], ["Ta'lim", "Tarix o'qituvchisi"],
    ["Ta'lim", "Kimyo o'qituvchisi"], ["Ta'lim", "Geografiya o'qituvchisi"], ["Ta'lim", "Adabiyot o'qituvchisi"],
    ["Ta'lim", "SAT o'qituvchisi"],
  ];
  const insertCategory = db.prepare("INSERT INTO categories (group_name, name, sort_order) VALUES (?, ?, ?) ON CONFLICT (group_name, name) DO NOTHING");
  for (const [i, [group, name]] of defaultCategories.entries()) {
    await insertCategory.run(group, name, i);
  }

  await db.prepare("DELETE FROM categories WHERE group_name = 'IT' AND name = 'Vibecoder'").run();

  await db.prepare("UPDATE orders SET priority = 'O''rta' WHERE priority = 'Orta'").run();
  await db.prepare("UPDATE content_flags SET severity = 'O''rta' WHERE severity = 'Orta'").run();
  await db.prepare("UPDATE users SET onboarding_completed = 1 WHERE onboarding_completed IS NULL").run();
  await db.prepare(`UPDATE users SET roles = '["' || role || '"]' WHERE roles IS NULL AND role IN ('specialist','employer','admin')`).run();
  await db.prepare("DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days'").run();

  await db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING").run("vacancy_moderation_mode", "pre");

  const oldTariffNames = ["Boshlang'ich", "Professional", "Korporativ"];
  await db.prepare(`UPDATE promo_codes SET tariff_id = NULL WHERE tariff_id IN (SELECT id FROM tariffs WHERE name = ANY(?))`).run(oldTariffNames);
  await db.prepare(`DELETE FROM tariffs_users WHERE tariff_id IN (SELECT id FROM tariffs WHERE name = ANY(?))`).run(oldTariffNames);
  await db.prepare(`DELETE FROM tariffs WHERE name = ANY(?)`).run(oldTariffNames);

  const tariffCount = await db.prepare("SELECT COUNT(*) as c FROM tariffs").get();
  if (tariffCount.c === 0) {
    const insertTariff = db.prepare("INSERT INTO tariffs (name, price, duration_days, max_vacancies, max_contacts, features) VALUES (?, ?, ?, ?, ?, ?)");
    await insertTariff.run("Standart e'lon", 0, 30, 999, 999, JSON.stringify(["Oddiy joylashtirish", "Standart ko'rinishda ro'yxatda"]));
    await insertTariff.run("TOP e'lon", 149000, 14, 999, 999, JSON.stringify(["Vakansiyalar ro'yxati boshida chiqadi", "14 kun davomida"]));
    await insertTariff.run("Premium e'lon", 299000, 30, 999, 999, JSON.stringify(["Maxsus belgi va rang bilan ajratiladi", "TOP + alohida dizayn", "30 kun davomida"]));
  }

  const defaultSkills = [
    "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
    "Tarix", "Ona tili", "Informatika", "Geografiya", "Musiqa", "Jismoniy tarbiya",
  ];
  const insertSkill = db.prepare("INSERT INTO categories (group_name, name, type, sort_order) VALUES ('', ?, 'skill', ?) ON CONFLICT (group_name, name) DO NOTHING");
  for (const [i, name] of defaultSkills.entries()) {
    await insertSkill.run(name, i);
  }
}

module.exports = Object.assign(db, { transaction, initSchema, pool });
