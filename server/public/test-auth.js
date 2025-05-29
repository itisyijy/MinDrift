let token = "";
const PORT = 8080;

async function login() {
  const res = await fetch(`http://localhost:${PORT}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: document.getElementById("user_id").value,
      password: document.getElementById("password").value,
    }),
  });

  const data = await res.json();
  token = data.token;
  localStorage.setItem("jwt", token); // 저장
  document.getElementById("output").innerText =
    "✅ Login Success\n\n" + JSON.stringify(data, null, 2);
  // login() 함수 안에서 로그인 성공 후
  await fetchUserInfo();
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

async function fetchUserInfo() {
  const savedToken = localStorage.getItem("jwt");
  const res = await fetch(`http://localhost:${PORT}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + savedToken,
    },
  });

  if (res.ok) {
    const data = await res.json();
    document.getElementById("welcome").innerText = `👋 Hello, ${data.username}`;
  } else {
    document.getElementById("welcome").innerText =
      "❌ Failed to load user info";
  }
}

async function register() {
  const user_id = document.getElementById("reg_user_id").value.trim();
  const username = document.getElementById("reg_username").value.trim();
  const password = document.getElementById("reg_password").value;
  const confirm = document.getElementById("reg_confirm").value;
  const output = document.getElementById("registerResult");

  // 클라이언트 유효성 검사
  if (!user_id || !username || !password || !confirm) {
    output.innerText = "❗ 모든 필드를 입력해주세요.";
    return;
  }

  if (password !== confirm) {
    output.innerText = "❗ 비밀번호가 일치하지 않습니다.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:${PORT}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, username, password }),
    });

    if (res.status === 409) {
      output.innerText = "❌ 이미 존재하는 ID입니다.";
      return;
    }

    if (!res.ok) {
      const msg = await res.text();
      output.innerText = "❌ 회원가입 실패: " + msg;
      return;
    }

    output.innerText = "✅ 회원가입 성공! 이제 로그인하세요.";
  } catch (err) {
    console.error("Register error:", err);
    output.innerText = "❌ 네트워크 오류 또는 서버 오류";
  }
}
