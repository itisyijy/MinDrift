// ✅ 맨 위 최상단에 위치시키는 것이 가장 안전합니다
jest.setTimeout(20000); // 테스트 실행 시간 여유 확보
require("dotenv").config(); // .env 로드

const request = require("supertest");
const express = require("express");
const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

describe("Auth API", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/auth/register").send({
      user_id: "testuser",
      username: "Test User",
      password: "password123",
    });

    expect([200, 409]).toContain(res.statusCode);
  });

  it("should return a token on login", async () => {
    const res = await request(app).post("/auth/login").send({
      user_id: "testuser",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
