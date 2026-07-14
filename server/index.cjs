const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const db = require("./db.cjs");
const seed = require("./seed.cjs");
const { JWT_SECRET } = require("./middleware/auth.cjs");

const authRoutes = require("./routes/auth.cjs");
const vacancyRoutes = require("./routes/vacancies.cjs");
const specialistRoutes = require("./routes/specialists.cjs");
const applicationRoutes = require("./routes/applications.cjs");
const chatRoutes = require("./routes/chats.cjs");
const orderRoutes = require("./routes/orders.cjs");
const notificationRoutes = require("./routes/notifications.cjs");
const statsRoutes = require("./routes/stats.cjs");
const adminRoutes = require("./routes/admin.cjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin", adminRoutes);

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
