const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const db = require("../db/db");

const router = express.Router();

// 🔐 회원가입
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // 중복 검사
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (user) return res.status(409).send("Username already exists");

      // 암호화 후 저장
      const hashed = await bcrypt.hash(password, 10);
      db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashed],
        (err) => {
          if (err) return res.status(500).send("DB error");
          res.send("Registered successfully");
        }
      );
    }
  );
});

// 🔓 로그인
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.send("Logged in successfully");
});

// 🚪 로그아웃
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.send("Logged out");
  });
});

// 🧠 로그인 상태 확인용 (선택)
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).send("Not authenticated");
  }
});

module.exports = router;
