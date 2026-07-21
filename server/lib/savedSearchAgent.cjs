const db = require("../db.cjs");

function matchesSearch(vacancy, search) {
  if (search.query) {
    const q = search.query.toLowerCase();
    const tags = (() => { try { return JSON.parse(vacancy.tags || "[]"); } catch { return []; } })();
    const haystack = `${vacancy.title} ${vacancy.company} ${tags.join(" ")}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (search.category && vacancy.category !== search.category) return false;
  if (search.location && !(vacancy.location || "").toLowerCase().includes(search.location.toLowerCase())) return false;
  if (search.format && vacancy.format !== search.format) return false;
  if (search.experience && vacancy.experience !== search.experience) return false;
  return true;
}

// Called whenever a vacancy becomes publicly visible (status -> 'Faol'), either straight from
// creation (no pre-moderation) or via admin approval. Dedup via saved_search_matches so a
// vacancy that toggles Faol multiple times (e.g. re-approved after edits) never double-notifies.
// Call sites treat this as fire-and-forget (no await) — every failure path is swallowed and
// logged internally, so that's safe, but callers that are already async should still await it.
async function notifySavedSearches(vacancy, io) {
  try {
    const searches = await db.prepare("SELECT * FROM saved_searches").all();
    if (searches.length === 0) return;

    const insertMatch = db.prepare("INSERT INTO saved_search_matches (saved_search_id, vacancy_id) VALUES (?, ?) ON CONFLICT (saved_search_id, vacancy_id) DO NOTHING");
    const insertNotif = db.prepare(`INSERT INTO notifications (user_id, type, title, description, link) VALUES (?, 'search_agent', ?, ?, ?)`);

    for (const search of searches) {
      if (search.user_id === vacancy.employer_id) continue;
      if (!matchesSearch(vacancy, search)) continue;

      const result = await insertMatch.run(search.id, vacancy.id);
      if (result.changes === 0) continue;

      const label = search.name || search.query || "Saqlangan qidiruv";
      const title = "Qidiruv agenti: yangi vakansiya";
      const description = `"${label}" bo'yicha yangi mos vakansiya: ${vacancy.title} — ${vacancy.company}`;
      await insertNotif.run(search.user_id, title, description, `/vacancies/${vacancy.id}`);

      if (io) io.to(`user_${search.user_id}`).emit("notification", { type: "search_agent", title, description });
    }
  } catch (err) {
    console.error("Saved search agent error:", err);
  }
}

module.exports = { notifySavedSearches };
