const express = require("express");
const authenticateToken = require("../auth/middleware");
const OpenAI = require("openai");
const router = express.Router();
const db = require("../db/db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const today = new Date().toISOString().split("T")[0];

async function generateDiarySummary(diaryText) {
  const messages = [
    {
      role: "system",
      content: `너는 감정 중심의 일기 코치야. 사용자의 일기를 분석해 하루를 요약하고 아래 HTML 구조에 맞게 출력해. class 속성은 수정하지 마. 스타일은 포함하지 마. <div class="diary-entry"><h2 class="diary-date">📅 <strong>[날짜]</strong></h2><h3 class="section-title">📝 <strong>오늘의 일기</strong></h3><div class="diary-body"><p>...</p></div><h3 class="section-title">🕰️ <strong>오늘의 흐름</strong></h3><ul class="diary-flow"><li><span class="time">오전 –</span> ...</li><li><span class="time">오후 –</span> ...</li><li><span class="time">밤 –</span> ...</li></ul><h3 class="section-title">💭 <strong>감정 상태</strong></h3><div class="emotion-status"><p><strong>[이모지 감정]</strong></p><p>[감정 설명]</p></div><h3 class="section-title">📌 <strong>오늘의 한 줄</strong></h3><blockquote class="one-line-summary">[한 줄 요약]</blockquote></div>`,
    },
    {
      role: "user",
      content: diaryText,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 800,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

// 📥 POST /api/diary 라우트
router.post("/diary", authenticateToken, async (req, res) => {
  const { diary } = req.body;

  if (!diary || diary.trim() === "") {
    return res.status(400).send("일기 내용을 입력해주세요.");
  }

  try {
    const reply = await generateDiarySummary(diary);
    res.json({ reply });
  } catch (err) {
    console.error("❌ GPT diary error:", err.response?.data || err.message);
    res.status(500).send("GPT diary summary failed");
  }
});

router.post("/diary/from-history", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const history = await new Promise((resolve, reject) => {
      db.all(
        `SELECT content FROM messages WHERE user_id = ? AND role = 'user' ORDER BY created_at ASC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const diaryText = history.map((row) => row.content).join("\n");

    if (!diaryText.trim()) {
      return res.status(400).json({ error: "대화 내용이 없습니다." });
    }

    const reply = await generateDiarySummary(diaryText);

    const now = new Date().toISOString(); // 저장 시간

    db.run(
      "INSERT INTO diaries (user_id, content, summary, created_at) VALUES (?, ?, ?, ?)",
      [userId, diaryText, reply, now],
      function (err) {
        if (err) {
          console.error("❌ diary insert error:", err.message);
          return res.status(500).json({ error: "저장 실패" });
        }
        // 저장 완료 → 클라이언트에 응답
        res.json({ id: this.lastID, reply });
      }
    );
  } catch (err) {
    console.error("❌ from-history error:", err.message);
    res.status(500).json({ error: "일기 생성 실패" });
  }
});

module.exports = router;
