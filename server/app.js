// Refactored and commented: server/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const diaryRouter = require("./routes/diary");
const db = require("./db/db");

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

app.listen(PORT, () => {
  console.log(`Server is listening.`);
});
