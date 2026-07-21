const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

const ALLOWED_TYPES = { "image/jpeg": ".jpg", "image/png": ".png" };
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Vercel's serverless filesystem is read-only outside /tmp, and /tmp is wiped between
// invocations, so local disk storage can't back uploads there — Vercel Blob is used instead
// whenever BLOB_READ_WRITE_TOKEN is present (set automatically once a Blob store is linked to
// the project). Local dev and Render have no such token and keep writing to the real,
// statically-served server/uploads/ directory as before.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

let upload;
if (useBlob) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES[file.mimetype]) {
        return cb(new Error("Faqat JPG yoki PNG rasm yuklash mumkin"));
      }
      cb(null, true);
    },
  });
} else {
  const UPLOAD_DIR = path.join(__dirname, "../uploads");
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
        cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
      },
    }),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES[file.mimetype]) {
        return cb(new Error("Faqat JPG yoki PNG rasm yuklash mumkin"));
      }
      cb(null, true);
    },
  });
}

router.post("/", authMiddleware, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Rasm hajmi 2MB dan oshmasligi kerak" });
      }
      return res.status(400).json({ error: "Yuklashda xatolik" });
    }
    if (err) return res.status(400).json({ error: err.message || "Yuklashda xatolik" });
    if (!req.file) return res.status(400).json({ error: "Fayl topilmadi" });

    if (useBlob) {
      try {
        const { put } = require("@vercel/blob");
        const ext = ALLOWED_TYPES[req.file.mimetype] || path.extname(req.file.originalname);
        const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
        const blob = await put(filename, req.file.buffer, {
          access: "public",
          contentType: req.file.mimetype,
        });
        return res.json({ url: blob.url });
      } catch (blobErr) {
        console.error("Blob upload error:", blobErr);
        return res.status(500).json({ error: "Yuklashda xatolik" });
      }
    }

    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
