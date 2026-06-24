import { loadQuestions, uniqueValues } from "./questions.js";

const STORAGE_KEYS = {
  currentUser: "quiz_application_current_user",
  profiles: "quiz_application_profiles",
  leaderboard: "quiz_application_leaderboard",
  theme: "quiz_application_theme",
};

const LEGACY_STORAGE_KEYS = {
  currentUser: "quizmasterpro_current_user",
  profiles: "quizmasterpro_profiles",
  leaderboard: "quizmasterpro_leaderboard",
  theme: "quizmasterpro_theme",
};

const HERO_SLIDES = [
  {
    badge: "Rank Boosting Practice",
    title: "Crack coding, aptitude, and logic with one focused platform.",
    description:
      "Structured quiz tracks, live challenge rooms, and explanation-first review mode for students who want real improvement.",
    offer: "Free + Premium Mock Packs",
    track: "JavaScript Sprint",
    accuracy: "92%",
  },
  {
    badge: "Timed Exam Simulation",
    title: "Practice under pressure before the real test begins.",
    description:
      "Use 30-second timers, lifelines, retries, and analytics to build speed without losing conceptual accuracy.",
    offer: "New timed bundles every week",
    track: "Aptitude Race",
    accuracy: "88%",
  },
  {
    badge: "Affordable Guided Prep",
    title: "Build a study routine that actually sticks every day.",
    description:
      "Bookmarks, review mode, score history, and smart category filters help you convert practice into consistent progress.",
    offer: "Personal practice dashboard included",
    track: "Python + DSA Track",
    accuracy: "95%",
  },
];

const state = {
  slideIndex: 0,
  slideTimer: null,
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
  leaderboardCount: document.querySelector("#leaderboardCount"),
  continuePanel: document.querySelector("#continuePanel"),
  continueUsername: document.querySelector("#continueUsername"),
  continueButton: document.querySelector("#continueButton"),
  switchAccountButton: document.querySelector("#switchAccountButton"),
  openLoginButton: document.querySelector("#openLoginButton"),
  closeAuthModal: document.querySelector("#closeAuthModal"),
  authModal: document.querySelector("#authModal"),
  floatingHelpButton: document.querySelector("#floatingHelpButton"),
  getStartedButton: document.querySelector("#getStartedButton"),
  leaderboardLoginButton: document.querySelector("#leaderboardLoginButton"),
  heroPrimaryAction: document.querySelector("#heroPrimaryAction"),
  heroSecondaryAction: document.querySelector("#heroSecondaryAction"),
  heroBadge: document.querySelector("#heroBadge"),
  heroTitle: document.querySelector("#heroTitle"),
  heroDescription: document.querySelector("#heroDescription"),
  heroOffer: document.querySelector("#heroOffer"),
  phoneTrack: document.querySelector("#phoneTrack"),
  phoneAccuracy: document.querySelector("#phoneAccuracy"),
  heroDots: document.querySelector("#heroDots"),
  toastContainer: document.querySelector("#toastContainer"),
};

document.addEventListener("DOMContentLoaded", initializeLoginPage);

async function initializeLoginPage() {
  migrateLegacyStorage();
  bindEvents();
  restoreTheme();
  restoreExistingSession();
  renderHeroDots();
  renderHeroSlide(0);
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

  startHeroAutoplay();
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.continueButton.addEventListener("click", redirectToDashboard);
  elements.switchAccountButton.addEventListener("click", switchAccount);
  elements.openLoginButton.addEventListener("click", openAuthModal);
  elements.closeAuthModal.addEventListener("click", closeAuthModal);
  elements.floatingHelpButton.addEventListener("click", openAuthModal);
  elements.getStartedButton.addEventListener("click", openAuthModal);
  elements.leaderboardLoginButton.addEventListener("click", openAuthModal);
  elements.heroPrimaryAction.addEventListener("click", openAuthModal);
  elements.heroSecondaryAction.addEventListener("click", scrollToCourses);

  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-auth='true']")) {
      closeAuthModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAuthModal();
    }
  });
}

function restoreTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "theme-light";
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
  elements.openLoginButton.textContent = "Continue";
  elements.floatingHelpButton.textContent = "Continue";
  elements.continuePanel.classList.remove("hidden");
}

function switchAccount() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  elements.usernameInput.value = "";
  elements.continuePanel.classList.add("hidden");
  elements.usernameInput.focus();
}

function openAuthModal() {
  elements.authModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  window.setTimeout(() => {
    elements.usernameInput.focus();
  }, 100);
}

function closeAuthModal() {
  elements.authModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function renderLeaderboard() {
  const sortedEntries = [...getLeaderboard()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.timeTakenMs - right.timeTakenMs;
  });

  elements.leaderboardCount.textContent = `${sortedEntries.length}`;

  const topScores = sortedEntries.slice(0, 6);

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

function renderHeroDots() {
  elements.heroDots.innerHTML = HERO_SLIDES.map((_, index) => {
    const isActive = index === state.slideIndex ? "is-active" : "";
    return `<button class="hero-dot ${isActive}" type="button" data-slide-index="${index}" aria-label="Go to slide ${index + 1}"></button>`;
  }).join("");

  elements.heroDots.querySelectorAll("[data-slide-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.slideIndex);
      renderHeroSlide(nextIndex);
      restartHeroAutoplay();
    });
  });
}

function renderHeroSlide(index) {
  state.slideIndex = index;
  const slide = HERO_SLIDES[index];

  elements.heroBadge.textContent = slide.badge;
  elements.heroTitle.textContent = slide.title;
  elements.heroDescription.textContent = slide.description;
  elements.heroOffer.textContent = slide.offer;
  elements.phoneTrack.textContent = slide.track;
  elements.phoneAccuracy.textContent = slide.accuracy;

  elements.heroDots.querySelectorAll(".hero-dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function startHeroAutoplay() {
  clearInterval(state.slideTimer);
  state.slideTimer = window.setInterval(() => {
    const nextIndex = (state.slideIndex + 1) % HERO_SLIDES.length;
    renderHeroSlide(nextIndex);
  }, 4200);
}

function restartHeroAutoplay() {
  startHeroAutoplay();
}

function scrollToCourses() {
  document.querySelector("#courses")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function migrateLegacyStorage() {
  Object.entries(STORAGE_KEYS).forEach(([name, nextKey]) => {
    const legacyKey = LEGACY_STORAGE_KEYS[name];

    if (!legacyKey || localStorage.getItem(nextKey) !== null) {
      return;
    }

    const legacyValue = localStorage.getItem(legacyKey);

    if (legacyValue !== null) {
      localStorage.setItem(nextKey, legacyValue);
    }
  });
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
