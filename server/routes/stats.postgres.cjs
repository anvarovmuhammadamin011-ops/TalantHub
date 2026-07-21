const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

router.get("/overview", async (req, res) => {
  try {
    const specialists = (await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'specialist'").get()).count;
    const vacancies = (await db.prepare("SELECT COUNT(*) as count FROM vacancies").get()).count;
    const placements = (await db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Tugatildi'").get()).count;
    const companies = (await db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get()).count;

    res.json({ specialists, vacancies, placements, companies });
  } catch (err) {
    console.error("Stats overview error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
