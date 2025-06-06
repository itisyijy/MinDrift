// Refactored and commented: server/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const diaryRouter = require("./routes/diary");
const db = require("./db/db");
const { deleteMessages } = require("./cron");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public"));

// Register routes
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", diaryRouter);

// Delete old messages on server start if date has changed
function resetMessagesIfStale() {
  db.get(
    `SELECT MAX(date(created_at)) as last_date FROM messages`,
    (err, row) => {
      if (err) return console.error("Reset check failed:", err.message);
      const today = new Date().toISOString().split("T")[0];
      const lastDate = row?.last_date;

      if (lastDate && lastDate < today) {
        console.log("Resetting outdated chat logs");
        deleteMessages();
      } else {
        console.log("Chat logs are up-to-date");
      }
    }
  );
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  resetMessagesIfStale();
});
