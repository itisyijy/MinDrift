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
    const systemPrompt = {
      role: "system",
      content: `Role: Emotional diary coach. Goal: Understand ${req.user.username}'s day and feelings to help generate a diary. Respond with empathy, ask questions, avoid mechanical tone.`,
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
