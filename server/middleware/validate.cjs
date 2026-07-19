// Thin zod wrapper — validates req.body against a schema and replaces it with the
// parsed (trimmed/coerced) result, so frontend validation can't be bypassed by a
// direct API call.
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || "Noto'g'ri ma'lumot" });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
