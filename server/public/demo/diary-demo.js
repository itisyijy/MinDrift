// diary.js

// Generate diary from past messages
async function generateFromHistory() {
  const savedToken = localStorage.getItem("jwt");

  try {
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
        alert("Error: " + (errorData.error || "Unknown error"));
      } else {
        const text = await res.text();
        alert("Server error: " + text);
      }
      return;
    }

    const data = await res.json();
    document.getElementById("diarySummary").innerHTML = data.reply;
  } catch (err) {
    console.error("Diary fetch error:", err);
    alert("Network or server error");
  }
}

// Load diary summary by date
async function fetchDiaryArchive(dateParam = null) {
  const savedToken = localStorage.getItem("jwt");
  const date = dateParam || document.getElementById("archiveDate")?.value;
  const output = document.getElementById("archiveResult");

  if (!date) {
    alert("Please select a date.");
    return;
  }

  try {
    const res = await fetch(`/api/diary/archive?date=${date}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + savedToken },
    });

    if (!res.ok) {
      const text = await res.text();
      output.innerText = `Error: ${text}`;
      return;
    }

    const data = await res.json();

    output.innerText =
      `Date: ${data.date}\n\n` +
      `Messages:\n${data.messages
        .map((m) => `[${m.role}] ${m.content} (${m.created_at})`)
        .join("\n")}\n\n` +
      `Diary:\n${data.diary?.summary || "No diary summary."}`;
  } catch (err) {
    console.error("Diary archive error:", err);
    output.innerText = "Network or server error";
  }
}

// Load all diary dates
async function loadDiaryDates() {
  const savedToken = localStorage.getItem("jwt");
  const ul = document.getElementById("diaryDateList");
  ul.innerHTML = "";

  try {
    const res = await fetch("/api/diary/dates", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + savedToken,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      alert("Failed to load dates: " + text);
      return;
    }

    const data = await res.json();

    if (data.dates.length === 0) {
      ul.innerHTML = "<li>No diary entries available.</li>";
      return;
    }

    data.dates.forEach((date) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.textContent = date;
      btn.onclick = () => fetchDiaryArchive(date);
      li.appendChild(btn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => deleteDiaryByDate(date);
      li.appendChild(delBtn);

      ul.appendChild(li);
    });
  } catch (err) {
    console.error("Diary date load error:", err);
    alert("Network or server error");
  }
}

// Delete diary by date
async function deleteDiaryByDate(date) {
  const token = localStorage.getItem("jwt");

  try {
    const res = await fetch(`/api/diary/id-by-date?date=${date}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      alert("Failed to get diary ID");
      return;
    }

    const { id } = await res.json();
    const confirmDelete = confirm(`Delete diary for ${date}?`);
    if (!confirmDelete) return;

    const delRes = await fetch(`/api/diary/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await delRes.json();
    if (delRes.ok) {
      alert("Deleted successfully");
      loadDiaryDates();
    } else {
      alert("Delete failed: " + result.error);
    }
  } catch (err) {
    alert("Network error");
  }
}
