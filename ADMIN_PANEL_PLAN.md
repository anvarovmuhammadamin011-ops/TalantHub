# TalentHub — To'liq Admin Panel: Implementatsiya Spetsifikatsiyasi

Bu hujjat loyihaning joriy kod bazasini (server/*.cjs, src/pages/*.jsx) sinchiklab o'qib tayyorlangan. Har bir qadam mavjud konventsiyalarga (authMiddleware, `db.prepare` pattern, `--color-*` tailwind tokenlari, StatusBadge/EmptyState komponentlari) mos yozilgan. Buni Claude Code yoki boshqa agentga to'g'ridan-to'g'ri berib, "shu spetsifikatsiya bo'yicha admin panelni qur" deyish mumkin.

## 0. Avval tuzatilishi shart bo'lgan mavjud xato

`server/db.cjs`da `vacancies` jadvalida **`status` ustuni umuman yo'q**, lekin `server/routes/vacancies.cjs` (PATCH `/:id`) va `src/pages/EmployerDashboard.jsx` (`toggleVacancyStatus`) bu ustunni ishlatadi (`status = COALESCE(?, status)`). Bu chaqirilganda SQLite "no such column: status" xatosi berishi kerak. Admin panelda vakansiyani "yashirish" funksiyasi ham shu ustunga tayanadi, shuning uchun buni birinchi qadam sifatida tuzating:

```js
// server/db.cjs — mavjud ALTER bloklari qatoriga qo'shing
try {
  db.exec(`ALTER TABLE vacancies ADD COLUMN status TEXT DEFAULT 'Faol'`);
} catch (e) {}
```

## 1. Ma'lumotlar bazasi o'zgarishlari (server/db.cjs)

Mavjud `try { db.exec(...ALTER...) } catch (e) {}` patterniga qo'shing:

```js
try {
  db.exec(`ALTER TABLE users ADD COLUMN blocked INTEGER DEFAULT 0`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN blocked_reason TEXT DEFAULT ''`);
} catch (e) {}
```

`role` ustuni allaqachon erkin `TEXT DEFAULT 'specialist'` — schema o'zgarishi shart emas, `role = 'admin'` qiymatini shunchaki yozish kifoya.

## 2. Yangi middleware: server/middleware/requireAdmin.cjs

```js
const db = require("../db.cjs");

function requireAdmin(req, res, next) {
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Faqat administrator uchun ruxsat" });
  }
  next();
}

module.exports = { requireAdmin };
```

Har bir admin route'da `authMiddleware` dan keyin ishlating: `router.get("/users", authMiddleware, requireAdmin, ...)`.

## 3. Yangi fayl: server/routes/admin.cjs

Mavjud routelardagi error-handling patternini (`try/catch` + `console.error` + `500`) va JSON parse qilish uslubini takrorlang. Endpointlar:

- `GET /api/admin/stats` — umumiy statistika:
  ```js
  {
    users_total, specialists, employers, admins,
    vacancies_total, vacancies_active,
    orders_total, orders_active, orders_completed,
    applications_total, messages_total,
    new_users_7d
  }
  ```
  Har biri alohida `db.prepare("SELECT COUNT(*) as count FROM ...").get().count` so'rovi (mavjud `stats.cjs` uslubida).

- `GET /api/admin/users?search=&role=&status=&page=&limit=` — paginatsiyalangan ro'yxat. `search` — `name LIKE` yoki `email LIKE`. `role` — `specialist/employer/admin`. `status` — `blocked/active`. Qaytariladigan maydonlar: `id,name,email,phone,city,role,verified,blocked,rating,reviews_count,orders_count,created_at` (parolni qaytarmang).

- `PATCH /api/admin/users/:id` — body: `{ verified?, blocked?, blocked_reason? }`. Faqat shu maydonlarni yangilang (mavjud `auth.cjs`dagi `EDITABLE_FIELDS` patterniga o'xshab dinamik `sets`/`params` massividan foydalaning). **Muhim tekshiruv**: `if (Number(req.params.id) === req.userId) return res.status(400).json({error: "O'zingizni bloklay olmaysiz"})`.

- `GET /api/admin/vacancies?search=&status=` — barcha vakansiyalar + `employer_id` orqali `author_name` (JOIN users), + `(SELECT COUNT(*) FROM applications WHERE vacancy_id = v.id) as applications_count`.

- `PATCH /api/admin/vacancies/:id/status` — body `{ status }` ("Faol"/"Nofaol") — moderatsiya uchun yashirish, o'chirmasdan.

- `DELETE /api/admin/vacancies/:id` — admin har qanday vakansiyani o'chira oladi (egasiga qaramasdan). Avval `DELETE FROM applications WHERE vacancy_id = ?`, keyin vakansiyani o'chiring (`vacancies.cjs`dagi mavjud delete pattern bilan bir xil).

- `GET /api/admin/orders?status=` — barcha buyurtmalar, employer va specialist ismlari bilan JOIN qilingan (`orders.cjs`dagi GET `/` querysiga o'xshab, lekin `WHERE` shartisiz — hammasi).

- `GET /api/admin/applications?status=` (ixtiyoriy, lekin tavsiya) — barcha arizalar, vacancy title va specialist name bilan.

## 4. server/index.cjs ga ro'yxatga olish

```js
const adminRoutes = require("./routes/admin.cjs");
// ...
app.use("/api/admin", adminRoutes);
```

## 5. Bloklangan foydalanuvchini login qila olmasligi (server/routes/auth.cjs)

`router.post("/login", ...)` ichida parolni tekshirgandan **keyin** (xavfsizlik uchun — parol noto'g'ri bo'lsa ham, to'g'ri bo'lsa ham bir xil xabar bermaslik uchun avval parolni tekshiring, keyin blok holatini tekshiring):

```js
if (user.blocked) {
  return res.status(403).json({ error: "Hisobingiz bloklangan. Administrator bilan bog'laning." });
}
```

## 6. Admin hisobini yaratish (server/seed.cjs)

`seed()` funksiyasi butun jadval bo'sh bo'lgandagina ishlaydi (`if (existingUsers.count > 0) return`), lekin baza allaqachon to'ldirilgan (`talenthub.db` mavjud), shuning uchun admin hisobini **seed guardidan mustaqil**, har doim tekshiruvchi alohida funksiya sifatida qo'shing:

```js
function ensureAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@talenthub.uz");
  if (existing) return;

  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("O'zingiz_belgilaydigan_kuchli_parol", 10);

  db.prepare(`
    INSERT INTO users (name, email, password, role, verified)
    VALUES (?, ?, ?, 'admin', 1)
  `).run("Administrator", "admin@talenthub.uz", hash);

  console.log("Admin account created: admin@talenthub.uz");
}

module.exports = seed;
module.exports.ensureAdmin = ensureAdmin;
```

`server/index.cjs`da `seed();` qatoridan keyin `seed.ensureAdmin();` chaqiring. **Parolni haqiqiy production parol bilan almashtiring, bu faylni commit qilmang yoki .env orqali bering.**

## 7. Frontend — yo'nalish himoyasi: src/components/AdminRoute.jsx (yangi fayl)

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
```

`src/App.jsx`da mavjud `<ProtectedRoute />` ichiga joylashtiring (avval auth, keyin role tekshiriladi):

```jsx
import AdminRoute from "./components/AdminRoute";
import Admin from "./pages/Admin";
// ...
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    {/* mavjud route'lar ... */}
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<Admin />} />
    </Route>
  </Route>
</Route>
```

Eslatma: bu faqat UI qulayligi uchun (bloklamagan foydalanuvchi to'g'ridan-to'g'ri URL orqali kirmasin) — haqiqiy himoya backend'dagi `requireAdmin` middleware'da, chunki frontend tekshiruvini DevTools orqali chetlab o'tish mumkin.

## 8. Navbar'ga shartli havola (src/components/layout/Navbar.jsx)

`isEmployer` bilan bir qatorda:

```js
const isAdmin = user?.role === "admin";
```

`navLinks` massiviga qo'shing (masalan oxiriga, `Package`/`MessageSquare`dan keyin):

```js
...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : []),
```

`lucide-react` importiga `ShieldCheck` qo'shing.

## 9. Asosiy sahifa: src/pages/Admin.jsx (yangi fayl)

Mavjud dizayn tizimiga (`EmployerDashboard.jsx`dagi `bg-white rounded-xl border border-border p-5` kartalar, `StatusBadge`, `EmptyState`, lucide ikonalar, `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10` konteyner) mos qiling. Tarkib:

**Tab tuzilishi** (local `useState` bilan, alohida route emas — mavjud loyihada tab pattern yo'q, lekin oddiy `useState("overview")` bilan implementatsiya qiling):

1. **Umumiy** — `/admin/stats`dan olingan qiymatlar bilan stat-kartalar grid (`grid grid-cols-2 lg:grid-cols-4 gap-3`, `EmployerDashboard.jsx`dagi `statsCards` patterni bilan bir xil struktura): Foydalanuvchilar, Mutaxassislar, Ish beruvchilar, Vakansiyalar, Faol buyurtmalar, Tugallangan buyurtmalar, So'nggi 7 kunda ro'yxatdan o'tganlar.

2. **Foydalanuvchilar** — qidiruv input (`search`), rol filter dropdown (Hammasi/Specialist/Employer/Admin), jadval yoki karta ro'yxati: ism, email, rol (badge), reyting, ro'yxatdan o'tgan sana, "Verifikatsiya" toggle tugmasi (`VerifiedBadge` komponentiga o'xshab), "Bloklash/Blokdan chiqarish" tugmasi (qizil/yashil, `EmployerDashboard.jsx`dagi `deleteVacancy`dagi `confirm()` patterni bilan tasdiqlash so'rang). Bo'sh bo'lsa `EmptyState` ishlating.

3. **Vakansiyalar** — qidiruv + status filter, ro'yxat: sarlavha, kompaniya, employer nomi, ariza soni, holat badge (`StatusBadge`ga "Faol"/"Nofaol" tone'ini `statusTone` obyektiga qo'shish kerak bo'lishi mumkin), "Yashirish/Faollashtirish" va "O'chirish" tugmalari (ikkinchisida `confirm()`).

4. **Buyurtmalar** — faqat kuzatish uchun jadval: sarlavha, employer, specialist, narx, holat (`StatusBadge`), sana. Filtrlash status bo'yicha.

Barcha so'rovlar mavjud `api()` helper orqali (`src/lib/api.js`): masalan `api("/admin/users?search=" + q)`, `api(\`/admin/users/${id}\`, { method: "PATCH", body: { blocked: 1 } })`.

Yuklanish holatini boshqa sahifalar kabi `"Yuklanmoqda..."` matni bilan boshlang (loyihaning joriy konvensiyasi shu), lekin agar dizayn tavsiyalarimni ham qo'llamoqchi bo'lsangiz, shu yerda birinchi marta skeleton-loader kiritish yaxshi fursat.

## 10. Xavfsizlik nazorat ro'yxati (implementatsiyadan keyin tekshiring)

- Har bir `/api/admin/*` endpoint `authMiddleware` + `requireAdmin` ikkalasidan ham o'tishi shart — birontasi ham ochiq qolmasin.
- Admin o'zini bloklay olmasligi (`req.params.id === req.userId` tekshiruvi).
- Bloklangan foydalanuvchi login qila olmasligi, lekin xato xabari email/parol noto'g'ri ekanini oshkor qilmasligi.
- `admin@talenthub.uz` parolini production'da kuchli va maxfiy qiling, bu faylni (yoki parolni) reponi commit qilmang.

## 11. Tekshirish tartibi

1. `node server/index.cjs` (yoki `npm run server`) bilan backendni ishga tushiring — konsolda "Admin account created" chiqishi kerak (birinchi marta).
2. `admin@talenthub.uz` bilan kiring, `/admin` sahifasi ochilishini tekshiring.
3. Oddiy `specialist`/`employer` hisobi bilan kirib, `/admin`ga o'tishga urinib ko'ring — bosh sahifaga qaytarilishi kerak.
4. Bir foydalanuvchini bloklang, o'sha hisob bilan login qilishga urining — 403 va tushunarli xabar kelishi kerak.
5. Vakansiyani "Nofaol" qiling — agar public `GET /vacancies`ga `status = 'Faol'` filtri qo'shsangiz, u umumiy ro'yxatdan yo'qolishini tekshiring (hozircha public route bu filtrni qo'llamaydi — shuni ham shu bosqichda qo'shish tavsiya etiladi).
