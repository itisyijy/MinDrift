// server/auth/passport-config.js
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const db = require("../db/db");

function initialize(passport) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
          if (err) return done(err);
          if (!user) return done(null, false, { message: "No user found" });

          const match = await bcrypt.compare(password, user.password);
          if (match) return done(null, user);
          return done(null, false, { message: "Incorrect password" });
        }
      );
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id); // 사용자 ID만 저장
  });

  passport.deserializeUser((id, done) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
      done(err, user); // 요청마다 user 정보를 복원
    });
  });
}

module.exports = initialize;
