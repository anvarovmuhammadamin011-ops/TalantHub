const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

router.get("/overview", (req, res) => {
  try {
    const specialists = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'specialist'").get().count;
    const vacancies = db.prepare("SELECT COUNT(*) as count FROM vacancies").get().count;
    const placements = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Tugatildi'").get().count;
    const companies = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get().count;

    res.json({ specialists, vacancies, placements, companies });
  } catch (err) {
    console.error("Stats overview error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
