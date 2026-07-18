const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth.cjs");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = { "image/jpeg": ".jpg", "image/png": ".png" };
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new Error("Faqat JPG yoki PNG rasm yuklash mumkin"));
    }
    cb(null, true);
  },
});

router.post("/", authMiddleware, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Rasm hajmi 2MB dan oshmasligi kerak" });
      }
      return res.status(400).json({ error: "Yuklashda xatolik" });
    }
    if (err) return res.status(400).json({ error: err.message || "Yuklashda xatolik" });
    if (!req.file) return res.status(400).json({ error: "Fayl topilmadi" });

    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
