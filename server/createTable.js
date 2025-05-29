const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "./users.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🧹 Cleaning up users table...");

  // 1. 빈 값 삭제
  const deleteEmpty = `
    DELETE FROM users
    WHERE TRIM(user_id) = ''
       OR TRIM(username) = ''
       OR TRIM(password) = ''
  `;

  db.run(deleteEmpty, function (err) {
    if (err) {
      console.error("❌ Failed to delete empty users:", err.message);
    } else {
      console.log(`✅ Deleted ${this.changes} empty user(s).`);
    }

    // 2. users_old 테이블이 있는지 확인 후 삭제
    const checkOldTable = `
      SELECT name FROM sqlite_master WHERE type='table' AND name='users_old'
    `;
    db.get(checkOldTable, (err, row) => {
      if (err) {
        console.error("❌ Failed to check users_old:", err.message);
      } else if (row) {
        db.run("DROP TABLE users_old", (err) => {
          if (err) {
            console.error("❌ Failed to drop users_old:", err.message);
          } else {
            console.log("🗑️ users_old table dropped.");
          }
        });
      } else {
        console.log("ℹ️ users_old table does not exist.");
      }

      // 3. 남은 사용자 확인
      db.all("SELECT id, user_id, username FROM users", (err, rows) => {
        if (err) {
          console.error("❌ Failed to fetch users:", err.message);
        } else {
          console.log("🔍 Remaining users:");
          console.table(rows);
        }
        db.close();
      });
    });
  });
});
