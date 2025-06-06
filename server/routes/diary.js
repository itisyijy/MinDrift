// Refactored and commented: server/routes/diary.js
const express = require("express");
const authenticateToken = require("../auth/middleware");
const OpenAI = require("openai");
const sanitizeHtml = require("sanitize-html");
const router = express.Router();
const db = require("../db");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function stripCodeBlock(response) {
  return response.replace(/^```html\s*|\s*```$/g, "").trim();
}

// Sanitize HTML output from GPT
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
    allowedAttributes: { "*": ["class"], span: ["class"] },
    disallowedTagsMode: "discard",
  });
}

// Generate diary summary using OpenAI
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
  return sanitizeDiaryHtml(stripCodeBlock(rawReply));
}

// POST /diary - generate diary from raw text
router.post("/diary", authenticateToken, async (req, res) => {
  const { diary } = req.body;
  const username = req.user.username;

  if (!diary || diary.trim() === "") {
    return res.status(400).send("Diary content is required");
  }

  try {
    const reply = await generateDiarySummary(diary, username);
    res.json({ reply });
  } catch (err) {
    console.error("GPT diary error:", err.response?.data || err.message);
    res.status(500).send("GPT diary summary failed");
  }
});

// POST /diary/from-history - generate diary from chat history
router.post("/diary/from-history", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const username = req.user.username;

  try {
    const history = await new Promise((resolve, reject) => {
      db.all(
        `SELECT content FROM messages WHERE user_id = ? AND role = 'user' ORDER BY created_at ASC`,
        [userId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const diaryText = history.map((row) => row.content).join("\n");
    if (!diaryText.trim())
      return res.status(400).json({ error: "No chat history" });

    const reply = await generateDiarySummary(diaryText, username);
    const today = new Date().toISOString().split("T")[0];

    db.get(
      `SELECT id FROM diaries WHERE user_id = ? AND date(created_at) = ?`,
      [userId, today],
      (err, row) => {
        if (err) return res.status(500).json({ error: "DB select failed" });

        if (row) {
          // Update existing entry
          db.run(
            `UPDATE diaries SET content = ?, summary = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [diaryText, reply, row.id],
            function (err) {
              if (err) return res.status(500).json({ error: "Update failed" });
              res.json({ id: row.id, reply, updated: true });
            }
          );
        } else {
          // Insert new diary
          db.run(
            `INSERT INTO diaries (user_id, content, summary, created_at) VALUES (?, ?, ?, ?)`,
            [userId, diaryText, reply, new Date().toISOString()],
            function (err) {
              if (err) return res.status(500).json({ error: "Insert failed" });
              res.json({ id: this.lastID, reply, created: true });
            }
          );
        }
      }
    );
  } catch (err) {
    console.error("from-history error:", err.message);
    res.status(500).json({ error: "Diary generation failed" });
  }
});

// GET /diary/archive - get diary and messages for a given date
router.get("/diary/archive", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const date = req.query.date;
  if (!date)
    return res.status(400).json({ error: "Date is required (YYYY-MM-DD)" });

  db.all(
    `SELECT role, content, created_at FROM messages WHERE user_id = ? AND date(created_at) = ? ORDER BY created_at ASC`,
    [userId, date],
    (err, messages) => {
      if (err) return res.status(500).json({ error: "Message query failed" });

      db.get(
        `SELECT content, summary, created_at FROM diaries WHERE user_id = ? AND date(created_at) = ?`,
        [userId, date],
        (err, diary) => {
          if (err) return res.status(500).json({ error: "Diary query failed" });
          res.json({ date, messages, diary: diary || null });
        }
      );
    }
  );
});

// GET /diary/dates - list of diary entry dates
router.get("/diary/dates", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT date(created_at) as date FROM diaries WHERE user_id = ? ORDER BY date DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Date list query failed" });
      const dates = rows.map((row) => row.date);
      res.json({ dates });
    }
  );
});

// GET /diary/id-by-date - fetch diary id by date
router.get("/diary/id-by-date", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const date = req.query.date;

  db.get(
    `SELECT id FROM diaries WHERE user_id = ? AND date(created_at) = ? ORDER BY created_at ASC LIMIT 1`,
    [userId, date],
    (err, row) => {
      if (err) return res.status(500).json({ error: "ID query failed" });
      if (!row)
        return res.status(404).json({ error: "No diary entry for that date" });
      res.json({ id: row.id });
    }
  );
});

// DELETE /diary/:id - delete a diary entry
router.delete("/diary/:id", authenticateToken, (req, res) => {
  const diaryId = req.params.id;
  const userId = req.user.id;

  db.run(
    `DELETE FROM diaries WHERE id = ? AND user_id = ?`,
    [diaryId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Delete failed" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Diary not found" });
      res.json({ message: "Deleted successfully", deletedId: diaryId });
    }
  );
});

module.exports = router;
