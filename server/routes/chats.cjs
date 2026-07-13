const express = require("express");
const db = require("../db.cjs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  try {
    const chats = db.prepare(`
      SELECT c.*,
        CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END as other_name,
        CASE WHEN c.user1_id = ? THEN u2.id ELSE u1.id END as other_id,
        m.text as last_message,
        m.created_at as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != ? AND read = 0) as unread_count
      FROM chats c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN messages m ON m.id = (SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1)
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY m.created_at DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId);

    res.json({ chats });
  } catch (err) {
    console.error("Chats list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/:id/messages", authMiddleware, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.id);

    db.prepare("UPDATE messages SET read = 1 WHERE chat_id = ? AND sender_id != ?").run(req.params.id, req.userId);

    res.json({ messages });
  } catch (err) {
    console.error("Messages error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/:id/messages", authMiddleware, (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Xabar matni kerak" });

    const result = db.prepare("INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)").run(req.params.id, req.userId, text);

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json({ message });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/create", authMiddleware, (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "Foydalanuvchi ID kerak" });

    let chat = db.prepare(`
      SELECT * FROM chats WHERE
      (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.userId, user_id, user_id, req.userId);

    if (!chat) {
      const result = db.prepare("INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)").run(req.userId, user_id);
      chat = db.prepare("SELECT * FROM chats WHERE id = ?").get(result.lastInsertRowid);
    }

    res.json({ chat });
  } catch (err) {
    console.error("Create chat error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
