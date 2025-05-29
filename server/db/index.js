const db =
  process.env.NODE_ENV === "test" ? require("./db.memory") : require("./db");

module.exports = db;
