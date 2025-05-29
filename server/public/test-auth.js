let token = "";
const PORT = 8080;

// 로그인
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
  localStorage.setItem("jwt", token);

  document.getElementById("output").innerText =
    "✅ Login Success\n\n" + JSON.stringify(data, null, 2);

  await fetchUserInfo();
}

// 로그아웃
function logout() {
  localStorage.removeItem("jwt");
  token = "";
  alert("Logged out!");
}

// 메시지 목록 가져오기
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

// 메시지 전송
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

// 사용자 정보 조회
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

// 회원가입
async function register() {
  const user_id = document.getElementById("reg_user_id").value.trim();
  const username = document.getElementById("reg_username").value.trim();
  const password = document.getElementById("reg_password").value;
  const confirm = document.getElementById("reg_confirm").value;
  const output = document.getElementById("registerResult");

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

// DOM 로딩 후 버튼 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("registerBtn")?.addEventListener("click", register);
  document.getElementById("loginBtn")?.addEventListener("click", login);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document
    .getElementById("sendMessageBtn")
    ?.addEventListener("click", sendMessage);
  document
    .getElementById("fetchMessagesBtn")
    ?.addEventListener("click", fetchMessages);

  document
    .getElementById("generateFromHistory")
    ?.addEventListener("click", async () => {
      try {
        const savedToken = localStorage.getItem("jwt");

        const res = await fetch("/api/diary/from-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + savedToken,
          },
        });

        const contentType = res.headers.get("content-type");

        if (!res.ok) {
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
        document.getElementById("diarySummary").innerHTML = data.reply;
      } catch (err) {
        console.error("Fetch error:", err);
        alert("네트워크 오류 또는 서버 응답 실패");
      }
    });

  document
    .getElementById("fetchArchiveBtn")
    ?.addEventListener("click", () => fetchDiaryArchive());

  document
    .getElementById("loadArchiveDates")
    ?.addEventListener("click", loadDiaryDates);
});

async function fetchDiaryArchive(dateParam = null) {
  const savedToken = localStorage.getItem("jwt");
  const date = dateParam || document.getElementById("archiveDate")?.value;
  const output = document.getElementById("archiveResult");

  if (!date) {
    alert("날짜를 선택해주세요.");
    return;
  }

  try {
    const res = await fetch(`/api/diary/archive?date=${date}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + savedToken,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      output.innerText = `❌ 오류: ${text}`;
      return;
    }

    const data = await res.json();

    output.innerText =
      `📅 Date: ${data.date}\n\n` +
      `💬 Messages:\n${data.messages
        .map((m) => `[${m.role}] ${m.content} (${m.created_at})`)
        .join("\n")}\n\n` +
      `📄 Diary:\n${data.diary?.summary || "No diary summary."}`;
  } catch (err) {
    console.error("Fetch error:", err);
    output.innerText = "❌ 네트워크 오류 또는 서버 응답 실패";
  }
}

async function loadDiaryDates() {
  const savedToken = localStorage.getItem("jwt");
  const ul = document.getElementById("diaryDateList");
  ul.innerHTML = ""; // 초기화

  try {
    const res = await fetch("/api/diary/dates", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + savedToken,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      alert("날짜 로드 실패: " + text);
      return;
    }

    const data = await res.json();

    if (data.dates.length === 0) {
      ul.innerHTML = "<li>작성된 일기가 없습니다.</li>";
      return;
    }

    data.dates.forEach((date) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.textContent = date;
      btn.onclick = () => fetchDiaryArchive(date);
      li.appendChild(btn);
      ul.appendChild(li);
    });
  } catch (err) {
    console.error("Diary date load error:", err);
    alert("네트워크 오류 또는 서버 오류");
  }
}
