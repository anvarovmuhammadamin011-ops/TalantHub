const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./db.cjs");
const seed = require("./seed.cjs");

const authRoutes = require("./routes/auth.cjs");
const vacancyRoutes = require("./routes/vacancies.cjs");
const specialistRoutes = require("./routes/specialists.cjs");
const applicationRoutes = require("./routes/applications.cjs");
const chatRoutes = require("./routes/chats.cjs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/specialists", specialistRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);

// Serve static frontend in production
app.use(express.static(path.join(__dirname, "../dist")));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Seed database
seed();

app.listen(PORT, () => {
  console.log(`TalentHub API server running on http://localhost:${PORT}`);
});
