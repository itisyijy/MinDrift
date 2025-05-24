const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const authRoutes = require("./routes/auth"); // 인증 라우터
const initializePassport = require("./auth/passport-config");

const app = express();
const PORT = 3001;

// Passport 초기화
initializePassport(passport);

// CORS 설정 (프론트엔드 origin에 맞춰 수정 필요)
app.use(
  cors({
    origin: "http://localhost:3000", // React 앱 주소
    credentials: true, // 쿠키 허용
  })
);

// JSON 파싱
app.use(express.json());

// 세션 설정
app.use(
  session({
    secret: "my-secret", // 원하는 비밀 문자열
    resave: false,
    saveUninitialized: false,
  })
);

// Passport 미들웨어
app.use(passport.initialize());
app.use(passport.session());

// 인증 라우터 연결
app.use("/auth", authRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
