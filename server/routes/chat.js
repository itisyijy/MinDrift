// Refactored and commented: server/routes/chat.js
const express = require("express");
const db = require("../db");
const authenticateToken = require("../auth/middleware");
const OpenAI = require("openai");

const router = express.Router();

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /chat - send message and get GPT reply
router.post("/chat", authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  try {
    // Load previous messages for the user
    const history = await new Promise((resolve, reject) => {
      db.all(
        "SELECT role, content FROM messages WHERE user_id = ? ORDER BY created_at ASC",
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // System prompt (should be localized or abstracted)
    console.log(req.user.username);
    const systemPrompt = {
      role: "system",
      // content: `역할: 감정 중심 일기 코치. 목표: 사용자${req.user.username}의 하루 감정·사건 파악, 일기 쓰기 위한 정보 취득. 방식: 공감·질문 중심 응답, 단답·기계 어투 금지. 감정적 유대.`,
      content: `Role: Emotion-oriented diary coach.
                Goal: Identify daily emotions and events of user ${req.user.username} and obtain information for writing a diary.
                Method: Empathy, emotional bond and question-oriented responses, no short answers and machine tone.`,
    };

    // Prepare messages
    const updatedMessages = [
      systemPrompt,
      ...history,
      { role: "user", content: message },
    ];

    // Request GPT completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: updatedMessages,
      max_tokens: 600,
    });

    const reply = completion.choices[0].message.content;

    // Save messages to DB
    db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)",
      [userId, message]
    );
    db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)",
      [userId, reply]
    );

    res.json({ reply });
  } catch (error) {
    console.error("GPT error:", error.response?.data || error.message);
    res.status(500).send("ChatGPT API error");
  }
});

// GET /messages - fetch user's chat history
router.get("/messages", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    "SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC",
    [userId],
    (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).send("DB error");
      }
      res.json(rows);
    }
  );
});

module.exports = router;
