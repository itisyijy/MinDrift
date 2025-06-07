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
    user_id: "msguser",
    username: "Message Test",
    password: "123456",
  });
  const res = await request(app).post("/auth/login").send({
    user_id: "msguser",
    password: "123456",
  });
  token = res.body.token;

  await request(app)
    .post("/api/chat")
    .send({ message: "메시지 저장 테스트" })
    .set("Authorization", `Bearer ${token}`);
});

describe("GET /api/messages", () => {
  it("should return user messages", async () => {
    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/messages - Edge Cases", () => {
  it("should return 401 if token is missing", async () => {
    const res = await request(app).get("/api/messages");
    expect(res.statusCode).toBe(401);
  });

  it("should return 403 if token is invalid", async () => {
    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.statusCode).toBe(403);
  });
});
