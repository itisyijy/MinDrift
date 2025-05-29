// ✅ 최상단에 설정
jest.setTimeout(20000);
require("dotenv").config();

const request = require("supertest");
const express = require("express");
const diaryRoutes = require("../routes/diary");
const authRoutes = require("../routes/auth");
const db = require("../db");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api", diaryRoutes);

let token = "";

beforeAll(async () => {
  // ✅ 사용자 등록 및 로그인
  await request(app).post("/auth/register").send({
    user_id: "diaryuser",
    username: "Diary Test",
    password: "123456",
  });

  const res = await request(app).post("/auth/login").send({
    user_id: "diaryuser",
    password: "123456",
  });

  token = res.body.token;

  // ✅ 토큰에서 user_id 추출
  const jwtPayload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  const userId = jwtPayload.id;

  // ✅ 사용자 메시지 삽입
  await new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)",
      [userId, "오늘 하루가 길었어."],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
});

describe("POST /api/diary/from-history", () => {
  it("should generate diary from chat history", async () => {
    const res = await request(app)
      .post("/api/diary/from-history")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
  });
});
