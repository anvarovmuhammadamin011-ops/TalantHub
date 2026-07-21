// Vercel serverless entry point. Every request under /api/* is rewritten here (see
// vercel.json), and the underlying Express app (server/app.cjs) does its own internal
// routing from there — this file's only job is one-time-per-cold-start DB setup before
// handing the request to Express. No http.createServer/Socket.IO here: Vercel's serverless
// functions can't hold a persistent WebSocket connection, so realtime features (chat sockets,
// live admin updates) are inactive in this deployment — see server/index.cjs for the
// full-featured version used for local dev and Render.
// Must run before requiring db.cjs, which reads DATABASE_URL at require-time — on Vercel
// itself env vars are injected directly and this is a no-op (no .env file is deployed), but
// local tooling (e.g. `vercel dev`) that runs this file directly needs it loaded first.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const db = require("../server/db.cjs");
const seed = require("../server/seed.cjs");
const app = require("../server/app.cjs");

let initPromise = null;
function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await db.initSchema();
      await seed();
      await seed.ensureAdmin();
    })().catch((err) => {
      initPromise = null; // let the next invocation retry instead of caching a failure forever
      throw err;
    });
  }
  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureInit();
  } catch (err) {
    console.error("Cold-start init failed:", err);
    res.status(500).json({ error: "Server xatoligi" });
    return;
  }
  app(req, res);
};
