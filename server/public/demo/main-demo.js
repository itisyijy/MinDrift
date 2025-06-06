// main.js

// Register button event listeners on page load
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
    ?.addEventListener("click", generateFromHistory);
  document
    .getElementById("fetchArchiveBtn")
    ?.addEventListener("click", () => fetchDiaryArchive());
  document
    .getElementById("loadArchiveDates")
    ?.addEventListener("click", loadDiaryDates);
  document
    .getElementById("changeUsernameBtn")
    ?.addEventListener("click", changeUsername);
});
