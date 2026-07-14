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
    insertOrder.run(7, 3, "CRM tizimi backend qismi", "Node.js + PostgreSQL asosida CRM tizimi API yaratish.", "5 000 000 so'm", "2026-08-15", "Qabul qilindi", "O'rta");
    insertOrder.run(7, 2, "Ingliz tili kursi — IELTS tayyorlov", "10 talabaga 3 oylik IELTS tayyorlov kursi o'tkazish.", "4 000 000 so'm", "2026-09-01", "Yangi", "O'rta");
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
  console.log("Database seeded successfully!");
}

function ensureAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@talenthub.uz");
  if (existing) return;

  const generated = !process.env.ADMIN_PASSWORD;
  const adminPw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  const hash = bcrypt.hashSync(adminPw, 10);

  db.prepare(`
    INSERT INTO users (name, email, password, role, verified, city, phone)
    VALUES (?, ?, ?, 'admin', 1, 'Toshkent', '+998 90 000 00 00')
  `).run("Administrator", "admin@talenthub.uz", hash);

  if (generated) {
    console.log(`Admin account created: admin@talenthub.uz / ${adminPw}  (ADMIN_PASSWORD env o'rnatilmagani uchun tasodifiy parol generatsiya qilindi — buni saqlab qo'ying)`);
  } else {
    console.log("Admin account created: admin@talenthub.uz (parol ADMIN_PASSWORD env orqali o'rnatildi)");
  }
}

module.exports = seed;
module.exports.ensureAdmin = ensureAdmin;
