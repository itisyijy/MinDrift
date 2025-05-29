const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/db");

const router = express.Router();
const SECRET = "your_jwt_secret";

// 회원가입
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (user) return res.status(409).send("Username already exists");
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

// 로그인 (JWT 발급)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).send("DB error");
      if (!user) return res.status(401).send("No user");
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).send("Wrong password");

      const token = jwt.sign({ id: user.id, username: user.username }, SECRET, {
        expiresIn: "2h",
      });
      res.json({ token });
    }
  );
});

module.exports = router;
