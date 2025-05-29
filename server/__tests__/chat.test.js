// ✅ 맨 위 최상단에 위치시키는 것이 가장 안전합니다
jest.setTimeout(20000); // 테스트 실행 시간 여유 확보
require("dotenv").config(); // .env 로드

const request = require("supertest");
const express = require("express");
const chatRoutes = require("../routes/chat");
const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);

let token = "";

beforeAll(async () => {
  await request(app).post("/auth/register").send({
    user_id: "chatuser",
    username: "Chat Test",
    password: "123456",
  });
  const res = await request(app).post("/auth/login").send({
    user_id: "chatuser",
    password: "123456",
  });
  token = res.body.token;
});

describe("POST /api/chat", () => {
  it("should respond to message", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "오늘 어땠냐고?" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
  });
});
