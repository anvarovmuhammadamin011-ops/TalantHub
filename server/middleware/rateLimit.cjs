const buckets = new Map();

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    // Collapse numeric path segments (/vacancies/123, /vacancies/456, ...) into one bucket per
    // route shape — otherwise a request hitting many different ids never gets rate-limited.
    const normalizedPath = req.path.replace(/\/\d+(?=\/|$)/g, "/:id");
    const key = req.ip + ":" + normalizedPath;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.start > windowMs) {
      buckets.set(key, { start: now, count: 1 });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring." });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > 15 * 60 * 1000) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

module.exports = { rateLimit };
