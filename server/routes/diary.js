const express = require("express");
const authenticateToken = require("../auth/middleware");
const OpenAI = require("openai");
const sanitizeHtml = require("sanitize-html"); // ✅ 추가
const router = express.Router();
const db = require("../db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function stripCodeBlock(response) {
  return response.replace(/^```html\s*|\s*```$/g, "").trim();
}

// ✅ sanitize 설정
function sanitizeDiaryHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      "div",
      "h2",
      "h3",
      "p",
      "strong",
      "ul",
      "li",
      "span",
      "blockquote",
    ],
    allowedAttributes: {
      "*": ["class"],
      span: ["class"],
    },
    disallowedTagsMode: "discard",
  });
}

async function generateDiarySummary(diaryText, username) {
  const messages = [
    {
      role: "system",
      content: `너는 감정 중심의 일기 코치야. 사용자 ${username}의 일기를 분석해 하루를 요약하고 아래 HTML 구조에 맞게 출력해. class 속성은 수정하지 마. 스타일은 포함하지 마. <div class="diary-entry"><h2 class="diary-date">📅 <strong>[날짜]</strong></h2><h3 class="section-title">📝 <strong>오늘의 일기</strong></h3><div class="diary-body"><p>...</p></div><h3 class="section-title">🕰️ <strong>오늘의 흐름</strong></h3><ul class="diary-flow"><li><span class="time">오전 –</span> ...</li><li><span class="time">오후 –</span> ...</li><li><span class="time">밤 –</span> ...</li></ul><h3 class="section-title">💭 <strong>감정 상태</strong></h3><div class="emotion-status"><p><strong>[이모지 감정]</strong></p><p>[감정 설명]</p></div><h3 class="section-title">📌 <strong>오늘의 한 줄</strong></h3><blockquote class="one-line-summary">[한 줄 요약]</blockquote></div>`,
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

  const rawReply = completion.choices[0].message.content;
  const htmlStripped = stripCodeBlock(rawReply);
  return sanitizeDiaryHtml(htmlStripped); // ✅ 필터링 후 반환
}

// 📥 POST /api/diary
router.post("/diary", authenticateToken, async (req, res) => {
  const { diary } = req.body;
  const username = req.user.username;

  if (!diary || diary.trim() === "") {
    return res.status(400).send("일기 내용을 입력해주세요.");
  }

  try {
    const reply = await generateDiarySummary(diary, username);
    res.json({ reply });
  } catch (err) {
    console.error("❌ GPT diary error:", err.response?.data || err.message);
    res.status(500).send("GPT diary summary failed");
  }
});

// 📥 POST /api/diary/from-history
router.post("/diary/from-history", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const username = req.user.username;

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

    const reply = await generateDiarySummary(diaryText, username);
    const today = new Date().toISOString().split("T")[0];

    // 이미 오늘 날짜의 일기가 있는지 확인
    db.get(
      `SELECT id FROM diaries WHERE user_id = ? AND date(created_at) = ?`,
      [userId, today],
      (err, row) => {
        if (err) {
          console.error("❌ diary select error:", err.message);
          return res.status(500).json({ error: "DB 조회 실패" });
        }

        if (row) {
          // ✅ 이미 존재 → UPDATE
          db.run(
            `UPDATE diaries SET content = ?, summary = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [diaryText, reply, row.id],
            function (err) {
              if (err) {
                console.error("❌ diary update error:", err.message);
                return res.status(500).json({ error: "업데이트 실패" });
              }
              res.json({ id: row.id, reply, updated: true });
            }
          );
        } else {
          // ✅ 없으면 INSERT
          db.run(
            `INSERT INTO diaries (user_id, content, summary, created_at) VALUES (?, ?, ?, ?)`,
            [userId, diaryText, reply, new Date().toISOString()],
            function (err) {
              if (err) {
                console.error("❌ diary insert error:", err.message);
                return res.status(500).json({ error: "저장 실패" });
              }
              res.json({ id: this.lastID, reply, created: true });
            }
          );
        }
      }
    );
  } catch (err) {
    console.error("❌ from-history error:", err.message);
    res.status(500).json({ error: "일기 생성 실패" });
  }
});

// 📅 특정 날짜 아카이브 조회
router.get("/diary/archive", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const date = req.query.date; // YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ error: "날짜를 입력해주세요 (YYYY-MM-DD)." });
  }

  // 1. 메시지 조회
  db.all(
    `SELECT role, content, created_at FROM messages
     WHERE user_id = ? AND date(created_at) = ?
     ORDER BY created_at ASC`,
    [userId, date],
    (err, messages) => {
      if (err) {
        console.error("❌ messages DB error:", err.message);
        return res.status(500).json({ error: "메시지 조회 실패" });
      }

      // 2. 일기 요약 조회
      db.get(
        `SELECT content, summary, created_at FROM diaries
         WHERE user_id = ? AND date(created_at) = ?`,
        [userId, date],
        (err, diary) => {
          if (err) {
            console.error("❌ diaries DB error:", err.message);
            return res.status(500).json({ error: "일기 조회 실패" });
          }

          res.json({
            date,
            messages,
            diary: diary || null, // 없을 경우 null 반환
          });
        }
      );
    }
  );
});

// 📆 사용자가 작성한 일기 날짜 목록 반환
router.get("/diary/dates", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT date(created_at) as date FROM diaries
     WHERE user_id = ? ORDER BY date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error("❌ diary date list error:", err.message);
        return res.status(500).json({ error: "일기 날짜 조회 실패" });
      }
      const dates = rows.map((row) => row.date);
      res.json({ dates });
    }
  );
});

router.get("/diary/id-by-date", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const date = req.query.date;
  console.log("📥 ID 조회 요청:", { userId, date });

  db.get(
    `SELECT id FROM diaries WHERE user_id = ? AND date(created_at) = ? ORDER BY created_at ASC LIMIT 1`,
    [userId, date],
    (err, row) => {
      if (err) {
        console.error("❌ id-by-date DB error:", err.message);
        return res.status(500).json({ error: "일기 조회 실패" });
      }
      if (!row) {
        console.warn("⚠️ 일기 없음: ", { userId, date });
        return res
          .status(404)
          .json({ error: "해당 날짜의 일기를 찾을 수 없습니다." });
      }
      res.json({ id: row.id });
    }
  );
});

// 📤 DELETE /api/diary/:id → 특정 일기 삭제
router.delete("/diary/:id", authenticateToken, (req, res) => {
  const diaryId = req.params.id;
  const userId = req.user.id;

  db.run(
    `DELETE FROM diaries WHERE id = ? AND user_id = ?`,
    [diaryId, userId],
    function (err) {
      if (err) {
        console.error("❌ diary delete error:", err.message);
        return res.status(500).json({ error: "삭제 실패" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "해당 일기를 찾을 수 없음" });
      }

      res.json({ message: "삭제 완료", deletedId: diaryId });
    }
  );
});

module.exports = router;
