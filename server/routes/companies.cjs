const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

function parseVacancy(v) {
  return {
    ...v,
    tags: JSON.parse(v.tags),
    requirements: JSON.parse(v.requirements),
    conditions: JSON.parse(v.conditions),
    responsibilities: JSON.parse(v.responsibilities || "[]"),
    directions: JSON.parse(v.directions || "[]"),
  };
}

router.get("/:id", (req, res) => {
  try {
    const employer = db.prepare(`
      SELECT id, name, company_name, company_logo, company_description, industry,
             employee_count, website, social_linkedin, address, city, verified, created_at
      FROM users WHERE id = ? AND role = 'employer' AND blocked = 0
    `).get(req.params.id);

    if (!employer) return res.status(404).json({ error: "Kompaniya topilmadi" });

    const vacancies = db.prepare(`
      SELECT * FROM vacancies WHERE employer_id = ? AND status = 'Faol' ORDER BY created_at DESC
    `).all(req.params.id).map(parseVacancy);

    const ratingRow = db.prepare(`
      SELECT AVG(company_rating) as avgRating, SUM(company_reviews) as totalReviews
      FROM vacancies WHERE employer_id = ?
    `).get(req.params.id);

    res.json({
      company: {
        ...employer,
        display_name: employer.company_name || employer.name,
        rating: ratingRow.avgRating ? Math.round(ratingRow.avgRating * 10) / 10 : 0,
        reviews_count: ratingRow.totalReviews || 0,
        open_vacancies_count: vacancies.length,
      },
      vacancies,
    });
  } catch (err) {
    console.error("Company profile error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
