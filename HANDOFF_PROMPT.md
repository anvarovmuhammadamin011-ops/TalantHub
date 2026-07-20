# TalentHub — Complete Handoff Prompt

## Project Overview

**TalentHub** — full-stack HR platform for IT specialists and teachers in Uzbekistan. Production/sellable quality.

**Location:** `C:\Users\Victus\Desktop\Hr\talenthub`
**GitHub:** `https://github.com/anvarovmuhammadamin011-ops/TalantHub.git` (branch: `main`)

**Stack:**
- Frontend: React 19 + Vite 8 + Tailwind CSS v4 + Recharts + Lucide React + React Router DOM 7
- Backend: Express 5 + better-sqlite3 (current) / PostgreSQL (migration in progress) + Socket.io + JWT
- Mobile: Capacitor Android
- Testing: Playwright E2E
- Language: Uzbek (UI), code in English

**Run locally:**
```
npm run server   # backend on :4000 (needs restart after every server/ change)
npm run dev      # frontend on :5173 (Vite proxies /api and /socket.io to :4000)
```

**Demo accounts (seeded):** `aziz@demo.com` / `12345678` (specialist), `hr@texnolabs.uz` / `12345678` (employer), `admin@talenthub.uz` / `Admin123!` (admin)

**Login rate limit:** `/api/auth/login` and `/api/auth/register` limited to 10 requests / 15 min per IP. During testing, log in once and reuse the token. If rate-limited, restart the backend to clear in-memory bucket.

**Verification pattern:** `npm run build` → restart backend → curl affected endpoints → `npm run test:e2e` for UI changes. Clean up test data after.

---

## What's Already Done (DO NOT REDO)

Everything below is committed to `main` and working:

### Core Features
- Specialist home dashboard (7 sections: stats, orders, AI matches, verification, chat, chart, AI banner)
- Employer home dashboard
- Registration wizard (5 steps: role, fields, personal info, SMS, confirm)
- Login with demo quick-login buttons
- Google OAuth (passport-google-oauth20) — **code complete, needs `.env` credentials**
- Phone number country auto-detection (libphonenumber-js)
- Mutual rating system (employer→specialist AND specialist→employer, 1-5 stars + review)
- Diploma verification system (document URL, institution, specialty, year + admin approve/reject)
- AI job matching (server-side OpenAI for specialists, fallback to client-side computeMatch)

### Vacancy & Application System
- Vacancy CRUD (region/district picker, start date, hourly employment type)
- Quick Apply (cover letter + bulk apply)
- Vacancy applicant management
- Saved jobs/bookmarks
- Job search agent (saved searches with new-match notifications)

### Communication
- Real-time chat (Socket.io)
- Notifications system
- Support tickets (both sides)
- Order disputes (both sides)

### Admin Panel (11 tabs)
- Overview, Users, Vacancies, Orders, Finance, Tariffs, SMS/Push, Health, i18n, Moderation, Settings
- Admin user detail pages
- Admin vacancy detail pages

### Technical
- PWA installability (service worker, icons, install prompt)
- Onboarding wizard post-registration
- Toast notification system
- Skeleton loaders
- API security (helmet, zod validation on high-risk routes, rate limiting)
- Self-hosted pageview analytics
- Sentry error monitoring (wired, inactive — needs DSN)
- Playwright E2E tests (auth, vacancy create, vacancy apply)
- Socket.io proxy fix in Vite config
- Company profile pages
- Wallet/balance system
- Content moderation system
- i18n translations (uz/ru/en)

### Files with Dual Implementations (SQLite + Postgres drafts)
These `.postgres.cjs` files exist but are NOT wired in, NOT tested:
```
server/db.postgres.cjs
server/middleware/auth.postgres.cjs
server/middleware/requireAdmin.postgres.cjs
server/routes/categories.postgres.cjs
server/routes/analytics.postgres.cjs
server/routes/reports.postgres.cjs
server/routes/companies.postgres.cjs
server/routes/support.postgres.cjs
server/routes/notifications.postgres.cjs
server/routes/specialists.postgres.cjs
server/routes/stats.postgres.cjs
server/routes/savedSearches.postgres.cjs
server/routes/ai.postgres.cjs
server/routes/chats.postgres.cjs
server/routes/vacancies.postgres.cjs
server/lib/savedSearchAgent.postgres.cjs
```

---

## REMAINING TASKS (what you need to do)

### TASK 1: Google OAuth — Activate with Real Credentials

**Status:** Code is 100% complete. Backend uses `passport-google-oauth20`, frontend has Google buttons on Login + Register pages, `AuthCallback.jsx` handles the redirect. BUT `server/.env` has NO `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`.

**What to do:**
1. Get credentials from user (or create them):
   - Go to https://console.cloud.google.com
   - Create project "TalentHub"
   - APIs & Services → OAuth consent screen → External → Create
   - App name: TalentHub, add user email, save
   - Credentials → Create Credentials → OAuth client ID → Web application
   - Authorized redirect URI: `http://localhost:4000/api/auth/callback/google`
   - Copy Client ID and Client Secret
2. Add to `server/.env`:
   ```
   GOOGLE_CLIENT_ID=<the_client_id>
   GOOGLE_CLIENT_SECRET=<the_client_secret>
   GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/callback/google
   FRONTEND_URL=http://localhost:5173
   ```
3. Restart server, test: click "Google bilan kirish" → should redirect to Google consent → back to `/auth/callback?token=xxx`

**Key files:**
- `server/routes/auth.cjs` lines 231-258 (Google routes)
- `server/index.cjs` (passport.initialize() already added)
- `src/pages/Login.jsx` (Google button)
- `src/pages/Register.jsx` (Google button)
- `src/pages/AuthCallback.jsx` (token handler)

### TASK 2: Sentry — Activate with DSN

**Status:** Code fully wired. `@sentry/node` in `server/index.cjs`, `@sentry/react` in `src/main.jsx`, `ErrorBoundary.jsx` reports via Sentry. All gated on env vars.

**What to do:**
1. Get DSN from user (sentry.io → create project → copy DSN)
2. Add to `server/.env`: `SENTRY_DSN=<dsn>`
3. Add to root `.env` (create if needed): `VITE_SENTRY_DSN=<dsn>`
4. Restart both servers
5. Verify: trigger deliberate backend error + frontend ErrorBoundary error → both appear in Sentry dashboard

### TASK 3: PostgreSQL Migration (THE BIG ONE)

**Why:** Render free tier has ephemeral filesystem — SQLite file can vanish. Must migrate to PostgreSQL on Neon.

**Blocking prerequisite:** You need `DATABASE_URL` from user. Get a Neon account (neon.tech), create project, use the POOLED connection string (hostname contains `-pooler`):
```
postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```
Put in `server/.env` as `DATABASE_URL=...`.

**Architecture (already decided, partially implemented):**
- `server/db.postgres.cjs` is the new db adapter. Uses `pg.Pool`, converts `?` to `$1,$2,...`, auto-appends `RETURNING id` to INSERTs.
- Exports: `db.prepare(sql)` → `{ get, all, run }` (async), `db.transaction(fn)`, `db.initSchema()`
- All route files import `const db = require("../db.cjs")` — when migration is done, swap to `db.postgres.cjs`
- Call sites just need `async`/`await` added, not rewritten SQL

**Key gotchas (already discovered, apply consistently):**
1. `LIKE` → `ILIKE` for all search/filter queries (~11 sites)
2. `datetime('now', '-N days')` → `NOW() - INTERVAL 'N days'` (~8 sites, mostly admin.cjs)
3. `INSERT OR IGNORE` → `INSERT ... ON CONFLICT (...) DO NOTHING` (settings, saved_vacancies, categories, translations)
4. 5 real `db.transaction()` sites need restructuring: wallet.cjs (financial!), admin.cjs broadcast, seed.cjs x2, tg-import-candidates.cjs
5. Socket.io handlers: each needs its own try/catch once async (outer try/catch won't catch rejected promises)
6. Standalone scripts need `await db.initSchema()` at top
7. Global pg type parsers: TIMESTAMP → string, COUNT/SUM → number (critical: `"0" === 0` is false)

**Files already drafted (16 files, NOT wired in, NOT tested):**
See list above in "What's Done" section.

**Files NOT yet drafted (still need conversion):**
| File | Call sites | Notes |
|---|---|---|
| `server/routes/applications.cjs` | ~17 | Core flow |
| `server/routes/orders.cjs` | ~23 | Status state machine + disputes |
| `server/routes/verification.cjs` | ~14 | Moderate |
| `server/routes/wallet.cjs` | ~10 | ELEVATED RISK — financial transactions |
| `server/routes/upload.cjs` | 0 | Probably no changes needed |
| `server/routes/admin.cjs` | ~128 | LARGEST. Convert sub-section by sub-section |
| `server/index.cjs` | ~7 socket + startup | Socket handlers + async boot sequence |
| `server/seed.cjs` | ~18, incl. 2 transactions | First true cold-start integration test |
| `server/scripts/tg-import-employees.cjs` | ~2 | Add `await db.initSchema()` |
| `server/scripts/tg-import-candidates.cjs` | ~4, incl. 1 transaction | Same |
| `server/scripts/tg-request-code.cjs` | 0 | Likely no changes |
| `server/routes/auth.cjs` | ~25 | Has Google OAuth callback (not a route handler) |

**Cutover sequence:**
1. Verify `db.postgres.cjs` standalone first: initSchema, INSERT round-trip, SELECT, COUNT (number not string), TIMESTAMP (string not Date), ON CONFLICT, transaction commit + rollback
2. Convert each remaining file, restart + curl-test after each
3. Rename `.postgres.cjs` to replace originals, delete old SQLite versions
4. Run full `npm run test:e2e` + manual curl smoke test + Playwright admin panel pass
5. Remove `better-sqlite3` from package.json, clean install, verify again
6. Production cutover (set DATABASE_URL on Render) is SEPARATE — user decides when

**NEON gotcha:** First-request-after-idle latency from free-tier autosuspend is expected, not a regression.

---

## ENV Vars Reference

### `server/.env` (currently only has ADMIN_PASSWORD)
```
ADMIN_PASSWORD=Admin123!

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/callback/google
FRONTEND_URL=http://localhost:5173

# OpenAI
OPENAI_API_KEY=

# Sentry
SENTRY_DSN=

# PostgreSQL (Neon — use POOLED connection string)
DATABASE_URL=
```

### Root `.env` (does not exist yet — create for frontend)
```
VITE_SENTRY_DSN=
```

### `render.yaml` secrets (for production deployment)
Already lists: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, FRONTEND_URL, OPENAI_API_KEY, ADMIN_PASSWORD, TELEGRAM_*
Missing: DATABASE_URL, SENTRY_DSN

---

## Design System

- Primary: `#0A0A0B` (ink), Accent: `#3730A3`, Background: `#FAFAFA`
- Font: Inter (sans-serif)
- Minimal, LinkedIn-like aesthetic
- Tailwind CSS v4 with `@tailwindcss/vite`
- Lucide React icons

## DB Tables (17+)

users, vacancies, applications, orders, notifications, chats, messages, admin_logs, transactions, tariffs, promo_codes, sms_logs, push_logs, translations, content_flags, tariffs_users, categories, verification_requests, disputes, support_tickets, settings, login_events, saved_vacancies, saved_searches, saved_search_matches, companies, pageviews

## Git History (recent)

```
3f16576 wip: Postgres migration foundation (not wired in, untested)
61be82e feat: support ticket + dispute UI, dead endpoint cleanup
764220d fix: proxy /socket.io in Vite dev server
01a9e04 test: add real Playwright E2E suite
fb64c94 feat: self-hosted pageview analytics + Sentry error monitoring
0344599 feat: simplify HR dashboard, add toast system + skeleton loaders
d87697b feat: Quick Apply + API security hardening
ab35d45 feat: public company profile pages
20aacdd feat: vacancy form — job start date, region/district, hourly type
bf8801f feat: PWA installability
559a13c feat: post-registration onboarding wizard
7205849 feat: job search agent — saved searches with notifications
5837d4d feat: saved jobs/bookmarks + i18n/color polish
3dd5611 feat: finance, settings, RBAC, content moderation for admin
bf79bc0 fix: Google OAuth — passport.initialize(), FRONTEND_URL redirect
2165e32 feat: Google OAuth, phone country detection, mutual rating, verification, AI matching
3579ba5 feat: add specialist Home dashboard with 7 sections
```
