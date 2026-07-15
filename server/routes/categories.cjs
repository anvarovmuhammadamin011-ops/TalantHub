const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const { type } = req.query;
    let sql = "SELECT id, group_name, name, type FROM categories WHERE active = 1";
    const params = [];
    if (type) { sql += " AND type = ?"; params.push(type); }
    sql += " ORDER BY type, group_name, sort_order, name";
    const categories = db.prepare(sql).all(...params);
    res.json({ categories });
  } catch (err) {
    console.error("Categories list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
