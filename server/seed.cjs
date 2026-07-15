const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("./db.cjs");

function seed() {
  const existingUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (existingUsers.count > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");
  const hash = bcrypt.hashSync("12345678", 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, phone, city, role, fields, categories, category, bio, avatar, hourly_price, orders_count, rating, reviews_count, verified, online, experience, experience_level, skills, certificates, timeline, social_telegram, social_instagram, social_github)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    ["Aziz Karimov", "aziz@demo.com", hash, "+998 90 123 45 67", "Toshkent", "specialist", '["IT"]', '["Frontend Developer"]', "Frontend Developer",
      "React va Vue.js bilan 3 yillik tajribaga egaman. Zamonaviy UI/UX dizayn printsiplarini qo'llayman.", "",
      "50 000", 47, 4.9, 32, 1, 1, "3 yil", "Middle",
      '["React", "Vue.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"]',
      '["Meta Frontend Developer Certificate", "Google UX Design Certificate"]',
      JSON.stringify([{ year: "2023", title: "Frontend Developer", place: "TexnoLabs", desc: "React asosida SPA ilova yaratish" }, { year: "2022", title: "Junior Frontend", place: "StartupUZ", desc: "Vue.js bilan admin panel" }]),
      "t.me/aziz_k", "aziz_dev", "azizkarimov"
    ],
    ["Nilufar Rahimova", "nilufar@demo.com", hash, "+998 91 234 56 78", "Samarqand", "specialist", '["Ta\'lim"]', '["Ingliz tili o\'qituvchisi"]', "Ingliz tili o'qituvchisi",
      "IELTS 8.0 natijasiga egaman. 5 yillik o'qituvchilik tajribasi bor. Cambridge sertifikatiga egaman.", "",
      "35 000", 120, 4.8, 89, 1, 1, "5 yil", "Senior",
      '["IELTS Preparation", "Business English", "Academic Writing", "Public Speaking"]',
      '["Cambridge CELTA", "IELTS 8.0 Certificate"]',
      JSON.stringify([{ year: "2023", title: "Senior English Teacher", place: "British Council", desc: "IELTS tayyorlov kurslari" }, { year: "2021", title: "English Teacher", place: "Samarkand State University", desc: "Akademik ingliz tili" }]),
      "t.me/nilufar_r", "nilufar_teacher", ""
    ],
    ["Sardor Alimov", "sardor@demo.com", hash, "+998 93 345 67 89", "Toshkent", "specialist", '["IT"]', '["Full Stack Developer"]', "Full Stack Developer",
      "Node.js va React bilan to'liq stack loyihalar boshqarganman.", "",
      "70 000", 63, 4.7, 45, 1, 0, "4 yil", "Senior",
      '["React", "Node.js", "MongoDB", "PostgreSQL", "Redis", "Docker", "AWS"]',
      '["AWS Solutions Architect", "MongoDB Certified Developer"]',
      JSON.stringify([{ year: "2024", title: "Senior Full Stack Developer", place: "CloudTech", desc: "Mikroservis arxitekturasi" }]),
      "t.me/sardor_a", "sardor_dev", "sardoralimov"
    ],
    ["Dilshod Tursunov", "dilshod@demo.com", hash, "+998 94 456 78 90", "Toshkent", "specialist", '["IT"]', '["Backend Developer"]', "Backend Developer",
      "Python va Django bilan katta hajmli loyihalar yaratganman.", "",
      "65 000", 38, 4.6, 28, 1, 1, "3 yil", "Middle",
      '["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"]',
      '["Python Professional Certificate"]',
      JSON.stringify([{ year: "2024", title: "Backend Developer", place: "DataFlow", desc: "FastAPI bilan high-load servis" }]),
      "t.me/dilshod_t", "dilshod_py", "dilshodt"
    ],
    ["Malika Nishonova", "malika@demo.com", hash, "+998 95 567 89 01", "Buxoro", "specialist", '["IT", "Ta\'lim"]', '["UI/UX Dizayner", "Grafik dizayner"]', "UI/UX Dizayner",
      "Figma va Adobe Creative Suite bilan 4 yillik tajriba.", "",
      "45 000", 52, 4.9, 41, 1, 1, "4 yil", "Middle",
      '["Figma", "Adobe XD", "Photoshop", "Illustrator", "Prototyping"]',
      '["Google UX Design Certificate"]',
      JSON.stringify([{ year: "2024", title: "UI/UX Designer", place: "DesignHub", desc: "Mobil ilova dizayni" }]),
      "t.me/malika_n", "malika_design", "malikanish"
    ],
    ["Jasur Karimov", "jasur@demo.com", hash, "+998 97 678 90 12", "Namangan", "specialist", '["Ta\'lim"]', '["Matematika o\'qituvchisi"]', "Matematika o'qituvchisi",
      "Oliy matematika va statistika bo'yicha 7 yillik tajriba.", "",
      "30 000", 95, 4.8, 76, 1, 1, "7 yil", "Expert",
      '["Oliy Matematika", "Statistika", "Informatika", "Olimpiada Tayyorlash"]',
      '["Pedagogika Diplomasi", "Olimpiada Murabbiylik Sertifikati"]',
      JSON.stringify([{ year: "2023", title: "Senior Math Teacher", place: "Namangan State University", desc: "Oliy matematika kurslari" }]),
      "t.me/jasur_k", "jasur_math", ""
    ],
    ["TexnoLabs HR", "hr@texnolabs.uz", hash, "+998 71 234 56 78", "Toshkent", "employer", '["IT"]', '["Frontend Developer", "Backend Developer"]', "IT",
      "TexnoLabs — IT sohasidagi yetakchi kompaniya.", "",
      "", 0, 4.5, 128, 1, 0, "", "",
      '[]', '[]', '[]',
      "", "", ""
    ],
  ];

  const insertVacancy = db.prepare(`
    INSERT INTO vacancies (title, company, company_logo, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions, employer_id, company_rating, company_reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vacancies = [
    ["Frontend Developer", "TexnoLabs", "", "Toshkent", "40 000 - 70 000 so'm", 40000, 70000, "Ofis", "Junior", "IT",
      '["React", "JavaScript", "CSS"]',
      "React bilan zamonaviy veb-ilovalar yaratish.",
      '["React 2+ yil tajriba", "JavaScript bilim", "CSS/Tailwind CSS"]',
      '["Bepul ovqat", "Tibbiy sug\'urta", "Sport zal", "Bonuslar"]',
      7, 4.5, 128],
    ["Backend Developer", "CloudTech", "", "Toshkent", "50 000 - 90 000 so'm", 50000, 90000, "Ofis", "Middle", "IT",
      '["Node.js", "PostgreSQL", "Docker"]',
      "Node.js bilan REST API va microservices yaratish.",
      '["Node.js 3+ yil", "PostgreSQL/MongoDB", "Docker basics"]',
      '["Masofadan ishlash", "Bepul ovqat", "Conference budget"]',
      7, 4.7, 89],
    ["UI/UX Designer", "DesignHub", "", "Toshkent", "35 000 - 60 000 so'm", 35000, 60000, "Ofis", "Junior", "IT",
      '["Figma", "UI Design", "Prototyping"]',
      "Figma bilan veb va mobil ilova interfeyslari loyihalash.",
      '["Figma 2+ yil", "UI/UX printsiplari", "Prototyping"]',
      '["Bepul ovqat", "MacBook beriladi", "Bonuslar"]',
      7, 4.9, 64],
    ["Ingliz tili o'qituvchisi", "British Council", "", "Toshkent", "30 000 - 50 000 so'm", 30000, 50000, "Ofis", "Middle", "Ta'lim",
      '["IELTS", "English", "Teaching"]',
      "IELTS tayyorlov kurslari olib borish.",
      '["IELTS 7.5+", "CELTA/Delta", "2+ yil tajriba"]',
      '["Yillik ta\'til 30 kun", "Tibbiy sug\'urta"]',
      7, 4.8, 210],
    ["Matematika o'qituvchisi", "IT Academy", "", "Samarqand", "25 000 - 45 000 so'm", 25000, 45000, "Ofis", "Junior", "Ta'lim",
      '["Mathematics", "Olympiad", "Teaching"]',
      "O'rta maktab va universitet talabalariga matematika o'qitish.",
      '["Oliy ta\'lim (Matematika)", "Pedagogika diplomi"]',
      '["Bepul ovqat", "Sport zal", "Bonuslar"]',
      7, 4.6, 156],
    ["Python Developer", "DataFlow", "", "Toshkent", "55 000 - 85 000 so'm", 55000, 85000, "Masofaviy", "Middle", "IT",
      '["Python", "Django", "PostgreSQL"]',
      "Python/Django bilan high-load web servislar yaratish.",
      '["Python 3+ yil", "Django/FastAPI", "PostgreSQL"]',
      '["100% masofaviy", "Chet el safari", "Equipment allowance"]',
      7, 4.7, 78],
  ];

  const insertApp = db.prepare(`INSERT INTO applications (vacancy_id, user_id, status, match_percent) VALUES (?, ?, ?, ?)`);

  const insertOrder = db.prepare(`
    INSERT INTO orders (employer_id, specialist_id, title, description, price, deadline, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, title, description, read, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertChat = db.prepare(`INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)`);
  const insertMsg = db.prepare(`INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)`);

  const transaction = db.transaction(() => {
    for (const u of users) insertUser.run(...u);
    for (const v of vacancies) insertVacancy.run(...v);

    insertApp.run(1, 1, "Ko'rib chiqilmoqda", 87);
    insertApp.run(2, 1, "Interview", 92);
    insertApp.run(3, 1, "Yuborildi", 78);
    insertApp.run(4, 2, "Qabul qilindi", 95);
    insertApp.run(5, 2, "Ko'rib chiqilmoqda", 82);

    insertOrder.run(7, 1, "TexnoLabs veb-sayti qayta ishlash", "React asosida yangi veb-sayt yaratish. 10 sahifa, responsive dizayn.", "3 500 000 so'm", "2026-08-01", "Jarayonda", "Yuqori");
    insertOrder.run(7, 3, "CRM tizimi backend qismi", "Node.js + PostgreSQL asosida CRM tizimi API yaratish.", "5 000 000 so'm", "2026-08-15", "Qabul qilindi", "Orta");
    insertOrder.run(7, 2, "Ingliz tili kursi — IELTS tayyorlov", "10 talabaga 3 oylik IELTS tayyorlov kursi o'tkazish.", "4 000 000 so'm", "2026-09-01", "Yangi", "Orta");
    insertOrder.run(7, 5, "Mobil ilova UI/UX loyihasi", "Figma da mobil ilova uchun 20+ ekran loyihasi.", "2 800 000 so'm", "2026-07-25", "Tugatildi", "Past");
    insertOrder.run(7, 4, "Python skriptlar yozish", "Ma'lumotlar tahlili uchun Python skriptlar yaratish.", "1 500 000 so'm", "2026-07-20", "Jarayonda", "Yuqori");

    insertNotif.run(1, "order", "Yangi zakaz", "TexnoLabs sizga yangi zakaz yubordi: Veb-sayt qayta ishlash", 0, "/orders");
    insertNotif.run(1, "message", "Yangi xabar", "TexnoLabs sizga xabar yubordi", 0, "/chat");
    insertNotif.run(3, "order", "Zakaz qabul qilindi", "CRM tizimi zakazi qabul qilindi", 1, "/orders");
    insertNotif.run(2, "order", "Yangi zakaz", "IELTS tayyorlov kursi uchun zakaz", 0, "/orders");
    insertNotif.run(1, "application", "Ariza yangilandi", "Arizangiz 'Interview' ga o'tkazildi", 1, "/applications");

    insertChat.run(1, 7);
    insertMsg.run(1, 7, "Assalomu alaykum! Sizning React tajribangiz bizga mos keladi.");
    insertMsg.run(1, 1, "Wa alaykum assalom! Rahmat, qachon suhbat o'tkazsamiz?");
    insertMsg.run(1, 7, "Ertaga soat 14:00 da bo'ladimi? Zoom orqali.");
    insertMsg.run(1, 1, "Albatta, tayyorman!");
    insertMsg.run(1, 7, "Zakazni boshlaylik. Veb-sayt loyihasi — 10 sahifa, responsive. Sizga 3.5M so'm taklif qilamiz.");
    insertMsg.run(1, 1, "Rahmat! Ma'qul, boshlaylik. Dizayn fayllarini yuboring.");

    insertChat.run(3, 7);
    insertMsg.run(2, 7, "Salom! CRM tizimi loyihasi haqida gaplashamiz.");
    insertMsg.run(2, 3, "Salom! Albatta, tayyorman. Backend qismi to'liq qilaman.");
    insertMsg.run(2, 7, "Ajoyib! PostgreSQL va Node.js ishlatasizmi?");
    insertMsg.run(2, 3, "Ha, 3 yillik tajribam bor. Docker bilan deploy ham qilaman.");

    insertChat.run(2, 7);
    insertMsg.run(3, 7, "Nilufar, IELTS kursi uchun zakaz bor. 10 ta talaba, 3 oy.");
    insertMsg.run(3, 2, "Rahmat! Albatta qilaman. Dars jadvalini tuzaylik.");
    insertMsg.run(3, 7, "Har kuni ertalab 9-11 da bo'ladimi?");
    insertMsg.run(3, 2, "Ma'qul, tayyorman!");
  });

  transaction();

  const insertTx = db.prepare("INSERT INTO transactions (user_id, amount, method, status, type, description, commission, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertTariff = db.prepare("INSERT INTO tariffs (name, price, duration_days, max_vacancies, max_contacts, features) VALUES (?, ?, ?, ?, ?, ?)");
  const insertPromo = db.prepare("INSERT INTO promo_codes (code, discount_percent, max_uses, used_count, tariff_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)");
  const insertSms = db.prepare("INSERT INTO sms_logs (phone, message, status, provider, cost, delivered, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const insertPush = db.prepare("INSERT INTO push_logs (user_id, title, body, status, clicked, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const insertTrans = db.prepare("INSERT OR IGNORE INTO translations (key, lang, value) VALUES (?, ?, ?)");
  const insertFlag = db.prepare("INSERT INTO content_flags (target_type, target_id, reason, severity, status, auto_detected) VALUES (?, ?, ?, ?, ?, ?)");

  const tx2 = db.transaction(() => {
    insertTariff.run("Boshlang'ich", 99000, 30, 3, 10, JSON.stringify(["3 ta vakansiya", "10 ta kontakt", "Asosiy qo'llab-quvvatlash"]));
    insertTariff.run("Professional", 299000, 30, 10, 50, JSON.stringify(["10 ta vakansiya", "50 ta kontakt", "Priority qo'llab-quvvatlash", "Analitika"]));
    insertTariff.run("Korporativ", 599000, 30, 50, 999, JSON.stringify(["50 ta vakansiya", "Cheksiz kontakt", "VIP qo'llab-quvvatlash", "API access", "Dedicated manager"]));

    insertPromo.run("SUMMER2026", 20, 100, 12, 2, "2026-09-01");
    insertPromo.run("NEWUSER", 50, 200, 45, null, "2026-12-31");
    insertPromo.run("VIP30", 30, 50, 8, 3, "2026-08-15");

    const txMethods = ["Payme", "Click", "Payme", "Click", "Payme"];
    const txStatuses = ["Tasdiqlangan", "Tasdiqlangan", "Kutilmoqda", "Tasdiqlangan", "Qaytarildi"];
    const txAmounts = [299000, 99000, 599000, 299000, 99000];
    for (let i = 0; i < 5; i++) {
      insertTx.run(
        Math.min(i + 1, 7), txAmounts[i], txMethods[i], txStatuses[i], "tolov",
        `Tariff to'lovi — ${txMethods[i]}`, Math.round(txAmounts[i] * 0.02),
        `2026-07-${String(10 + i).padStart(2, "0")} 12:00:00`
      );
    }

    insertSms.run("+998901234567", "Tasdiqlash kodi: 4821", "Yetkazildi", "ESMS", 50, 1, "2026-07-10 09:00:00");
    insertSms.run("+998912345678", "Tasdiqlash kodi: 7392", "Yetkazildi", "ESMS", 50, 1, "2026-07-11 10:30:00");
    insertSms.run("+998933456789", "Tasdiqlash kodi: 1058", "Xatolik", "ESMS", 50, 0, "2026-07-12 14:15:00");
    insertSms.run("+998944567890", "Tasdiqlash kodi: 6274", "Yetkazildi", "Payme SMS", 75, 1, "2026-07-13 11:00:00");
    insertSms.run("+998955678901", "Sizning zakazingiz tayyor!", "Yetkazildi", "ESMS", 50, 1, "2026-07-14 16:45:00");

    insertPush.run(1, "Yangi zakaz!", "TexnoLabs sizga yangi zakaz yubordi", "Yuborildi", 1, "2026-07-10 08:00:00");
    insertPush.run(2, "Ariza yangilandi", "Sizning arizangiz qabul qilindi", "Yuborildi", 0, "2026-07-11 09:15:00");
    insertPush.run(3, "Xabar keldi", "Sizga yangi xabar yuborildi", "Yuborildi", 1, "2026-07-12 12:30:00");

    insertTrans.run("home.hero_title", "uz", "Eng yaxshi mutaxassislar bir platformada");
    insertTrans.run("home.hero_title", "ru", "Лучшие специалисты на одной платформе");
    insertTrans.run("home.hero_title", "en", "Best specialists on one platform");
    insertTrans.run("home.hero_subtitle", "uz", "IT sohasi va ta'lim yo'nalishidagi eng tajribali mutaxassislar bilan bog'laning.");
    insertTrans.run("home.hero_subtitle", "ru", "Свяжитесь с самыми опытными специалистами в IT и образовании.");
    insertTrans.run("home.hero_subtitle", "en", "Connect with the most experienced specialists in IT and education.");
    insertTrans.run("nav.home", "uz", "Bosh sahifa");
    insertTrans.run("nav.home", "ru", "Главная");
    insertTrans.run("nav.home", "en", "Home");
    insertTrans.run("nav.specialists", "uz", "Mutaxassislar");
    insertTrans.run("nav.specialists", "ru", "Специалисты");
    insertTrans.run("nav.specialists", "en", "Specialists");
    insertTrans.run("common.loading", "uz", "Yuklanmoqda...");
    insertTrans.run("common.loading", "ru", "Загрузка...");
    insertTrans.run("common.loading", "en", "Loading...");

    insertFlag.run("profile", 1, "Shubhali bio matni — spam kalit so'zlar", "Orta", "Ko'rib chiqilmoqda", 1);
    insertFlag.run("chat", 3, "Potentsial firibgarlik — shaxsiy ma'lumot so'rash", "Yuqori", "Ko'rib chiqilmoqda", 1);
    insertFlag.run("vacancy", 2, "Noto'g'ri narx — bozor ortiqcha", "Past", "Tasdiqlangan", 0);
  });

  tx2();
  console.log("Database seeded successfully!");
}

function ensureAdmin() {
  const existing = db.prepare("SELECT id, password FROM users WHERE email = ?").get("admin@talenthub.uz");
  const adminPw = process.env.ADMIN_PASSWORD || "Admin123!";

  if (existing) {
    if (bcrypt.compareSync(adminPw, existing.password)) return;
    db.prepare("UPDATE users SET password = ?, role = 'admin' WHERE id = ?").run(bcrypt.hashSync(adminPw, 10), existing.id);
    console.log("Admin password reset: admin@talenthub.uz / " + adminPw);
    return;
  }

  const hash = bcrypt.hashSync(adminPw, 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, verified, city, phone)
    VALUES (?, ?, ?, 'admin', 1, 'Toshkent', '+998 90 000 00 00')
  `).run("Administrator", "admin@talenthub.uz", hash);
  console.log("Admin account created: admin@talenthub.uz / " + adminPw);
}

module.exports = seed;
module.exports.ensureAdmin = ensureAdmin;
