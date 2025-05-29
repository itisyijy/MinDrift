require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const diaryRouter = require("./routes/diary");

const app = express();

// CORS 설정: HTML이 file:// 또는 localhost:5500에서 실행된다면 허용
app.use(
  cors({
    origin: "http://localhost:3000", // 또는 ["http://localhost:5500"]
    credentials: false,
  })
);

app.use(express.json());
app.use(express.static("public")); // test-auth.html 등

// 라우터 등록
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", diaryRouter); // ✅ 1회만

app.listen(8080, () => {
  console.log("✅ Server listening on http://localhost:8080");
});
