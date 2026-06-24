import { loadQuestions, uniqueValues } from "./questions.js";

const STORAGE_KEYS = {
  currentUser: "quizmasterpro_current_user",
  profiles: "quizmasterpro_profiles",
  leaderboard: "quizmasterpro_leaderboard",
  theme: "quizmasterpro_theme",
};

const elements = {
  themeToggle: document.querySelector("#themeToggle"),
  themeToggleLabel: document.querySelector("#themeToggleLabel"),
  loginForm: document.querySelector("#loginForm"),
  usernameInput: document.querySelector("#usernameInput"),
  publicLeaderboard: document.querySelector("#publicLeaderboard"),
  questionBankCount: document.querySelector("#questionBankCount"),
  categoryCount: document.querySelector("#categoryCount"),
  difficultyCount: document.querySelector("#difficultyCount"),
  continuePanel: document.querySelector("#continuePanel"),
  continueUsername: document.querySelector("#continueUsername"),
  continueButton: document.querySelector("#continueButton"),
  switchAccountButton: document.querySelector("#switchAccountButton"),
  toastContainer: document.querySelector("#toastContainer"),
};

document.addEventListener("DOMContentLoaded", initializeLoginPage);

async function initializeLoginPage() {
  bindEvents();
  restoreTheme();
  restoreExistingSession();
  renderLeaderboard();

  try {
    const questions = await loadQuestions();
    elements.questionBankCount.textContent = `${questions.length}`;
    elements.categoryCount.textContent = `${uniqueValues(questions, "category").length}`;
    elements.difficultyCount.textContent = `${uniqueValues(questions, "difficulty").length}`;
  } catch (error) {
    console.error(error);
    showToast("Question bank preview could not be loaded. Start the project with a local server.");
  }
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.continueButton.addEventListener("click", redirectToDashboard);
  elements.switchAccountButton.addEventListener("click", switchAccount);
}

function restoreTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "theme-dark";
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(savedTheme);
  elements.themeToggleLabel.textContent = savedTheme === "theme-dark" ? "Light Mode" : "Dark Mode";
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("theme-dark") ? "theme-light" : "theme-dark";
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(nextTheme);
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  elements.themeToggleLabel.textContent = nextTheme === "theme-dark" ? "Light Mode" : "Dark Mode";
}

function handleLogin(event) {
  event.preventDefault();

  const username = elements.usernameInput.value.trim().replace(/\s+/g, " ");

  if (!username) {
    showToast("Please enter a username to continue.");
    return;
  }

  const profiles = getProfiles();
  const profile = normalizeProfile(profiles[username] || createProfile(username));
  profiles[username] = profile;

  localStorage.setItem(STORAGE_KEYS.currentUser, username);
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));

  redirectToDashboard();
}

function restoreExistingSession() {
  const username = localStorage.getItem(STORAGE_KEYS.currentUser);
  const profiles = getProfiles();

  if (!username || !profiles[username]) {
    elements.continuePanel.classList.add("hidden");
    return;
  }

  elements.continueUsername.textContent = username;
  elements.usernameInput.value = username;
  elements.continuePanel.classList.remove("hidden");
}

function switchAccount() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  elements.usernameInput.value = "";
  elements.continuePanel.classList.add("hidden");
  elements.usernameInput.focus();
}

function renderLeaderboard() {
  const topScores = [...getLeaderboard()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.timeTakenMs - right.timeTakenMs;
    })
    .slice(0, 5);

  elements.publicLeaderboard.innerHTML = topScores.length
    ? topScores
        .map(
          (entry, index) => `
            <article class="leaderboard-item">
              <div class="rank-badge">${index + 1}</div>
              <div>
                <strong>${escapeHtml(entry.username)}</strong>
                <div class="leaderboard-meta">
                  <span>${entry.score} pts</span>
                  <span>${entry.accuracy}% accuracy</span>
                  <span>${formatDuration(entry.timeTakenMs)}</span>
                </div>
              </div>
              <span class="tag">${escapeHtml(entry.categoriesLabel || "Mixed")}</span>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">Complete a quiz to populate the global leaderboard.</div>`;
}

function getProfiles() {
  return parseStoredJson(STORAGE_KEYS.profiles, {});
}

function getLeaderboard() {
  return parseStoredJson(STORAGE_KEYS.leaderboard, []);
}

function parseStoredJson(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.error(`Could not parse storage key "${key}"`, error);
    return fallbackValue;
  }
}

function createProfile(username) {
  return {
    username,
    scores: [],
    bookmarks: [],
  };
}

function normalizeProfile(profile) {
  return {
    username: profile.username,
    scores: Array.isArray(profile.scores) ? profile.scores : [],
    bookmarks: Array.isArray(profile.bookmarks) ? profile.bookmarks : [],
  };
}

function redirectToDashboard() {
  window.location.href = "./index.html";
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
