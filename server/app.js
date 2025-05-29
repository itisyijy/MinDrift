require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const diaryRouter = require("./routes/diary");
const db = require("./db/db");
const { deleteMessages } = require("./cron");
const helmet = require("helmet");

const app = express();

app.use(helmet());

// CORS 설정: HTML이 file:// 또는 localhost:5500에서 실행된다면 허용
app.use(
  cors({
    origin: "http://localhost:8080", // 또는 ["http://localhost:5500"]
    credentials: false,
  })
);

app.use(express.json());
app.use(express.static("public")); // test-auth.html 등

// 라우터 등록
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", diaryRouter); // ✅ 1회만

// ✅ 서버 부팅 시: 마지막 메시지 날짜 검사
function resetMessagesIfStale() {
  db.get(
    `SELECT MAX(date(created_at)) as last_date FROM messages`,
    (err, row) => {
      if (err) return console.error("❌ 초기화 검사 실패:", err.message);

      const today = new Date().toISOString().split("T")[0];
      const lastMessageDate = row?.last_date;

      if (lastMessageDate && lastMessageDate < today) {
        console.log("⏰ 서버 부팅: 하루 지나 채팅 로그 삭제 필요");
        deleteMessages();
      } else {
        console.log("✅ 서버 부팅: 채팅 로그는 최신 상태");
      }
    }
  );
}

app.listen(8080, () => {
  console.log("✅ Server listening on http://localhost:8080");
  resetMessagesIfStale(); // 🔁 서버 시작 시 보정
});
