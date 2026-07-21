const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app.cjs");
const db = require("./db.cjs");
const seed = require("./seed.cjs");
const { JWT_SECRET } = require("./middleware/auth.cjs");

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : []),
];

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });

app.set("io", io);

io.on("connection", async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return socket.disconnect();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    socket.join(`user_${userId}`);
    socket.userId = userId;

    const socketUser = await db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
    if (socketUser?.role === "admin") socket.join("admin");

    await db.prepare("UPDATE users SET online = 1 WHERE id = ?").run(userId);

    io.emit("user_online", { userId, online: true });

    async function isChatMember(chatId) {
      const chat = await db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
      return chat && (chat.user1_id === userId || chat.user2_id === userId);
    }

    socket.on("join_chat", async (chatId) => {
      try {
        if (!(await isChatMember(chatId))) return;
        socket.join(`chat_${chatId}`);
      } catch (err) {
        console.error("join_chat error:", err);
      }
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    socket.on("send_message", async ({ chatId, text }) => {
      try {
        if (!text || !chatId || !(await isChatMember(chatId))) return;

        const result = await db.prepare("INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)").run(chatId, userId, text);

        const message = await db.prepare(`
          SELECT m.*, u.name as sender_name
          FROM messages m LEFT JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        io.to(`chat_${chatId}`).emit("new_message", message);

        const chat = await db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
        if (chat) {
          const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
          io.to(`user_${otherUserId}`).emit("new_message_notification", {
            chatId, message, from: userId
          });

          const senderName = message.sender_name || "Foydalanuvchi";
          const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
          await db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'message', ?, ?, '/chat')`)
            .run(otherUserId, `${senderName} xabar yozdi`, preview);
          io.to(`user_${otherUserId}`).emit("notification", {
            type: "message", title: `${senderName} xabar yozdi`, description: preview
          });
        }
      } catch (err) {
        console.error("send_message error:", err);
      }
    });

    socket.on("typing", async ({ chatId }) => {
      try {
        if (!(await isChatMember(chatId))) return;
        socket.to(`chat_${chatId}`).emit("user_typing", { userId, chatId });
      } catch (err) {
        console.error("typing error:", err);
      }
    });

    socket.on("stop_typing", async ({ chatId }) => {
      try {
        if (!(await isChatMember(chatId))) return;
        socket.to(`chat_${chatId}`).emit("user_stop_typing", { userId, chatId });
      } catch (err) {
        console.error("stop_typing error:", err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        await db.prepare("UPDATE users SET online = 0 WHERE id = ?").run(userId);
        io.emit("user_online", { userId, online: false });
      } catch (err) {
        console.error("disconnect handler error:", err);
      }
    });
  } catch {
    socket.disconnect();
  }
});

// CommonJS has no top-level await, and there's no synchronous Postgres driver — the whole
// boot sequence (schema, demo/admin seed data, then start listening) has to run inside an
// async wrapper. db.initSchema() didn't need a call site under better-sqlite3 (CREATE
// TABLE/ALTER TABLE ran synchronously at require() time); it does now.
(async () => {
  try {
    await db.initSchema();
    await seed();
    await seed.ensureAdmin();

    server.listen(process.env.PORT || 4000, () => {
      console.log(`TalentHub server running on http://localhost:${process.env.PORT || 4000}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
})();
