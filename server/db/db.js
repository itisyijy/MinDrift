// server/db/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// DB 파일 경로 설정 (루트 디렉토리에 users.db 생성됨)
const db = new sqlite3.Database(
  path.resolve(__dirname, "../users.db"),
  (err) => {
    if (err) {
      console.error("Failed to connect to SQLite:", err.message);
    } else {
      console.log("Connected to SQLite database.");
    }
  }
);

// 사용자 테이블 생성 (최초 1회 실행됨)
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to create users table:", err.message);
      } else {
        console.log("users.db is ready.");
      }
    }
  );
});

module.exports = db;
