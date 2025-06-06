// Refactored and commented: server/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const authenticateToken = require("../auth/middleware");

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// Register new user
router.post("/register", async (req, res) => {
  const { user_id, username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE user_id = ?",
    [user_id],
    async (err, user) => {
      if (user)
        return res.status(409).json({ message: "User ID already exists" });

      const hashed = await bcrypt.hash(password, 10);
      db.run(
        "INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)",
        [user_id, username, hashed],
        (err) => {
          if (err) return res.status(500).json({ message: "DB error" });
          res.status(201).json({ message: "Registered successfully" });
        }
      );
    }
  );
});

// Login and issue JWT
router.post("/login", async (req, res) => {
  const { user_id, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE user_id = ?",
    [user_id],
    async (err, user) => {
      if (err) return res.status(500).send("DB error");
      if (!user) return res.status(401).send("No user");

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).send("Wrong password");

      const token = jwt.sign(
        { id: user.id, user_id: user.user_id, username: user.username },
        SECRET,
        { expiresIn: "2h" }
      );

      res.json({ token, username: user.username });
    }
  );
});

// Get authenticated user's info
router.get("/me", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    "SELECT user_id, username FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) return res.status(500).send("DB error");
      if (!user) return res.status(404).send("User not found");
      res.json(user);
    }
  );
});

// Update username
router.put("/username", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { newUsername } = req.body;

  if (!newUsername || newUsername.trim() === "") {
    return res.status(400).json({ message: "New username is required" });
  }

  db.run(
    "UPDATE users SET username = ? WHERE id = ?",
    [newUsername, userId],
    function (err) {
      if (err) {
        console.error("Username update failed:", err.message);
        return res.status(500).json({ message: "DB error" });
      }
      res.json({ message: "Username updated successfully", newUsername });
    }
  );
});

module.exports = router;
