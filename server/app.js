require("dotenv").config(); // .env를 읽음
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat"); // 새로 만들 파일
const app = express();

// ✅ CORS: 프론트가 HTML 파일(localhost:5500)에서 실행될 경우
app.use(
  cors({
    origin: "http://localhost:3000", // HTML 테스트 파일 실행 도메인
    credentials: true, // 인증정보 허용
  })
);

app.use(express.json()); // JSON 요청 파싱
app.use(express.static("public")); // test-auth.html 등 정적 파일 서빙

app.use("/auth", authRoutes); // 로그인/회원가입
app.use("/api", chatRoutes); // 메시지/챗 API

app.listen(8080, () =>
  console.log("✅ Server listening on http://localhost:8080")
);