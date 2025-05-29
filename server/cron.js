const cron = require("node-cron");
const db = require("./db/db");

function deleteMessages() {
  db.run("DELETE FROM messages", (err) => {
    if (err) console.error("❌ 메시지 삭제 실패:", err.message);
    else console.log("🧹 메시지 초기화 완료");
  });
}

// 🕓 매일 새벽 4시에 실행
cron.schedule("0 4 * * *", deleteMessages);

// ✅ 명시적 export
module.exports = { deleteMessages };
