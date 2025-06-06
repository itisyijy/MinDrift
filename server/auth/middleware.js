// Refactored and commented: server/auth/middleware.js
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token received:", token);

  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.log("Invalid token");
      return res.sendStatus(403);
    }
    console.log("Authenticated user ID:", user.user_id);
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
