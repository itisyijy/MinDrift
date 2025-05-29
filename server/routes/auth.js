const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/db");
const authenticateToken = require("../auth/middleware"); // 또는 "../auth/middleware" 경로에 맞게 조정

const router = express.Router();
const SECRET = "your_jwt_secret";

// 회원가입
router.post("/register", async (req, res) => {
  const { user_id, username, password } = req.body;
  db.get("SELECT * FROM users WHERE user_id = ?", [user_id], async (err, user) => {
    if (user) return res.status(409).json({ message: "Username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)",
      [user_id, username, hashed],
      (err) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.status(201).json({ message: "Registered successfully" });
      }
    );
  });
});


// 로그인 (JWT 발급)
router.post("/login", async (req, res) => {
  const { user_id, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE user_id = ?",
    [user_id],
    async (err, user) => {
      if (err) return res.status(500).send("DB error");
      if (!user) return res.status(401).send("No user");
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).send("Wrong password");

      const token = jwt.sign(
        { id: user.id, user_id: user.user_id, username: user.username },
        SECRET,
        {
          expiresIn: "2h",
        }
      );
      res.json({ token });
    }
  );
});

// 인증된 사용자 정보 조회
router.get("/me", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    "SELECT user_id, username FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).send("DB error");
      }
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.json(user);
    }
  );
});

module.exports = router;
