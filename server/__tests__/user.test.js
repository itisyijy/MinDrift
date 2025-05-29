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
