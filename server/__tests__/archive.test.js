// ✅ 맨 위 최상단에 위치시키는 것이 가장 안전합니다
jest.setTimeout(20000); // 테스트 실행 시간 여유 확보
require("dotenv").config(); // .env 로드

const request = require("supertest");
const express = require("express");
const authRoutes = require("../routes/auth");
const diaryRoutes = require("../routes/diary");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/api", diaryRoutes);

let token = "";
let testDate = "";

beforeAll(async () => {
  await request(app).post("/auth/register").send({
    user_id: "archuser",
    username: "Archive Test",
    password: "123456",
  });

  const res = await request(app).post("/auth/login").send({
    user_id: "archuser",
    password: "123456",
  });
  token = res.body.token;

  await request(app)
    .post("/api/diary/from-history")
    .set("Authorization", `Bearer ${token}`);

  const today = new Date().toISOString().split("T")[0];
  testDate = today;
});

describe("GET /api/diary/archive", () => {
  it("should return diary and messages for a given date", async () => {
    const res = await request(app)
      .get(`/api/diary/archive?date=${testDate}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("messages");
    expect(res.body).toHaveProperty("diary");
  });
});
