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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateFromHistory").onclick = async function () {
    try {
      const savedToken = localStorage.getItem("jwt");

      const res = await fetch("/api/diary/from-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + savedToken, // JWT 토큰 필요
        },
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        // JSON 에러 처리
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          alert("에러: " + (errorData.error || "알 수 없는 오류"));
        } else {
          const text = await res.text();
          alert("서버 오류: " + text);
        }
        return;
      }

      const data = await res.json();
      console.log(data);
      document.getElementById("diarySummary").innerHTML = data.reply;
    } catch (err) {
      console.error("Fetch error:", err);
      alert("네트워크 오류 또는 서버 응답 실패");
    }
  };
});
