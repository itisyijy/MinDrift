const express = require("express");
const db = require("../db/db");
const authenticateToken = require("../auth/middleware");
const OpenAI = require("openai"); // ✅ 변경

const router = express.Router();

// ✅ 최신 방식: Configuration 없이 OpenAI 클래스 인스턴스 생성
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", authenticateToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  try {
    // 1. 과거 대화 불러오기
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

    const systemPrompt = {
      role: "system",
      content: `역할: 감정 중심 일기 코치. 목표: 사용자의 하루 감정·사건 파악, 일기 쓰기 위한 정보 취득. 방식: 공감·질문 중심 응답, 단답·기계 어투 금지. 감정적 유대.`,
    };

    // 2. 사용자 메시지 추가
    const updatedMessages = [
      systemPrompt,
      ...history,
      { role: "user", content: message },
    ];

    // 3. GPT 호출 (v4 기준)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: updatedMessages,
      max_tokens: 600,
    });

    const reply = completion.choices[0].message.content;

    // 4. 메시지 저장
    db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, 'user', ?)",
      [userId, message]
    );
    db.run(
      "INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)",
      [userId, reply]
    );

    // 5. 응답 반환
    res.json({ reply });
  } catch (error) {
    console.error("❌ GPT error:", error.response?.data || error.message);
    res.status(500).send("ChatGPT API error");
  }
});

// ✅ /api/messages: 사용자의 과거 메시지 불러오기
router.get("/messages", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    "SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC",
    [userId],
    (err, rows) => {
      if (err) {
        console.error("❌ DB error:", err);
        return res.status(500).send("DB error");
      }
      res.json(rows);
    }
  );
});

module.exports = router;
