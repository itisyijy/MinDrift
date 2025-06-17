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

describe("POST /api/chat - edge cases", () => {
  it("should return 401 without token", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "토큰 없이 요청" });

    expect(res.statusCode).toBe(401);
  });

  it("should handle missing message field", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect([400, 500]).toContain(res.statusCode);
  });
});
