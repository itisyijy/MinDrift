// Refactored and commented: server/cron.js
const cron = require("node-cron");
const db = require("./db/db");

// Function to delete all chat messages
function deleteMessages() {
  db.run("DELETE FROM messages", (err) => {
    if (err) console.error("Message deletion failed:", err.message);
    else console.log("Messages cleared");
  });
}

// Schedule task: run every day at 4:00 AM
cron.schedule("0 4 * * *", deleteMessages);

module.exports = { deleteMessages };
