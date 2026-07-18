# TalentHub — Xatolar va kamchiliklar hisoboti

Sana: 2026-07-16 (2-marta tekshirilgan, yangilangan). Birinchi hisobotdan keyin kod faol o'zgartirilgani payqaldi — shu sababli har bir topilma qaytadan, joriy kod holatiga qarab tekshirildi. Natija: pastda ✅ deb belgilanganlar allaqachon tuzatilgan, qolganlari hali ochiq.

---

## ✅ Tuzatilgan (qayta tekshirib tasdiqlandi)

### 1. ✅ Ro'yxatdan o'tishda `role` maydoni endi tekshiriladi
**Fayl:** `server/routes/auth.cjs`, `POST /register`

Endi: `const safeRole = role === "employer" ? "employer" : "specialist";` — `"admin"` yoki boshqa qiymat kira olmaydi.

### 2. ✅ Google OAuth'dagi xuddi shu muammo ham tuzatilgan
**Fayl:** `server/routes/auth.cjs`, `GET /callback/google`

Endi: `const role = req.query.state === "employer" ? "employer" : "specialist";` — whitelist qo'llanilgan.

### 3. ✅ Standart admin paroli endi xavfsiz
**Fayllar:** `server/seed.cjs`, `src/pages/Login.jsx`

- Login sahifasidagi "Admin sifatida kirish" tugmasi (hardcoded email/parol bilan) butunlay olib tashlangan.
- `seed.cjs`: agar `ADMIN_PASSWORD` env o'zgaruvchisi berilmasa, endi qattiq yozilgan `"Admin123!"` o'rniga **tasodifiy** parol generatsiya qilinadi va faqat birinchi marta konsolga chiqariladi ("will not be shown again"). Keyingi qayta ishga tushirishlarda mavjud parol ustidan yozilmaydi.

### 4. ✅ CORS endi cheklangan
**Fayl:** `server/index.cjs`

Endi faqat `allowedOrigins` ro'yxatidagi domenlar (`FRONTEND_URL`, `ALLOWED_ORIGINS` env orqali) qabul qilinadi — na Express CORS, na Socket.io CORS ochiq emas.

### 5. ✅ Zakaz statusi endi holat-mashinasi bilan boshqariladi
**Fayl:** `server/routes/orders.cjs`

Yangi `canTransitionOrder()` funksiyasi qo'shilgan — masalan, `Yangi → Qabul qilindi` faqat specialist tomonidan, `Yangi → Bekor qilindi` faqat employer tomonidan bajarilishi mumkin. Noto'g'ri o'tish `409` xato bilan rad etiladi. (Eslatma: `Qabul qilindi`/`Jarayonda`dan "Bekor qilindi"ga qaytish yo'li yo'q — agar bu qasddan bo'lmasa, birga tekshirib ko'ring.)

### 6. ✅ Status qiymatlari endi whitelist bilan tekshiriladi
**Fayllar:** `server/routes/orders.cjs`, `server/routes/applications.cjs`

Ikkalasida ham `ORDER_STATUSES` / `APPLICATION_STATUSES` ro'yxati qo'shilgan, ro'yxatdan tashqari qiymat `400` bilan rad etiladi.

### 7. ✅ Token bekor qilish endi ishlaydi
**Fayllar:** `server/middleware/auth.cjs`, `server/routes/auth.cjs`

`POST /auth/logout` endi `token_version`ni oshiradi, JWT payload'iga `tokenVersion` qo'shilgan va `authMiddleware` har so'rovda buni bazadagi qiymat bilan solishtiradi — "chiqish" tugmasi endi eski tokenni haqiqatan ham bekor qiladi. (Token hamon `localStorage`'da saqlanadi — bu XSS'ga nisbatan tabiiy zaiflik bo'lib qoladi, lekin bu kam uchraydigan, keng tarqalgan amaliyot.)

---

## 🟡 Hali ochiq — funksional kamchiliklar

### 8. "AI Kadrlar yordamchisi" — yarim tuzatilgan
**Fayllar:** `src/pages/Home.jsx` (✅ endi `/api/ai/match-jobs`ni chaqiradi), `src/pages/AiChat.jsx` (❌ hamon eski holicha)

Mutaxassisning bosh sahifasidagi "Sizga mos takliflar" bo'limi endi haqiqiy OpenAI orqali ishlaydi. Ammo ilovaning eng ko'zga tashlanadigan joyi — **AI Chat sahifasining o'zi** (`AiChat.jsx`) hamon `generateResponse()` (`src/lib/aiSearch.js`) orqali oddiy kalit-so'z qidiruvi bilan javob beradi, haqiqiy AI'ga umuman ulanmagan. Foydalanuvchi suhbat oynasida "AI" bilan gaplashyapman deb o'ylaydi, aslida oldindan yozilgan qoidalar bilan gaplashadi.

### 9. "Nizo ochish" (dispute) — hamon frontendda yo'q
**Fayl:** `server/routes/orders.cjs`, `POST /:id/dispute` — o'zgarmagan

Backend endi state-machine bilan yanada mustahkamlangan bo'lsa-da, nizo ochish funksiyasini chaqiradigan tugma/forma `src/` ichida hamon yo'q.

### 10. (Yangi topilma) "Yordam so'rash" (support ticket) tizimi ham frontendda yo'q
**Fayllar:** `server/routes/support.cjs` (to'liq tayyor: yaratish + ro'yxat), `server/routes/admin.cjs` (`/support` — admin javob berish paneli tayyor)

Xuddi nizo funksiyasi kabi — support ticket ochish uchun backend va admin-panel to'liq ishlaydi, lekin oddiy foydalanuvchi buni ochadigan hech qanday joy (masalan profil sahifasida "Yordam" tugmasi) yo'q.

### 11. Moslik foizi (match %) hamon ikki xil hisoblanadi
**Fayl:** `server/routes/applications.cjs` (69-qator) — o'zgarmagan

```js
const matchPercent = Math.floor(60 + Math.random() * 35);
```
Ariza yuborilganda hamon tasodifiy son ishlatiladi, `computeMatch()`dagi haqiqiy hisob-kitobdan farqli.

### 12. Xabar yuborishning REST yo'li ishlatilmaydi
**Fayllar:** `server/routes/chats.cjs` (`POST /:id/messages`), `src/pages/Chat.jsx` — o'zgarmagan

### 13. `/statistics` sahifasi ish beruvchi uchun bo'sh chiqadi
**Fayl:** `src/pages/Statistics.jsx` — o'zgarmagan

### 14. (Yangi, kichik) O'lik/foydasiz endpoint
**Fayl:** `server/routes/specialists.cjs`, `GET /me/profile` (66-68 qatorlar)

```js
router.get("/me/profile", (req, res) => { res.json({ ok: true }); });
```
Auth yo'q, hech narsa qaytarmaydi, hech qayerda chaqirilmaydi — ehtimol eskirgan qoldiq kod.

### 15. (Yangi, kichik) Demo akkauntlar production uchun xavfli
**Fayl:** `src/pages/Login.jsx` — "Tezkor kirish" bo'limi

Uchta demo akkaunt (`aziz@demo.com`, `nilufar@demo.com`, `hr@texnolabs.uz`) bitta umumiy parol (`12345678`) bilan bir tugma orqali kirish imkonini beradi. Ishlab chiqish/demo bosqichida qulay, lekin sayt haqiqiy foydalanuvchilar uchun ishga tushirilishidan oldin bu bo'lim olib tashlanishi kerak — aks holda istalgan kishi shu hisoblarga kirib, ulardan foydalanishi mumkin.

---

## Xulosa

Birinchi hisobotdagi eng jiddiy xavfsizlik teshiklarining **barchasi (1-7)** allaqachon tuzatilgan — buni tasdiqlayman. Qolgan muammolar endi xavfsizlik emas, ko'proq **"yarim qurilgan funksiya"** turkumiga kiradi: backend tayyor, frontend yo'q (nizo, support) yoki ikki joyda ikki xil natija beradi (AI Chat, match %). Bular ilovaning ishonchliligiga emas, foydalanuvchi tajribasiga ta'sir qiladi — shoshilinch emas, lekin e'tiborga loyiq.
