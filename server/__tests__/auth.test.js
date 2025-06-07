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

    expect([201, 409]).toContain(res.statusCode);
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

describe("Auth API - Additional Cases", () => {
  it("should return 409 on duplicate registration", async () => {
    const res = await request(app).post("/auth/register").send({
      user_id: "testuser",
      username: "Test Duplicate",
      password: "password123",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("message", "User ID already exists");
  });

  it("should return 401 for non-existent user login", async () => {
    const res = await request(app).post("/auth/login").send({
      user_id: "nonexistent",
      password: "anything",
    });

    expect(res.statusCode).toBe(401);
    expect(res.text).toBe("No user");
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app).post("/auth/login").send({
      user_id: "testuser",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.text).toBe("Wrong password");
  });
});
