const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "talenthub.db"));

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
    priority TEXT DEFAULT "O'rta",
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

module.exports = db;
