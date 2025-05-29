// server/db/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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

db.serialize(() => {
  // 사용자 테이블
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
        console.log("✅ users table ready.");
      }
    }
  );

  // 메시지 테이블 (chat.js 용)
  db.run(
    `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role TEXT,
      content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to create messages table:", err.message);
      } else {
        console.log("✅ messages table ready.");
      }
    }
  );

  // 📘 일기 테이블
  db.run(
    `
    CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT,
      summary TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Failed to create diaries table:", err.message);
      } else {
        console.log("✅ diaries table ready.");
      }
    }
  );
});

module.exports = db;
