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

    // ---- Video / audio call signaling (WebRTC, face-to-face) ----
    // In-memory registry: callId -> { chatId, callerId, targetId, isVideo }
    // Socket instance does not have a shared map, so attach to io object.
    if (!io._calls) io._calls = new Map();
    const calls = io._calls;

    async function getCallTarget(chatId) {
      const chat = await db.prepare("SELECT * FROM chats WHERE id = ?").get(chatId);
      if (!chat) return null;
      if (chat.user1_id === userId) return chat.user2_id;
      if (chat.user2_id === userId) return chat.user1_id;
      return null;
    }

    socket.on("call:initiate", async ({ chatId, isVideo, callId: clientCallId }) => {
      try {
        const targetId = await getCallTarget(chatId);
        if (!targetId) return;
        const caller = await db.prepare("SELECT id, name FROM users WHERE id = ?").get(userId);
        const callId = clientCallId || `${Date.now()}_${userId}_${targetId}`;
        if (calls.has(callId)) return;
        calls.set(callId, { chatId, callerId: userId, targetId, isVideo: isVideo !== false });
        socket.join(`call_${callId}`);
        io.to(`user_${targetId}`).emit("call:incoming", {
          callId,
          chatId,
          fromUserId: userId,
          fromName: caller?.name || "Foydalanuvchi",
          isVideo: isVideo !== false,
        });
      } catch (err) {
        console.error("call:initiate error:", err);
      }
    });

    socket.on("call:accept", async ({ callId }) => {
      try {
        const call = calls.get(callId);
        if (!call) return;
        if (userId !== call.targetId) return;
        socket.join(`call_${callId}`);
        io.to(`user_${call.callerId}`).emit("call:accepted", { callId, chatId: call.chatId });
      } catch (err) {
        console.error("call:accept error:", err);
      }
    });

    socket.on("call:reject", async ({ callId }) => {
      try {
        const call = calls.get(callId);
        if (!call) return;
        io.to(`user_${call.callerId}`).emit("call:rejected", { callId });
        io.to(`user_${call.targetId}`).emit("call:ended", { callId, reason: "rejected" });
        calls.delete(callId);
      } catch (err) {
        console.error("call:reject error:", err);
      }
    });

    socket.on("call:cancel", async ({ callId }) => {
      try {
        const call = calls.get(callId);
        if (!call) return;
        if (userId !== call.callerId) return;
        io.to(`user_${call.targetId}`).emit("call:cancelled", { callId });
        calls.delete(callId);
      } catch (err) {
        console.error("call:cancel error:", err);
      }
    });

    socket.on("call:hangup", async ({ callId }) => {
      try {
        const call = calls.get(callId);
        if (!call) {
          // Still broadcast to room in case registry was cleared
          socket.to(`call_${callId}`).emit("call:ended", { callId, reason: "hangup" });
          return;
        }
        const otherId = userId === call.callerId ? call.targetId : call.callerId;
        io.to(`user_${otherId}`).emit("call:ended", { callId, reason: "hangup" });
        socket.to(`call_${callId}`).emit("call:ended", { callId, reason: "hangup" });
        calls.delete(callId);
      } catch (err) {
        console.error("call:hangup error:", err);
      }
    });

    socket.on("call:offer", ({ callId, sdp }) => {
      const call = calls.get(callId);
      if (!call) return;
      const otherId = userId === call.callerId ? call.targetId : call.callerId;
      io.to(`user_${otherId}`).emit("call:offer", { callId, sdp });
    });

    socket.on("call:answer", ({ callId, sdp }) => {
      const call = calls.get(callId);
      if (!call) return;
      const otherId = userId === call.callerId ? call.targetId : call.callerId;
      io.to(`user_${otherId}`).emit("call:answer", { callId, sdp });
    });

    socket.on("call:ice", ({ callId, candidate }) => {
      const call = calls.get(callId);
      if (!call) return;
      const otherId = userId === call.callerId ? call.targetId : call.callerId;
      io.to(`user_${otherId}`).emit("call:ice", { callId, candidate });
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
    await db.init();
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
