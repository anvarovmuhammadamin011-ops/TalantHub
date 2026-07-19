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
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const db = require("./db.cjs");
const seed = require("./seed.cjs");
const { JWT_SECRET } = require("./middleware/auth.cjs");
const { rateLimit } = require("./middleware/rateLimit.cjs");

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

function corsOriginCheck(origin, callback) {
  // No Origin header (native apps, curl, server-to-server) — nothing for CORS to enforce.
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error("Not allowed by CORS"));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });

app.set("io", io);

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return socket.disconnect();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    socket.join(`user_${userId}`);
    socket.userId = userId;

    db.prepare("UPDATE users SET online = 1 WHERE id = ?").run(userId);

    io.emit("user_online", { userId, online: true });

    function isChatMember(chatId) {
      const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
      return chat && (chat.user1_id === userId || chat.user2_id === userId);
    }

    socket.on("join_chat", (chatId) => {
      if (!isChatMember(chatId)) return;
      socket.join(`chat_${chatId}`);
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("send_message", ({ chatId, text }) => {
      if (!text || !chatId || !isChatMember(chatId)) return;

      const result = db.prepare("INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)").run(chatId, userId, text);

      const message = db.prepare(`
        SELECT m.*, u.name as sender_name
        FROM messages m LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      io.to(`chat_${chatId}`).emit("new_message", message);

      const chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
      if (chat) {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        io.to(`user_${otherUserId}`).emit("new_message_notification", {
          chatId, message, from: userId
        });

        const senderName = message.sender_name || "Foydalanuvchi";
        const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
        db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'message', ?, ?, '/chat')`)
          .run(otherUserId, `${senderName} xabar yozdi`, preview);
        io.to(`user_${otherUserId}`).emit("notification", {
          type: "message", title: `${senderName} xabar yozdi`, description: preview
        });
      }
    });

    socket.on("typing", ({ chatId }) => {
      if (!isChatMember(chatId)) return;
      socket.to(`chat_${chatId}`).emit("user_typing", { userId, chatId });
    });

    socket.on("stop_typing", ({ chatId }) => {
      if (!isChatMember(chatId)) return;
      socket.to(`chat_${chatId}`).emit("user_stop_typing", { userId, chatId });
    });

    socket.on("disconnect", () => {
      db.prepare("UPDATE users SET online = 0 WHERE id = ?").run(userId);
      io.emit("user_online", { userId, online: false });
    });
  } catch {
    socket.disconnect();
  }
});

app.use(express.static(path.join(__dirname, "../dist")));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

seed();
seed.ensureAdmin();

server.listen(process.env.PORT || 4000, () => {
  console.log(`TalentHub server running on http://localhost:${process.env.PORT || 4000}`);
});
