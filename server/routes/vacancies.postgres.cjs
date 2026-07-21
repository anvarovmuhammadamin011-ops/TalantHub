const express = require("express");
const db = require("../db.cjs");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/auth.cjs");
const { notifySavedSearches } = require("../lib/savedSearchAgent.cjs");
const { validateBody } = require("../middleware/validate.cjs");
const { vacancyCreateSchema } = require("../schemas.cjs");

const router = express.Router();

const EMPLOYER_SETTABLE_STATUSES = ["Faol", "Nofaol", "Arxivlangan"];

async function getInitialStatus() {
  const modeRow = await db.prepare("SELECT value FROM settings WHERE key = 'vacancy_moderation_mode'").get();
  return modeRow?.value === "pre" ? "Kutilmoqda" : "Faol";
}

function parseVacancy(v) {
  return {
    ...v,
    tags: JSON.parse(v.tags),
    requirements: JSON.parse(v.requirements),
    conditions: JSON.parse(v.conditions),
    responsibilities: JSON.parse(v.responsibilities || "[]"),
    screening_questions: JSON.parse(v.screening_questions || "[]"),
    directions: JSON.parse(v.directions || "[]"),
  };
}

router.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const { search, location, format, experience, category } = req.query;

    let sql = `
      SELECT v.*, u.name as author_name
      FROM vacancies v
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE v.status = 'Faol'
    `;
    const params = [];

    // ILIKE, not LIKE — Postgres's LIKE is case-sensitive by default.
    if (search) {
      sql += ` AND (v.title ILIKE ? OR v.company ILIKE ? OR v.tags ILIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      sql += ` AND v.location ILIKE ?`;
      params.push(`%${location}%`);
    }
    if (format) {
      sql += ` AND v.format = ?`;
      params.push(format);
    }
    if (experience) {
      sql += ` AND v.experience = ?`;
      params.push(experience);
    }
    if (category) {
      sql += ` AND v.category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY v.created_at DESC`;

    const vacancies = (await db.prepare(sql).all(...params)).map(parseVacancy);
    const savedIds = req.userId
      ? new Set((await db.prepare("SELECT vacancy_id FROM saved_vacancies WHERE user_id = ?").all(req.userId)).map((r) => r.vacancy_id))
      : new Set();
    vacancies.forEach((v) => { v.is_saved = savedIds.has(v.id); });

    res.json({ vacancies, total: vacancies.length });
  } catch (err) {
    console.error("Vacancies list error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/saved", authMiddleware, async (req, res) => {
  try {
    const vacancies = (await db.prepare(`
      SELECT v.*, u.name as author_name, s.created_at as saved_at
      FROM saved_vacancies s
      JOIN vacancies v ON v.id = s.vacancy_id
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.userId)).map((v) => ({ ...parseVacancy(v), is_saved: true }));

    res.json({ vacancies });
  } catch (err) {
    console.error("Saved vacancies error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/:id/save", authMiddleware, async (req, res) => {
  try {
    const vacancy = await db.prepare("SELECT id FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });

    await db.prepare("INSERT INTO saved_vacancies (user_id, vacancy_id) VALUES (?, ?) ON CONFLICT (user_id, vacancy_id) DO NOTHING").run(req.userId, req.params.id);
    res.json({ success: true, is_saved: true });
  } catch (err) {
    console.error("Vacancy save error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/:id/save", authMiddleware, async (req, res) => {
  try {
    await db.prepare("DELETE FROM saved_vacancies WHERE user_id = ? AND vacancy_id = ?").run(req.userId, req.params.id);
    res.json({ success: true, is_saved: false });
  } catch (err) {
    console.error("Vacancy unsave error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const vacancies = (await db.prepare(`
      SELECT v.*, (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as applications_count
      FROM vacancies v
      WHERE v.employer_id = ?
      ORDER BY v.created_at DESC
    `).all(req.userId)).map(parseVacancy);

    res.json({ vacancies });
  } catch (err) {
    console.error("My vacancies error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get("/:id", optionalAuthMiddleware, async (req, res) => {
  try {
    await db.prepare("UPDATE vacancies SET views = views + 1 WHERE id = ?").run(req.params.id);

    const vacancy = await db.prepare(`
      SELECT v.*, u.name as author_name, u.id as author_id
      FROM vacancies v
      LEFT JOIN users u ON v.employer_id = u.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });

    const isSaved = req.userId
      ? !!(await db.prepare("SELECT 1 FROM saved_vacancies WHERE user_id = ? AND vacancy_id = ?").get(req.userId, req.params.id))
      : false;

    res.json({ vacancy: { ...parseVacancy(vacancy), is_saved: isSaved } });
  } catch (err) {
    console.error("Vacancy detail error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/", authMiddleware, validateBody(vacancyCreateSchema), async (req, res) => {
  try {
    const requester = await db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    if (!requester || requester.role !== "employer") {
      return res.status(403).json({ error: "Faqat ish beruvchilar vakansiya joylashi mumkin" });
    }

    const {
      title, company, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions,
      employment_type, schedule, gender, responsibilities, salary_details, day_off,
      english_level, openings_count, contact_method, screening_questions, salary_type, save_as, directions, start_date,
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: "Sarlavha va kompaniya majburiy" });
    }

    const initialStatus = save_as === "draft" ? "Qoralama" : await getInitialStatus();

    const stmt = db.prepare(`
      INSERT INTO vacancies (
        title, company, company_logo, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions, employer_id, status,
        employment_type, schedule, gender, responsibilities, salary_details, day_off,
        english_level, openings_count, contact_method, screening_questions, salary_type, directions, start_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      title, company, "🏢",
      location || "", salary || "",
      salary_min || 0, salary_max || 0,
      format || "Ofis", experience || "Junior",
      category || "IT",
      JSON.stringify(tags || []),
      description || "",
      JSON.stringify(requirements || []),
      JSON.stringify(conditions || []),
      req.userId,
      initialStatus,
      employment_type || "To'liq stavka",
      schedule || "",
      gender || "Farqi yo'q",
      JSON.stringify(responsibilities || []),
      salary_details || "",
      day_off || "",
      english_level || "",
      openings_count || 1,
      contact_method || "Platforma orqali",
      JSON.stringify(screening_questions || []),
      salary_type || "Kelishiladi",
      JSON.stringify(directions || []),
      start_date || ""
    );

    const vacancy = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(result.lastInsertRowid);

    if (vacancy.status === "Faol") {
      await notifySavedSearches(vacancy, req.app.get("io"));
    }

    res.json({ vacancy: parseVacancy(vacancy) });
  } catch (err) {
    console.error("Vacancy create error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.post("/:id/duplicate", authMiddleware, async (req, res) => {
  try {
    const source = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);
    if (!source) return res.status(404).json({ error: "Vakansiya topilmadi" });
    if (source.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    const result = await db.prepare(`
      INSERT INTO vacancies (
        title, company, company_logo, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions, employer_id, status,
        employment_type, schedule, gender, responsibilities, salary_details, day_off,
        english_level, openings_count, contact_method, screening_questions, salary_type, directions, start_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Qoralama', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `${source.title} (nusxa)`, source.company, source.company_logo,
      source.location, source.salary, source.salary_min, source.salary_max,
      source.format, source.experience, source.category, source.tags,
      source.description, source.requirements, source.conditions, req.userId,
      source.employment_type, source.schedule, source.gender, source.responsibilities,
      source.salary_details, source.day_off,
      source.english_level, source.openings_count, source.contact_method,
      source.screening_questions, source.salary_type, source.directions, source.start_date
    );

    const vacancy = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(result.lastInsertRowid);
    res.json({ vacancy: parseVacancy(vacancy) });
  } catch (err) {
    console.error("Vacancy duplicate error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const vacancy = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    if (vacancy.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    await db.prepare("DELETE FROM applications WHERE vacancy_id = ?").run(req.params.id);
    await db.prepare("DELETE FROM vacancies WHERE id = ?").run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Vacancy delete error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const vacancy = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);
    if (!vacancy) return res.status(404).json({ error: "Vakansiya topilmadi" });
    if (vacancy.employer_id !== req.userId) return res.status(403).json({ error: "Ruxsat yo'q" });

    const {
      title, company, location, salary, salary_min, salary_max, format, experience, category, tags, description, requirements, conditions, status,
      employment_type, schedule, gender, responsibilities, salary_details, day_off,
      english_level, openings_count, contact_method, screening_questions, salary_type, save_as, directions, start_date,
    } = req.body;

    // Employers may only ever pause/resume/archive an already-moderated vacancy directly —
    // never jump straight to "Faol" from a pending/rejected/draft state, which would bypass
    // review. Those transitions are server-computed below instead.
    let resolvedStatus = null;
    if (status !== undefined) {
      const employerCanSetDirectly = ["Faol", "Nofaol"].includes(vacancy.status);
      if (!EMPLOYER_SETTABLE_STATUSES.includes(status) || !employerCanSetDirectly) {
        return res.status(400).json({ error: "Noto'g'ri status qiymati" });
      }
      resolvedStatus = status;
    } else if (vacancy.status === "Qoralama" && save_as !== "draft") {
      // Submitting a draft for review.
      resolvedStatus = await getInitialStatus();
    } else if (vacancy.status === "Tuzatish kerak") {
      // Any employer edit to a rejected vacancy re-enters the moderation queue.
      resolvedStatus = await getInitialStatus();
    }
    const clearRejectReason = resolvedStatus !== null && resolvedStatus !== "Tuzatish kerak";

    await db.prepare(`
      UPDATE vacancies SET
        title = COALESCE(?, title),
        company = COALESCE(?, company),
        location = COALESCE(?, location),
        salary = COALESCE(?, salary),
        salary_min = COALESCE(?, salary_min),
        salary_max = COALESCE(?, salary_max),
        format = COALESCE(?, format),
        experience = COALESCE(?, experience),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        description = COALESCE(?, description),
        requirements = COALESCE(?, requirements),
        conditions = COALESCE(?, conditions),
        status = COALESCE(?, status),
        reject_reason = CASE WHEN ? THEN '' ELSE reject_reason END,
        employment_type = COALESCE(?, employment_type),
        schedule = COALESCE(?, schedule),
        gender = COALESCE(?, gender),
        responsibilities = COALESCE(?, responsibilities),
        salary_details = COALESCE(?, salary_details),
        day_off = COALESCE(?, day_off),
        english_level = COALESCE(?, english_level),
        openings_count = COALESCE(?, openings_count),
        contact_method = COALESCE(?, contact_method),
        screening_questions = COALESCE(?, screening_questions),
        salary_type = COALESCE(?, salary_type),
        directions = COALESCE(?, directions),
        start_date = COALESCE(?, start_date)
      WHERE id = ?
    `).run(
      title || null, company || null, location || null, salary || null,
      salary_min || null, salary_max || null, format || null, experience || null,
      category || null, tags ? JSON.stringify(tags) : null,
      description || null,
      requirements ? JSON.stringify(requirements) : null,
      conditions ? JSON.stringify(conditions) : null,
      resolvedStatus,
      clearRejectReason ? 1 : 0,
      employment_type || null,
      schedule || null,
      gender || null,
      responsibilities ? JSON.stringify(responsibilities) : null,
      salary_details || null,
      day_off || null,
      english_level || null,
      openings_count || null,
      contact_method || null,
      screening_questions ? JSON.stringify(screening_questions) : null,
      salary_type || null,
      directions ? JSON.stringify(directions) : null,
      start_date !== undefined ? start_date : null,
      req.params.id
    );

    const updated = await db.prepare("SELECT * FROM vacancies WHERE id = ?").get(req.params.id);

    res.json({ vacancy: parseVacancy(updated) });
  } catch (err) {
    console.error("Vacancy update error:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

module.exports = router;
