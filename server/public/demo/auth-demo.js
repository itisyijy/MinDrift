// auth.js
let token = "";
const PORT = 8080;

// Login and store JWT token
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
    "Login Success\n\n" + JSON.stringify(data, null, 2);

  await fetchUserInfo();
}

// Logout
function logout() {
  localStorage.removeItem("jwt");
  token = "";
  alert("Logged out");
}

// Fetch current user info
async function fetchUserInfo() {
  const savedToken = localStorage.getItem("jwt");
  const res = await fetch(`http://localhost:${PORT}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${savedToken}` },
  });

  const output = document.getElementById("welcome");
  if (res.ok) {
    const data = await res.json();
    output.innerText = `Hello, ${data.username}`;
  } else {
    output.innerText = "Failed to load user info";
  }
}

// Register new user
async function register() {
  const user_id = document.getElementById("reg_user_id").value.trim();
  const username = document.getElementById("reg_username").value.trim();
  const password = document.getElementById("reg_password").value;
  const confirm = document.getElementById("reg_confirm").value;
  const output = document.getElementById("registerResult");

  if (!user_id || !username || !password || !confirm) {
    output.innerText = "All fields are required.";
    return;
  }

  if (password !== confirm) {
    output.innerText = "Passwords do not match.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:${PORT}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, username, password }),
    });

    if (res.status === 409) {
      output.innerText = "User ID already exists.";
      return;
    }

    if (!res.ok) {
      const msg = await res.text();
      output.innerText = "Registration failed: " + msg;
      return;
    }

    output.innerText = "Registration successful. Please log in.";
  } catch (err) {
    console.error("Register error:", err);
    output.innerText = "Network or server error.";
  }
}

// Change username
async function changeUsername() {
  const newUsername = document.getElementById("new_username").value.trim();
  const output = document.getElementById("changeUsernameResult");
  const savedToken = localStorage.getItem("jwt");

  if (!newUsername) {
    output.innerText = "New username is required.";
    return;
  }

  const res = await fetch("http://localhost:8080/auth/username", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + savedToken,
    },
    body: JSON.stringify({ newUsername }),
  });

  if (!res.ok) {
    const msg = await res.text();
    output.innerText = `Failed: ${msg}`;
    return;
  }

  const data = await res.json();
  output.innerText = `Username changed: ${data.newUsername}`;
  await fetchUserInfo();
}
