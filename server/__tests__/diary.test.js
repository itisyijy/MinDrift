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

  const jwtPayload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  const userId = jwtPayload.id;

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

  it("should return 400 if user has no chat history", async () => {
    await request(app).post("/auth/register").send({
      user_id: "nohistoryuser",
      username: "No History",
      password: "123456",
    });

    const loginRes = await request(app).post("/auth/login").send({
      user_id: "nohistoryuser",
      password: "123456",
    });

    const noHistoryToken = loginRes.body.token;

    const res = await request(app)
      .post("/api/diary/from-history")
      .set("Authorization", `Bearer ${noHistoryToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "No chat history");
  });
});

describe("POST /api/diary", () => {
  it("should return 400 if diary content is missing", async () => {
    const res = await request(app)
      .post("/api/diary")
      .set("Authorization", `Bearer ${token}`)
      .send({ diary: "" });

    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Diary content is required");
  });

  it("should generate diary from direct text", async () => {
    const res = await request(app)
      .post("/api/diary")
      .set("Authorization", `Bearer ${token}`)
      .send({ diary: "오늘은 정말 즐거운 하루였다!" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
  });
});

describe("GET /api/diary/archive", () => {
  it("should return 400 if no date is provided", async () => {
    const res = await request(app)
      .get("/api/diary/archive")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Date is required (YYYY-MM-DD)");
  });
});

describe("GET /api/diary/id-by-date", () => {
  it("should return 404 for nonexistent diary entry", async () => {
    const res = await request(app)
      .get("/api/diary/id-by-date?date=1999-12-31")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "No diary entry for that date");
  });
});

describe("DELETE /api/diary/:id", () => {
  it("should return 404 for nonexistent diary ID", async () => {
    const res = await request(app)
      .delete("/api/diary/99999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Diary not found");
  });
});
