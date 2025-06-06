// Refactored and commented: server/db/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to SQLite database file
const db = new sqlite3.Database(
  path.resolve(__dirname, "../users.db"),
  (err) => {
    if (err) {
      console.error("SQLite connection failed:", err.message);
    } else {
      console.log("SQLite connected");
    }
  }
);

db.serialize(() => {
  // Create users table
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
        console.log("Users table ready");
      }
    }
  );

  // Create messages table
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
        console.log("Messages table ready");
      }
    }
  );

  // Create diaries table
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
        console.log("Diaries table ready");
      }
    }
  );
});

module.exports = db;
