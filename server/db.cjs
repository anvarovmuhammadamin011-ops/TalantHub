// SQLite-backed db module using sql.js (pure-JS/WASM — no native .node bindings needed).
// Every route file does `const db = require("../db.cjs")` and then
// `db.prepare(sql).get/all/run(...)` — kept that exact shape so call sites don't need rewriting.

const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, "talenthub.db");

let _db = null; // raw sql.js Database instance

// --- Helper: run a SELECT and return rows as array of plain objects ---
function queryAll(sql, params = []) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryGet(sql, params = []) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function runStatement(sql, params = []) {
  _db.run(sql, params);
  const changes = _db.getRowsModified();
  let lastInsertRowid;
  try {
    const res = queryGet("SELECT last_insert_rowid() as id");
    lastInsertRowid = res ? Number(res.id) : undefined;
  } catch {
    lastInsertRowid = undefined;
  }
  return { changes, lastInsertRowid };
}

// --- Exported db object (methods available after init()) ---
const db = {
  prepare(sql) {
    return {
      get(...params) {
        return queryGet(sql, params);
      },
      all(...params) {
        return queryAll(sql, params);
      },
      run(...params) {
        return runStatement(sql, params);
      },
    };
  },

  exec(sql) {
    // sql.js exec can handle multiple semicolon-separated statements
    _db.exec(sql);
  },

  // Must be called once before any queries — loads the WASM runtime and opens/creates the DB file.
  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      _db = new SQL.Database(buffer);
    } else {
      _db = new SQL.Database();
    }
    // WAL-like: persist after every write batch via a periodic flush.
    // sql.js is in-memory, so we save to disk explicitly.
    db._saveInterval = setInterval(() => db.save(), 5000);
  },

  save() {
    if (!_db) return;
    try {
      const data = _db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error("DB save error:", e);
    }
  },

  // Multi-statement synchronous transaction — wrapped as async for call-site compat.
  async transaction(fn) {
    _db.run("BEGIN");
    const trx = {
      prepare(sql) {
        return {
          get(...params) { return queryGet(sql, params); },
          all(...params) { return queryAll(sql, params); },
          run(...params) { return runStatement(sql, params); },
        };
      },
      exec(sql) { _db.exec(sql); },
    };
    try {
      const result = await fn(trx);
      _db.run("COMMIT");
      db.save();
      return result;
    } catch (err) {
      _db.run("ROLLBACK");
      throw err;
    }
  },

  // --- Schema initialization (same SQL as before, SQLite-compatible) ---
  async initSchema() {
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
        created_at TEXT DEFAULT (datetime('now'))
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
        employer_id INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'Yuborildi',
        match_percent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT DEFAULT 'info',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        read INTEGER DEFAULT 0,
        link TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL REFERENCES users(id),
        user2_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL REFERENCES chats(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        target_type TEXT DEFAULT '',
        target_id INTEGER,
        details TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
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
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER DEFAULT 10,
        max_uses INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,
        tariff_id INTEGER REFERENCES tariffs(id),
        expires_at TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        message TEXT DEFAULT '',
        status TEXT DEFAULT 'Yuborildi',
        provider TEXT DEFAULT 'ESMS',
        cost INTEGER DEFAULT 0,
        delivered INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS push_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT DEFAULT '',
        body TEXT DEFAULT '',
        status TEXT DEFAULT 'Yuborildi',
        clicked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        lang TEXT NOT NULL DEFAULT 'uz',
        value TEXT DEFAULT '',
        updated_at TEXT DEFAULT (datetime('now')),
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
        reviewed_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tariffs_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        tariff_id INTEGER NOT NULL REFERENCES tariffs(id),
        starts_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        vacancies_used INTEGER DEFAULT 0,
        contacts_used INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS login_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        ip TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS disputes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        opened_by INTEGER NOT NULL REFERENCES users(id),
        reason TEXT DEFAULT '',
        status TEXT DEFAULT 'Ochiq',
        resolution TEXT DEFAULT '',
        resolved_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        message TEXT DEFAULT '',
        status TEXT DEFAULT 'Ochiq',
        response TEXT DEFAULT '',
        handled_by INTEGER REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT NOT NULL,
        name TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(group_name, name)
      );

      CREATE TABLE IF NOT EXISTS verification_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        document_url TEXT DEFAULT '',
        document_name TEXT DEFAULT '',
        institution TEXT DEFAULT '',
        specialty TEXT DEFAULT '',
        year INTEGER DEFAULT 0,
        stir TEXT DEFAULT '',
        passport_url TEXT DEFAULT '',
        selfie_url TEXT DEFAULT '',
        face_score REAL DEFAULT 0,
        face_auto INTEGER DEFAULT 0,
        residence_address TEXT DEFAULT '',
        address_doc_url TEXT DEFAULT '',
        address_doc_type TEXT DEFAULT '',
        capture_method TEXT DEFAULT '',
        status TEXT DEFAULT 'Kutilmoqda',
        reject_reason TEXT DEFAULT '',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS saved_vacancies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE (user_id, vacancy_id)
      );

      CREATE TABLE IF NOT EXISTS saved_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT DEFAULT '',
        query TEXT DEFAULT '',
        category TEXT DEFAULT '',
        location TEXT DEFAULT '',
        format TEXT DEFAULT '',
        experience TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS saved_search_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id),
        vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE (saved_search_id, vacancy_id)
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        user_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at)`);

    // --- Phase 2: columns added after the original launch ---
    function addColumnIfMissing(table, column, definition) {
      try {
        const cols = queryAll(`PRAGMA table_info("${table}")`);
        if (!cols.some((c) => c.name === column)) {
          db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
        }
      } catch (e) { /* ignore */ }
    }

    addColumnIfMissing("orders", "rating", "INTEGER DEFAULT 0");
    addColumnIfMissing("orders", "review", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "profile_updated_at", "TEXT");
    addColumnIfMissing("users", "blocked", "INTEGER DEFAULT 0");
    addColumnIfMissing("users", "blocked_reason", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "status", "TEXT DEFAULT 'Faol'");
    addColumnIfMissing("users", "onboarding_completed", "INTEGER DEFAULT 0");
    addColumnIfMissing("vacancies", "start_date", "TEXT DEFAULT ''");
    addColumnIfMissing("applications", "cover_letter", "TEXT DEFAULT ''");
    addColumnIfMissing("content_flags", "reporter_id", "INTEGER");
    addColumnIfMissing("content_flags", "resolution_note", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "admin_role", "TEXT DEFAULT 'super_admin'");
    addColumnIfMissing("users", "featured", "INTEGER DEFAULT 0");
    addColumnIfMissing("categories", "type", "TEXT DEFAULT 'category'");
    addColumnIfMissing("users", "google_id", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "oauth_provider", "TEXT DEFAULT 'local'");
    addColumnIfMissing("users", "token_version", "INTEGER DEFAULT 0");
    addColumnIfMissing("orders", "specialist_rating", "INTEGER DEFAULT 0");
    addColumnIfMissing("orders", "specialist_review", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "employment_type", "TEXT DEFAULT 'To''liq stavka'");
    addColumnIfMissing("vacancies", "schedule", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "gender", "TEXT DEFAULT 'Farqi yo''q'");
    addColumnIfMissing("vacancies", "responsibilities", "TEXT DEFAULT '[]'");
    addColumnIfMissing("vacancies", "salary_details", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "day_off", "TEXT DEFAULT ''");
    addColumnIfMissing("applications", "resume_url", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "roles", "TEXT DEFAULT NULL");
    addColumnIfMissing("vacancies", "reject_reason", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "views", "INTEGER DEFAULT 0");
    addColumnIfMissing("vacancies", "moderated_by", "INTEGER");
    addColumnIfMissing("vacancies", "moderated_at", "TEXT");
    addColumnIfMissing("vacancies", "english_level", "TEXT DEFAULT ''");
    addColumnIfMissing("vacancies", "openings_count", "INTEGER DEFAULT 1");
    addColumnIfMissing("vacancies", "contact_method", "TEXT DEFAULT 'Platforma orqali'");
    addColumnIfMissing("vacancies", "screening_questions", "TEXT DEFAULT '[]'");
    addColumnIfMissing("vacancies", "salary_type", "TEXT DEFAULT 'Kelishiladi'");
    addColumnIfMissing("applications", "screening_answers", "TEXT DEFAULT '[]'");
    addColumnIfMissing("vacancies", "directions", "TEXT DEFAULT '[]'");
    addColumnIfMissing("users", "company_name", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "company_logo", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "industry", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "employee_count", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "company_description", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "website", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "social_linkedin", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "address", "TEXT DEFAULT ''");
    addColumnIfMissing("users", "notification_prefs", `TEXT DEFAULT '{"new_application":true,"vacancy_status":true,"messages":true}'`);
    addColumnIfMissing("verification_requests", "institution", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "specialty", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "year", "INTEGER DEFAULT 0");
    addColumnIfMissing("verification_requests", "passport_url", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "selfie_url", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "face_score", "REAL DEFAULT 0");
    addColumnIfMissing("verification_requests", "face_auto", "INTEGER DEFAULT 0");
    addColumnIfMissing("verification_requests", "residence_address", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "address_doc_url", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "address_doc_type", "TEXT DEFAULT ''");
    addColumnIfMissing("verification_requests", "capture_method", "TEXT DEFAULT ''");

    // --- Phase 3: idempotent seed data ---
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
      insertCategory.run(group, name, i);
    }

    db.prepare("DELETE FROM categories WHERE group_name = 'IT' AND name = 'Vibecoder'").run();

    db.prepare("UPDATE orders SET priority = 'O''rta' WHERE priority = 'Orta'").run();
    db.prepare("UPDATE content_flags SET severity = 'O''rta' WHERE severity = 'Orta'").run();
    db.prepare("UPDATE users SET onboarding_completed = 1 WHERE onboarding_completed IS NULL").run();

    // Backfill roles
    try {
      const usersWithNullRoles = queryAll("SELECT id, role FROM users WHERE roles IS NULL AND role IN ('specialist','employer','admin')");
      for (const u of usersWithNullRoles) {
        db.prepare("UPDATE users SET roles = ? WHERE id = ?").run(JSON.stringify([u.role]), u.id);
      }
    } catch (e) { /* ignore */ }

    db.prepare("DELETE FROM analytics_events WHERE created_at < datetime('now', '-90 days')").run();

    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING").run("vacancy_moderation_mode", "pre");

    // Clean old tariff names
    const oldTariffNames = ["Boshlang'ich", "Professional", "Korporativ"];
    for (const name of oldTariffNames) {
      try {
        const tariff = db.prepare("SELECT id FROM tariffs WHERE name = ?").get(name);
        if (tariff) {
          db.prepare("UPDATE promo_codes SET tariff_id = NULL WHERE tariff_id = ?").run(tariff.id);
          db.prepare("DELETE FROM tariffs_users WHERE tariff_id = ?").run(tariff.id);
          db.prepare("DELETE FROM tariffs WHERE id = ?").run(tariff.id);
        }
      } catch (e) { /* ignore */ }
    }

    const tariffCount = db.prepare("SELECT COUNT(*) as c FROM tariffs").get();
    if (tariffCount.c === 0) {
      const insertTariff = db.prepare("INSERT INTO tariffs (name, price, duration_days, max_vacancies, max_contacts, features) VALUES (?, ?, ?, ?, ?, ?)");
      insertTariff.run("Standart e'lon", 0, 30, 999, 999, JSON.stringify(["Oddiy joylashtirish", "Standart ko'rinishda ro'yxatda"]));
      insertTariff.run("TOP e'lon", 149000, 14, 999, 999, JSON.stringify(["Vakansiyalar ro'yxati boshida chiqadi", "14 kun davomida"]));
      insertTariff.run("Premium e'lon", 299000, 30, 999, 999, JSON.stringify(["Maxsus belgi va rang bilan ajratiladi", "TOP + alohida dizayn", "30 kun davomida"]));
    }

    const defaultSkills = [
      "Ingliz tili", "Matematika", "Fizika", "Kimyo", "Biologiya",
      "Tarix", "Ona tili", "Informatika", "Geografiya", "Musiqa", "Jismoniy tarbiya",
    ];
    const insertSkill = db.prepare("INSERT INTO categories (group_name, name, type, sort_order) VALUES (?, ?, 'skill', ?) ON CONFLICT (group_name, name) DO NOTHING");
    for (const [i, name] of defaultSkills.entries()) {
      insertSkill.run(name, i);
    }

    // Save after schema init
    db.save();
  },

  ensureAdmin: async function () {
    // Placeholder — seed.cjs handles admin seeding
  },
};

module.exports = db;
