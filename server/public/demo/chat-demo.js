// chat.js

// Send user message to GPT and display reply
async function sendMessage() {
  const token = localStorage.getItem("jwt");
  const message = document.getElementById("message").value;

  const res = await fetch("http://localhost:8080/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  document.getElementById(
    "chat"
  ).innerText += `You: ${message}\nGPT: ${data.reply}\n`;
}

// Fetch chat history for user
async function fetchMessages() {
  const savedToken = localStorage.getItem("jwt");
  const res = await fetch("http://localhost:8080/api/messages", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${savedToken}`,
    },
  });

  const output = document.getElementById("output");

  if (!res.ok) {
    output.innerText = `Error ${res.status}: ${await res.text()}`;
    return;
  }

  const data = await res.json();
  output.innerText = "Messages:\n\n" + JSON.stringify(data, null, 2);
}
