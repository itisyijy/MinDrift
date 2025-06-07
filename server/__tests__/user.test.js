// ✅ 맨 위 최상단에 위치시키는 것이 가장 안전합니다
jest.setTimeout(20000); // 테스트 실행 시간 여유 확보
require("dotenv").config(); // .env 로드

const request = require("supertest");
const express = require("express");
const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

let token = "";

beforeAll(async () => {
  await request(app).post("/auth/register").send({
    user_id: "meuser",
    username: "Me Test",
    password: "123456",
  });
  const res = await request(app).post("/auth/login").send({
    user_id: "meuser",
    password: "123456",
  });
  token = res.body.token;
});

describe("GET /auth/me", () => {
  it("should return user info with valid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("username", "Me Test");
  });
});

describe("GET /auth/me - Invalid Token", () => {
  it("should return 403 for invalid token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.statusCode).toBe(403);
  });
});

describe("PUT /auth/username - Change username", () => {
  it("should update username successfully", async () => {
    const res = await request(app)
      .put("/auth/username")
      .set("Authorization", `Bearer ${token}`)
      .send({ newUsername: "Updated Me" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("newUsername", "Updated Me");
  });

  it("should return 400 for empty username", async () => {
    const res = await request(app)
      .put("/auth/username")
      .set("Authorization", `Bearer ${token}`)
      .send({ newUsername: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "New username is required");
  });
});
