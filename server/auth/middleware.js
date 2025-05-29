// server/auth/middleware.js
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("🔐 Incoming token:", token);

  if (!token) {
    console.log("❌ No token - rejecting");
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.log("❌ Invalid token");
      return res.sendStatus(403);
    }
    console.log("✅ Authenticated:", user);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
