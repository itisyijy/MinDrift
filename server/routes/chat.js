const express = require("express");
const db = require("../db/db");
const authenticateToken = require("../auth/middleware");
const router = express.Router();

router.get("/messages", authenticateToken, (req, res) => {
  db.all(
    "SELECT role, content FROM messages WHERE user_id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).send("DB error");
      res.json(rows);
    }
  );
});

router.post("/chat", authenticateToken, (req, res) => {
  const { message } = req.body;

  // 예시 reply (GPT 대신 echo)
  const reply = `Echo: ${message}`;

  // 사용자 메시지 저장
  db.run(
    "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)",
    [req.user.id, message]
  );

  // GPT 응답 저장
  db.run(
    "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)",
    [req.user.id, reply]
  );

  res.json({ reply });
});

module.exports = router;
