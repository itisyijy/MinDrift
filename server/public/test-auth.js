let token = "";
const PORT = 8080;

async function login() {
  const res = await fetch(`http://localhost:${PORT}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    }),
  });

  const data = await res.json();
  token = data.token;
  localStorage.setItem("jwt", token); // 저장
  document.getElementById("output").innerText =
    "✅ Login Success\n\n" + JSON.stringify(data, null, 2);
}

function logout() {
  localStorage.removeItem("jwt");
  token = "";
  alert("Logged out!");
}

async function fetchMessages() {
  const savedToken = token || localStorage.getItem("jwt");
  const res = await fetch(`http://localhost:${PORT}/api/messages`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${savedToken}`,
    },
  });

  if (!res.ok) {
    document.getElementById("output").innerText = `❌ ${
      res.status
    }: ${await res.text()}`;
    return;
  }

  const data = await res.json();
  document.getElementById("output").innerText =
    "🧠 Messages:\n\n" + JSON.stringify(data, null, 2);
}
async function sendMessage() {
  const token = localStorage.getItem("jwt");
  const message = document.getElementById("message").value;

  const res = await fetch(`http://localhost:${PORT}/api/chat`, {
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
