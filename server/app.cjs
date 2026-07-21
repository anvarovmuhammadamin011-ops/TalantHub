const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Must be initialized before other imports so Sentry's auto-instrumentation can hook in.
// No-ops entirely (no network calls, no overhead) when SENTRY_DSN isn't set.
const Sentry = require("@sentry/node");
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");

const authRoutes = require("./routes/auth.cjs");
const vacancyRoutes = require("./routes/vacancies.cjs");
const specialistRoutes = require("./routes/specialists.cjs");
const applicationRoutes = require("./routes/applications.cjs");
const chatRoutes = require("./routes/chats.cjs");
const orderRoutes = require("./routes/orders.cjs");
const notificationRoutes = require("./routes/notifications.cjs");
const statsRoutes = require("./routes/stats.cjs");
const adminRoutes = require("./routes/admin.cjs");
const reportRoutes = require("./routes/reports.cjs");
const supportRoutes = require("./routes/support.cjs");
const verificationRoutes = require("./routes/verification.cjs");
const categoryRoutes = require("./routes/categories.cjs");
const aiRoutes = require("./routes/ai.cjs");
const walletRoutes = require("./routes/wallet.cjs");
const uploadRoutes = require("./routes/upload.cjs");
const savedSearchRoutes = require("./routes/savedSearches.cjs");
const companyRoutes = require("./routes/companies.cjs");
const analyticsRoutes = require("./routes/analytics.cjs");

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : []),
];

// Vite picks the next free port when 5173 is taken (5174, 5175, ...), so any fixed port
// allowlist breaks the moment two dev servers run side by side. Any localhost/127.0.0.1
// origin is safe to allow regardless of port — production never runs on localhost.
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function corsOriginCheck(origin, callback) {
  // No Origin header (native apps, curl, server-to-server) — nothing for CORS to enforce.
  if (!origin || allowedOrigins.includes(origin) || LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
  callback(null, false);
}

const app = express();

app.use(helmet({
  // This server also serves the built SPA (see the static/fallback block below) and the
  // frontend can be hosted on a different origin (Vercel) that needs to load /uploads
  // images — a default CSP or same-origin resource policy would break both.
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "no-referrer" },
}));
app.use(cors({ origin: corsOriginCheck }));
app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());

const { rateLimit } = require("./middleware/rateLimit.cjs");
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/saved-searches", savedSearchRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/analytics", analyticsRoutes);

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Static/SPA serving only applies when this app runs as the single process serving
// everything (local dev, Render). On Vercel, this function only ever receives /api/*
// traffic (see vercel.json) and the dist/ build isn't bundled with it — falling through to
// sendFile there would throw ENOENT, so an unmatched /api/* path gets a plain 404 instead.
if (!process.env.VERCEL) {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.static(path.join(__dirname, "../dist")));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

// Final safety net — without this, an unhandled error in any route reaches Express's
// default handler, which leaks a stack trace and always responds with a bare 500.
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server xatoligi" });
});

module.exports = app;
