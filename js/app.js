import {
  filterQuestions,
  loadQuestions,
  prepareQuestionsForSession,
  uniqueValues,
} from "./questions.js";

const STORAGE_KEYS = {
  currentUser: "quizmasterpro_current_user",
  profiles: "quizmasterpro_profiles",
  leaderboard: "quizmasterpro_leaderboard",
  theme: "quizmasterpro_theme",
};

const BASE_TIME_LIMIT = 30;
const EXTRA_TIME_AMOUNT = 15;
const MAX_BONUS_PER_QUESTION = 10;
const SCORE_PER_CORRECT = 10;

const state = {
  questions: [],
  profile: null,
  currentQuiz: null,
  lastResult: null,
  charts: {
    answers: null,
    category: null,
    distribution: null,
  },
  audioContext: null,
};

// Centralized DOM references keep the rest of the file focused on app behavior.
const elements = {
  dashboardSection: document.querySelector("#dashboardSection"),
  quizSection: document.querySelector("#quizSection"),
  resultsSection: document.querySelector("#resultsSection"),
  userBadge: document.querySelector("#userBadge"),
  activeUsername: document.querySelector("#activeUsername"),
  logoutButton: document.querySelector("#logoutButton"),
  themeToggle: document.querySelector("#themeToggle"),
  themeToggleLabel: document.querySelector("#themeToggleLabel"),
  dashboardWelcome: document.querySelector("#dashboardWelcome"),
  profileName: document.querySelector("#profileName"),
  profileQuizCount: document.querySelector("#profileQuizCount"),
  profileBestScore: document.querySelector("#profileBestScore"),
  profileAverageAccuracy: document.querySelector("#profileAverageAccuracy"),
  profileBookmarkCount: document.querySelector("#profileBookmarkCount"),
  profileLevel: document.querySelector("#profileLevel"),
  profileLastRating: document.querySelector("#profileLastRating"),
  profileStreak: document.querySelector("#profileStreak"),
  performanceSummary: document.querySelector("#performanceSummary"),
  favoriteTrack: document.querySelector("#favoriteTrack"),
  readinessBadge: document.querySelector("#readinessBadge"),
  radarSummary: document.querySelector("#radarSummary"),
  radarCountBadge: document.querySelector("#radarCountBadge"),
  recentSummary: document.querySelector("#recentSummary"),
  recentCountBadge: document.querySelector("#recentCountBadge"),
  bookmarkSummary: document.querySelector("#bookmarkSummary"),
  bookmarkCountBadge: document.querySelector("#bookmarkCountBadge"),
  leaderboardSummary: document.querySelector("#leaderboardSummary"),
  leaderboardCountBadge: document.querySelector("#leaderboardCountBadge"),
  bookmarksList: document.querySelector("#bookmarksList"),
  practiceBookmarksButton: document.querySelector("#practiceBookmarksButton"),
  dashboardLeaderboard: document.querySelector("#dashboardLeaderboard"),
  recentScores: document.querySelector("#recentScores"),
  loadedQuestionCount: document.querySelector("#loadedQuestionCount"),
  matchingQuestionCount: document.querySelector("#matchingQuestionCount"),
  poolSummary: document.querySelector("#poolSummary"),
  categoryFilters: document.querySelector("#categoryFilters"),
  difficultyFilters: document.querySelector("#difficultyFilters"),
  questionCountSelect: document.querySelector("#questionCountSelect"),
  questionSearchInput: document.querySelector("#questionSearchInput"),
  searchResultsPreview: document.querySelector("#searchResultsPreview"),
  startQuizButton: document.querySelector("#startQuizButton"),
  quizSessionTitle: document.querySelector("#quizSessionTitle"),
  liveScore: document.querySelector("#liveScore"),
  questionPosition: document.querySelector("#questionPosition"),
  progressLabel: document.querySelector("#progressLabel"),
  progressFill: document.querySelector("#progressFill"),
  timerRing: document.querySelector("#timerRing"),
  timerValue: document.querySelector("#timerValue"),
  lifelineFifty: document.querySelector("#lifelineFifty"),
  lifelineSkip: document.querySelector("#lifelineSkip"),
  lifelineTime: document.querySelector("#lifelineTime"),
  currentCategoryBadge: document.querySelector("#currentCategoryBadge"),
  currentDifficultyBadge: document.querySelector("#currentDifficultyBadge"),
  bookmarkButton: document.querySelector("#bookmarkButton"),
  questionText: document.querySelector("#questionText"),
  optionList: document.querySelector("#optionList"),
  feedbackBanner: document.querySelector("#feedbackBanner"),
  submitAnswerButton: document.querySelector("#submitAnswerButton"),
  resultsHeadline: document.querySelector("#resultsHeadline"),
  resultsRating: document.querySelector("#resultsRating"),
  resultTotalQuestions: document.querySelector("#resultTotalQuestions"),
  resultCorrectAnswers: document.querySelector("#resultCorrectAnswers"),
  resultWrongAnswers: document.querySelector("#resultWrongAnswers"),
  resultAccuracy: document.querySelector("#resultAccuracy"),
  resultFinalScore: document.querySelector("#resultFinalScore"),
  resultTimeTaken: document.querySelector("#resultTimeTaken"),
  retryIncorrectButton: document.querySelector("#retryIncorrectButton"),
  downloadCertificateButton: document.querySelector("#downloadCertificateButton"),
  backToDashboardButton: document.querySelector("#backToDashboardButton"),
  reviewList: document.querySelector("#reviewList"),
  certificatePanel: document.querySelector("#certificatePanel"),
  certificateUsername: document.querySelector("#certificateUsername"),
  certificateCategory: document.querySelector("#certificateCategory"),
  certificateScore: document.querySelector("#certificateScore"),
  certificateDate: document.querySelector("#certificateDate"),
  answersChart: document.querySelector("#answersChart"),
  categoryChart: document.querySelector("#categoryChart"),
  distributionChart: document.querySelector("#distributionChart"),
  toastContainer: document.querySelector("#toastContainer"),
};

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  restoreTheme();
  const hasSession = restoreSession();

  if (!hasSession) {
    redirectToLogin();
    return;
  }

  bindEvents();

  try {
    state.questions = await loadQuestions();
    elements.loadedQuestionCount.textContent = `${state.questions.length}`;
    renderFilterGroups();
    updateQuestionExplorer();
    renderProfile();
  } catch (error) {
    console.error(error);
    showToast("Could not load the question bank. Serve the project from a local web server and try again.");
  }

  renderLeaderboard();
}

function bindEvents() {
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.startQuizButton.addEventListener("click", () => startQuiz());
  elements.practiceBookmarksButton.addEventListener("click", startBookmarksQuiz);
  elements.questionSearchInput.addEventListener("input", updateQuestionExplorer);
  elements.questionCountSelect.addEventListener("change", updateQuestionExplorer);
  elements.submitAnswerButton.addEventListener("click", () => submitCurrentAnswer({ timedOut: false, skipped: false }));
  elements.lifelineFifty.addEventListener("click", useFiftyFifty);
  elements.lifelineSkip.addEventListener("click", useSkipQuestion);
  elements.lifelineTime.addEventListener("click", useExtraTime);
  elements.bookmarkButton.addEventListener("click", toggleCurrentQuestionBookmark);
  elements.retryIncorrectButton.addEventListener("click", retryIncorrectQuestions);
  elements.backToDashboardButton.addEventListener("click", showDashboard);
  elements.downloadCertificateButton.addEventListener("click", downloadCertificateAsPdf);

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-filter]")) {
      updateQuestionExplorer();
    }
  });

  document.addEventListener(
    "pointerdown",
    () => {
      ensureAudioContext();
    },
    { once: true },
  );
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
  rerenderCharts();
}

function renderFilterGroups() {
  renderFilterGroup(elements.categoryFilters, uniqueValues(state.questions, "category"), "category");
  renderFilterGroup(elements.difficultyFilters, uniqueValues(state.questions, "difficulty"), "difficulty");
}

function renderFilterGroup(container, values, filterType) {
  container.innerHTML = values
    .map(
      (value) => `
        <label class="chip-option">
          <input type="checkbox" data-filter="${filterType}" value="${escapeHtml(value)}" checked />
          <span>${escapeHtml(value)}</span>
        </label>
      `,
    )
    .join("");
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  state.profile = null;
  state.currentQuiz = null;
  state.lastResult = null;
  clearQuizTimer();
  redirectToLogin();
}

function restoreSession() {
  const username = localStorage.getItem(STORAGE_KEYS.currentUser);

  if (!username) {
    return false;
  }

  const profiles = getProfiles();
  const profile = profiles[username] ? normalizeProfile(profiles[username]) : null;

  if (!profile) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    return false;
  }

  state.profile = profile;
  renderProfile();
  showDashboard();
  return true;
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

function renderProfile() {
  if (!state.profile) {
    return;
  }

  const scores = state.profile.scores || [];
  const latestAttempt = [...scores].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))[0];
  const bestScore = scores.reduce((max, entry) => Math.max(max, entry.score), 0);
  const averageAccuracy = scores.length
    ? Math.round(scores.reduce((sum, entry) => sum + entry.accuracy, 0) / scores.length)
    : 0;
  const favoriteTrack = getFavoriteTrack(scores);
  const currentLevel = getPlayerLevel(scores.length, bestScore, averageAccuracy);
  const lastRating = latestAttempt?.rating || "Unranked";
  const practiceStreak = calculatePracticeStreak(scores);
  const readiness = state.profile.bookmarks.length
    ? `You have ${state.profile.bookmarks.length} bookmarked question${state.profile.bookmarks.length === 1 ? "" : "s"} ready for revision.`
    : "Fresh slate. Build a focused quiz and start climbing the leaderboard.";

  elements.profileName.textContent = state.profile.username;
  elements.activeUsername.textContent = state.profile.username;
  elements.profileQuizCount.textContent = `${scores.length}`;
  elements.profileBestScore.textContent = `${bestScore}`;
  elements.profileAverageAccuracy.textContent = `${averageAccuracy}%`;
  elements.profileBookmarkCount.textContent = `${state.profile.bookmarks.length}`;
  setTextIfPresent(elements.dashboardWelcome, state.profile.username);
  setTextIfPresent(elements.profileLevel, currentLevel);
  setTextIfPresent(elements.profileLastRating, lastRating);
  setTextIfPresent(elements.profileStreak, `${practiceStreak} day${practiceStreak === 1 ? "" : "s"}`);
  setTextIfPresent(
    elements.performanceSummary,
    scores.length
      ? `${averageAccuracy}% average accuracy across ${scores.length} quiz${scores.length === 1 ? "" : "zes"} with a best score of ${bestScore}.`
      : "No quiz attempts yet. Start with a mixed session to generate your first performance snapshot.",
  );
  setTextIfPresent(elements.favoriteTrack, favoriteTrack);
  setTextIfPresent(elements.readinessBadge, readiness);

  renderRecentScores();
  renderBookmarks();
  updateUserBadge();
}

function updateUserBadge() {
  const hasUser = Boolean(state.profile);
  elements.userBadge.classList.toggle("hidden", !hasUser);
}

function renderRecentScores() {
  const scores = [...(state.profile?.scores || [])]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 5);

  setTextIfPresent(
    elements.recentSummary,
    scores.length
      ? `Showing your ${scores.length} most recent attempt${scores.length === 1 ? "" : "s"} with score and accuracy trends.`
      : "Your latest quiz attempts will appear here with score trends.",
  );
  setTextIfPresent(elements.recentCountBadge, `${scores.length} Attempt${scores.length === 1 ? "" : "s"}`);

  if (!scores.length) {
    elements.recentScores.innerHTML = renderPanelEmptyState(
      "Timeline Empty",
      "Your score history will appear here after your first completed quiz session.",
    );
    return;
  }

  elements.recentScores.innerHTML = scores
    .map(
      (score) => `
        <article class="history-item">
          <div class="history-top">
            <div>
              <span class="item-label">Session</span>
              <strong>${escapeHtml(score.categoriesLabel)}</strong>
            </div>
            <span class="score-pill">${score.score} pts</span>
          </div>
          <div class="history-meta">
            <span>${formatDate(score.timestamp)}</span>
            <span>${score.accuracy}% accuracy</span>
            <span>${formatDuration(score.timeTakenMs)}</span>
            <span>${score.rating}</span>
          </div>
          <div class="history-bar">
            <span style="width: ${score.accuracy}%"></span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderBookmarks() {
  const bookmarkedIds = state.profile?.bookmarks || [];

  setTextIfPresent(
    elements.bookmarkSummary,
    bookmarkedIds.length
      ? `${bookmarkedIds.length} bookmarked question${bookmarkedIds.length === 1 ? "" : "s"} saved for targeted revision.`
      : "Build a revision pocket by bookmarking difficult questions.",
  );
  setTextIfPresent(elements.bookmarkCountBadge, `${bookmarkedIds.length} Saved`);

  if (!bookmarkedIds.length) {
    elements.bookmarksList.innerHTML = renderPanelEmptyState(
      "No Bookmarks Yet",
      "Bookmark questions during a quiz to build a personalized deep-practice set.",
    );
    elements.practiceBookmarksButton.disabled = true;
    return;
  }

  const bookmarkedQuestions = state.questions.filter((question) => bookmarkedIds.includes(question.id));

  elements.bookmarksList.innerHTML = bookmarkedQuestions
    .slice(0, 6)
    .map(
      (question) => `
        <article class="bookmark-item">
          <div class="bookmark-top">
            <strong>${escapeHtml(question.question)}</strong>
            <span class="bookmark-pill">Saved</span>
          </div>
          <div class="bookmark-meta">
            <span>${escapeHtml(question.category)}</span>
            <span>${escapeHtml(question.difficulty)}</span>
          </div>
          <p class="bookmark-note">Ready for focused re-attempts and revision sessions.</p>
        </article>
      `,
    )
    .join("");

  elements.practiceBookmarksButton.disabled = bookmarkedQuestions.length === 0;
}

function updateQuestionExplorer() {
  if (!state.questions.length) {
    return;
  }

  const matchingQuestions = getFilteredQuestionPool();
  const questionCount = Number(elements.questionCountSelect.value);
  const previewItems = matchingQuestions.slice(0, 6);

  elements.matchingQuestionCount.textContent = `${matchingQuestions.length}`;
  elements.poolSummary.textContent = matchingQuestions.length
    ? `${Math.min(questionCount, matchingQuestions.length)} question${Math.min(questionCount, matchingQuestions.length) === 1 ? "" : "s"} ready from ${matchingQuestions.length} match${matchingQuestions.length === 1 ? "" : "es"}.`
    : "No questions match the current filters.";
  setTextIfPresent(
    elements.radarSummary,
    matchingQuestions.length
      ? `Showing ${previewItems.length} live preview card${previewItems.length === 1 ? "" : "s"} from ${matchingQuestions.length} matched question${matchingQuestions.length === 1 ? "" : "s"}.`
      : "Live question previews based on your current filter stack.",
  );
  setTextIfPresent(elements.radarCountBadge, `${matchingQuestions.length} Match${matchingQuestions.length === 1 ? "" : "es"}`);

  if (!previewItems.length) {
    elements.searchResultsPreview.innerHTML = renderPanelEmptyState(
      "No Matches Found",
      "Adjust categories, difficulty, or search terms to reveal matching questions here.",
    );
    return;
  }

  elements.searchResultsPreview.innerHTML = previewItems
    .map(
      (question) => `
        <article class="search-preview-item">
          <div class="search-preview-top">
            <span class="preview-badge">${escapeHtml(question.category)}</span>
            <span class="preview-badge secondary">${escapeHtml(question.difficulty)}</span>
          </div>
          <strong>${escapeHtml(question.question)}</strong>
          <p>${escapeHtml(question.explanation)}</p>
          <small>Concept Preview / Explanation Ready</small>
        </article>
      `,
    )
    .join("");
}

function getFilteredQuestionPool() {
  return filterQuestions(state.questions, {
    categories: getCheckedFilterValues("category"),
    difficulties: getCheckedFilterValues("difficulty"),
    search: elements.questionSearchInput.value.trim(),
  });
}

function getCheckedFilterValues(filterType) {
  return [...document.querySelectorAll(`[data-filter="${filterType}"]:checked`)].map((input) => input.value);
}

function startQuiz(customPool = null, mode = "standard", customTitle = "") {
  if (!state.profile) {
    showToast("Please log in before starting a quiz.");
    redirectToLogin();
    return;
  }

  const basePool = customPool || getFilteredQuestionPool();

  if (!basePool.length) {
    showToast("Adjust the filters or search term so at least one question is available.");
    return;
  }

  const desiredCount = Number(elements.questionCountSelect.value);
  // The prepared session is the single source of truth, which avoids repeated questions mid-quiz.
  const sessionQuestions = prepareQuestionsForSession(basePool, Math.min(desiredCount, basePool.length));
  const categories = [...new Set(sessionQuestions.map((question) => question.category))];
  const difficulties = [...new Set(sessionQuestions.map((question) => question.difficulty))];

  state.currentQuiz = {
    mode,
    title: customTitle || categories.join(", "),
    categories,
    difficulties,
    questions: sessionQuestions,
    currentIndex: 0,
    selectedAnswer: "",
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    bonusScore: 0,
    answers: [],
    startTimestamp: Date.now(),
    questionStartedAt: Date.now(),
    currentTimeLimit: BASE_TIME_LIMIT,
    timeRemaining: BASE_TIME_LIMIT,
    hiddenOptions: [],
    isAnswered: false,
    timerHandle: null,
    lifelines: {
      fiftyFifty: true,
      skip: true,
      extraTime: true,
    },
  };

  state.lastResult = null;
  elements.quizSessionTitle.textContent = customTitle || `${categories.join(" / ")} Session`;
  showView("quiz");
  renderCurrentQuestion();
  showToast(`Quiz started with ${sessionQuestions.length} question${sessionQuestions.length === 1 ? "" : "s"}.`);
}

function startBookmarksQuiz() {
  const bookmarkedQuestions = state.questions.filter((question) => state.profile?.bookmarks.includes(question.id));

  if (!bookmarkedQuestions.length) {
    showToast("You do not have any bookmarked questions yet.");
    return;
  }

  startQuiz(bookmarkedQuestions, "bookmarks", "Bookmarked Practice");
}

function renderCurrentQuestion() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  const question = quiz.questions[quiz.currentIndex];

  quiz.selectedAnswer = "";
  quiz.isAnswered = false;
  quiz.hiddenOptions = [];
  quiz.currentTimeLimit = BASE_TIME_LIMIT;
  quiz.timeRemaining = BASE_TIME_LIMIT;
  quiz.questionStartedAt = Date.now();

  elements.liveScore.textContent = `${quiz.score}`;
  elements.questionPosition.textContent = `${quiz.currentIndex + 1} / ${quiz.questions.length}`;
  elements.currentCategoryBadge.textContent = question.category;
  elements.currentDifficultyBadge.textContent = question.difficulty;
  elements.questionText.textContent = question.question;
  elements.submitAnswerButton.disabled = true;
  setFeedback("", "");
  updateBookmarkButton(question.id);
  updateProgress();
  updateLifelineButtons();

  elements.optionList.innerHTML = question.options
    .map(
      (option) => `
        <button class="option-button" type="button" data-option="${escapeAttribute(option)}">
          ${escapeHtml(option)}
        </button>
      `,
    )
    .join("");

  elements.optionList.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => selectOption(button.dataset.option, button));
  });

  startQuestionTimer();
}

function selectOption(option, button) {
  const quiz = state.currentQuiz;

  if (!quiz || quiz.isAnswered) {
    return;
  }

  quiz.selectedAnswer = option;
  elements.submitAnswerButton.disabled = false;

  elements.optionList.querySelectorAll(".option-button").forEach((optionButton) => {
    optionButton.classList.toggle("selected", optionButton === button);
  });
}

function startQuestionTimer() {
  clearQuizTimer();
  updateTimerUi();

  state.currentQuiz.timerHandle = window.setInterval(() => {
    const quiz = state.currentQuiz;

    if (!quiz || quiz.isAnswered) {
      clearQuizTimer();
      return;
    }

    quiz.timeRemaining = Math.max(0, quiz.timeRemaining - 0.1);
    updateTimerUi();

    if (quiz.timeRemaining <= 0) {
      clearQuizTimer();
      submitCurrentAnswer({ timedOut: true, skipped: false });
    }
  }, 100);
}

function updateTimerUi() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  const normalized = Math.max(0, Math.min(1, quiz.timeRemaining / quiz.currentTimeLimit));
  elements.timerRing.style.setProperty("--timer-progress", normalized.toFixed(3));
  elements.timerValue.textContent = `${Math.ceil(quiz.timeRemaining)}s`;
}

function submitCurrentAnswer({ timedOut, skipped }) {
  const quiz = state.currentQuiz;

  if (!quiz || quiz.isAnswered) {
    return;
  }

  const question = quiz.questions[quiz.currentIndex];
  const selectedAnswer = skipped ? "" : quiz.selectedAnswer;

  if (!selectedAnswer && !timedOut && !skipped) {
    showToast("Select an option before submitting.");
    return;
  }

  quiz.isAnswered = true;
  clearQuizTimer();

  const isCorrect = !skipped && selectedAnswer === question.answer;
  const bonus = isCorrect ? Math.min(MAX_BONUS_PER_QUESTION, Math.ceil(quiz.timeRemaining / 3)) : 0;
  const earnedScore = isCorrect ? SCORE_PER_CORRECT + bonus : 0;
  const responseTime = Date.now() - quiz.questionStartedAt;

  if (isCorrect) {
    quiz.correctAnswers += 1;
    quiz.bonusScore += bonus;
  } else {
    quiz.wrongAnswers += 1;
  }

  quiz.score += earnedScore;
  elements.liveScore.textContent = `${quiz.score}`;

  quiz.answers.push({
    questionId: question.id,
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    userAnswer: selectedAnswer || "No answer",
    correctAnswer: question.answer,
    explanation: question.explanation,
    isCorrect,
    skipped,
    timedOut,
    earnedScore,
    bonus,
    responseTime,
  });

  revealAnswerState(question.answer, selectedAnswer, { timedOut, skipped });
  playResultSound(isCorrect ? "correct" : "wrong");

  window.setTimeout(() => {
    moveToNextQuestion();
  }, 1400);
}

function revealAnswerState(correctAnswer, selectedAnswer, { timedOut, skipped }) {
  elements.optionList.querySelectorAll(".option-button").forEach((button) => {
    const option = button.dataset.option;
    button.disabled = true;

    if (option === correctAnswer) {
      button.classList.add("correct");
    } else if (selectedAnswer && option === selectedAnswer) {
      button.classList.add("incorrect");
    }
  });

  if (skipped) {
    setFeedback("info", `Question skipped. The correct answer was "${correctAnswer}".`);
    return;
  }

  if (timedOut) {
    setFeedback("error", `Time expired. The correct answer was "${correctAnswer}".`);
    return;
  }

  if (selectedAnswer === correctAnswer) {
    const quiz = state.currentQuiz;
    const lastAnswer = quiz.answers[quiz.answers.length - 1];
    setFeedback("success", `Correct. You earned ${lastAnswer.earnedScore} points including ${lastAnswer.bonus} bonus.`);
  } else {
    setFeedback("error", `Incorrect. The correct answer was "${correctAnswer}".`);
  }
}

function moveToNextQuestion() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  if (quiz.currentIndex >= quiz.questions.length - 1) {
    finishQuiz();
    return;
  }

  quiz.currentIndex += 1;
  renderCurrentQuestion();
}

function finishQuiz() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  const totalQuestions = quiz.questions.length;
  const accuracy = Math.round((quiz.correctAnswers / totalQuestions) * 100);
  const durationMs = Date.now() - quiz.startTimestamp;
  const categoriesLabel = quiz.categories.join(", ");
  const rating = getPerformanceRating(accuracy);
  const categoryPerformance = buildCategoryPerformance(quiz.answers);
  const scorePercent = Math.round((quiz.score / (totalQuestions * (SCORE_PER_CORRECT + MAX_BONUS_PER_QUESTION))) * 100);

  const result = {
    id: `quiz-${Date.now()}`,
    username: state.profile.username,
    score: quiz.score,
    accuracy,
    correctAnswers: quiz.correctAnswers,
    wrongAnswers: quiz.wrongAnswers,
    totalQuestions,
    timeTakenMs: durationMs,
    rating,
    timestamp: new Date().toISOString(),
    categoriesLabel,
    difficultiesLabel: quiz.difficulties.join(", "),
    bonusScore: quiz.bonusScore,
    answers: quiz.answers,
    categoryPerformance,
    scorePercent,
    mode: quiz.mode,
  };

  state.lastResult = result;
  persistResult(result);
  state.currentQuiz = null;
  renderProfile();
  renderLeaderboard();
  showView("results");
  window.requestAnimationFrame(() => {
    renderResults(result);
  });
}

function persistResult(result) {
  const profiles = getProfiles();
  const profile = profiles[state.profile.username] || createProfile(state.profile.username);

  profile.scores = [...(profile.scores || []), result];
  profiles[state.profile.username] = profile;
  saveProfiles(profiles);

  state.profile = profile;

  const leaderboard = getLeaderboard();
  leaderboard.push({
    username: result.username,
    score: result.score,
    accuracy: result.accuracy,
    timeTakenMs: result.timeTakenMs,
    timestamp: result.timestamp,
    categoriesLabel: result.categoriesLabel,
  });

  localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(leaderboard));
}

function renderResults(result) {
  elements.resultsHeadline.textContent = `${result.username}, your quiz is complete.`;
  elements.resultsRating.textContent = result.rating;
  elements.resultTotalQuestions.textContent = `${result.totalQuestions}`;
  elements.resultCorrectAnswers.textContent = `${result.correctAnswers}`;
  elements.resultWrongAnswers.textContent = `${result.wrongAnswers}`;
  elements.resultAccuracy.textContent = `${result.accuracy}%`;
  elements.resultFinalScore.textContent = `${result.score}`;
  elements.resultTimeTaken.textContent = formatDuration(result.timeTakenMs);

  elements.retryIncorrectButton.disabled = result.wrongAnswers === 0;

  const eligibleForCertificate = result.accuracy >= 70;
  elements.certificatePanel.classList.toggle("hidden", !eligibleForCertificate);
  elements.downloadCertificateButton.disabled = !eligibleForCertificate;

  if (eligibleForCertificate) {
    elements.certificateUsername.textContent = result.username;
    elements.certificateCategory.textContent = result.categoriesLabel;
    elements.certificateScore.textContent = `${result.score} points`;
    elements.certificateDate.textContent = formatLongDate(result.timestamp);
  }

  renderReview(result);
  renderCharts(result);
}

function renderReview(result) {
  elements.reviewList.innerHTML = result.answers
    .map((answer, index) => {
      const statusClass = answer.isCorrect ? "correct" : answer.skipped || answer.timedOut ? "neutral" : "incorrect";
      const statusLabel = answer.isCorrect
        ? "Correct"
        : answer.skipped
          ? "Skipped"
          : answer.timedOut
            ? "Timed Out"
            : "Incorrect";

      return `
        <article class="review-item">
          <div class="card-header compact">
            <strong>Q${index + 1}. ${escapeHtml(answer.question)}</strong>
            <span class="answer-pill ${statusClass}">${statusLabel}</span>
          </div>
          <div class="review-meta">${escapeHtml(answer.category)} / ${escapeHtml(answer.difficulty)}</div>
          <div class="review-answer-row">
            <span><strong>Your answer:</strong> ${escapeHtml(answer.userAnswer)}</span>
          </div>
          <div class="review-answer-row">
            <span><strong>Correct answer:</strong> ${escapeHtml(answer.correctAnswer)}</span>
          </div>
          <p class="review-explanation">${escapeHtml(answer.explanation)}</p>
        </article>
      `;
    })
    .join("");
}

function renderCharts(result) {
  if (!window.Chart) {
    return;
  }

  destroyCharts();

  const axisColor = document.body.classList.contains("theme-dark") ? "#b8c7df" : "#58708e";

  state.charts.answers = new window.Chart(elements.answersChart, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [
        {
          data: [result.correctAnswers, result.wrongAnswers],
          backgroundColor: ["#2ec4b6", "#ff5c7a"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: axisColor,
          },
        },
      },
      maintainAspectRatio: false,
    },
  });

  const categories = Object.keys(result.categoryPerformance);
  const correctCounts = categories.map((category) => result.categoryPerformance[category].correct);
  const wrongCounts = categories.map((category) => result.categoryPerformance[category].wrong);

  state.charts.category = new window.Chart(elements.categoryChart, {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Correct",
          data: correctCounts,
          backgroundColor: "#2ec4b6",
          borderRadius: 10,
        },
        {
          label: "Wrong",
          data: wrongCounts,
          backgroundColor: "#ff9f1c",
          borderRadius: 10,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: axisColor,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: axisColor },
          grid: { display: false },
        },
        y: {
          ticks: { color: axisColor, precision: 0 },
          grid: { color: "rgba(128, 145, 168, 0.18)" },
        },
      },
      maintainAspectRatio: false,
    },
  });

  const distributionBuckets = buildScoreDistribution();

  state.charts.distribution = new window.Chart(elements.distributionChart, {
    type: "line",
    data: {
      labels: distributionBuckets.labels,
      datasets: [
        {
          label: "Attempts",
          data: distributionBuckets.values,
          borderColor: "#1177d1",
          backgroundColor: "rgba(17, 119, 209, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: axisColor,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: axisColor },
          grid: { display: false },
        },
        y: {
          ticks: { color: axisColor, precision: 0 },
          grid: { color: "rgba(128, 145, 168, 0.18)" },
        },
      },
      maintainAspectRatio: false,
    },
  });
}

function buildCategoryPerformance(answers) {
  return answers.reduce((accumulator, answer) => {
    if (!accumulator[answer.category]) {
      accumulator[answer.category] = { correct: 0, wrong: 0 };
    }

    if (answer.isCorrect) {
      accumulator[answer.category].correct += 1;
    } else {
      accumulator[answer.category].wrong += 1;
    }

    return accumulator;
  }, {});
}

function buildScoreDistribution() {
  const scores = Object.values(getProfiles()).flatMap((profile) => profile.scores || []);
  const buckets = [
    { label: "0-20", count: 0 },
    { label: "21-40", count: 0 },
    { label: "41-60", count: 0 },
    { label: "61-80", count: 0 },
    { label: "81-100", count: 0 },
  ];

  scores.forEach((score) => {
    const value = score.scorePercent ?? 0;

    if (value <= 20) {
      buckets[0].count += 1;
    } else if (value <= 40) {
      buckets[1].count += 1;
    } else if (value <= 60) {
      buckets[2].count += 1;
    } else if (value <= 80) {
      buckets[3].count += 1;
    } else {
      buckets[4].count += 1;
    }
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    values: buckets.map((bucket) => bucket.count),
  };
}

function rerenderCharts() {
  if (state.lastResult) {
    renderCharts(state.lastResult);
  }
}

function destroyCharts() {
  Object.values(state.charts).forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  state.charts.answers = null;
  state.charts.category = null;
  state.charts.distribution = null;
}

function useFiftyFifty() {
  const quiz = state.currentQuiz;

  if (!quiz || !quiz.lifelines.fiftyFifty || quiz.isAnswered) {
    return;
  }

  const question = quiz.questions[quiz.currentIndex];
  const incorrectOptions = question.options.filter((option) => option !== question.answer);
  const optionsToHide = shuffleArray(incorrectOptions).slice(0, 2);

  quiz.hiddenOptions = optionsToHide;
  quiz.lifelines.fiftyFifty = false;

  elements.optionList.querySelectorAll(".option-button").forEach((button) => {
    if (optionsToHide.includes(button.dataset.option)) {
      button.classList.add("hidden-option");
      button.disabled = true;
    }
  });

  updateLifelineButtons();
  showToast("50-50 used. Two incorrect options were removed.");
}

function useSkipQuestion() {
  const quiz = state.currentQuiz;

  if (!quiz || !quiz.lifelines.skip || quiz.isAnswered) {
    return;
  }

  quiz.lifelines.skip = false;
  updateLifelineButtons();
  submitCurrentAnswer({ timedOut: false, skipped: true });
}

function useExtraTime() {
  const quiz = state.currentQuiz;

  if (!quiz || !quiz.lifelines.extraTime || quiz.isAnswered) {
    return;
  }

  quiz.lifelines.extraTime = false;
  quiz.currentTimeLimit += EXTRA_TIME_AMOUNT;
  quiz.timeRemaining += EXTRA_TIME_AMOUNT;
  updateTimerUi();
  updateLifelineButtons();
  showToast(`Extra time activated. ${EXTRA_TIME_AMOUNT} seconds added.`);
}

function updateLifelineButtons() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  elements.lifelineFifty.disabled = !quiz.lifelines.fiftyFifty || quiz.isAnswered;
  elements.lifelineSkip.disabled = !quiz.lifelines.skip || quiz.isAnswered;
  elements.lifelineTime.disabled = !quiz.lifelines.extraTime || quiz.isAnswered;
}

function toggleCurrentQuestionBookmark() {
  const quiz = state.currentQuiz;

  if (!quiz || !state.profile) {
    return;
  }

  const questionId = quiz.questions[quiz.currentIndex].id;
  const alreadyBookmarked = state.profile.bookmarks.includes(questionId);
  const updatedBookmarks = alreadyBookmarked
    ? state.profile.bookmarks.filter((bookmarkId) => bookmarkId !== questionId)
    : [...state.profile.bookmarks, questionId];

  updateCurrentProfile({ bookmarks: updatedBookmarks });
  updateBookmarkButton(questionId);
  renderProfile();
  showToast(alreadyBookmarked ? "Bookmark removed." : "Question bookmarked for later practice.");
}

function updateBookmarkButton(questionId) {
  const isBookmarked = state.profile?.bookmarks.includes(questionId);
  elements.bookmarkButton.textContent = isBookmarked ? "Bookmarked" : "Bookmark Question";
}

function retryIncorrectQuestions() {
  if (!state.lastResult) {
    return;
  }

  const incorrectIds = state.lastResult.answers.filter((answer) => !answer.isCorrect).map((answer) => answer.questionId);
  const retryPool = state.questions.filter((question) => incorrectIds.includes(question.id));

  if (!retryPool.length) {
    showToast("No incorrect questions were found to retry.");
    return;
  }

  startQuiz(retryPool, "retry", "Retry Incorrect Questions");
}

function renderLeaderboard() {
  const topScores = getSortedLeaderboard().slice(0, 10);
  setTextIfPresent(
    elements.leaderboardSummary,
    topScores.length
      ? `Showing ${topScores.length} ranked player${topScores.length === 1 ? "" : "s"} ordered by score, then completion speed.`
      : "Highest score wins. Faster completion time breaks ties.",
  );
  setTextIfPresent(elements.leaderboardCountBadge, `${topScores.length} Ranked`);

  const markup = topScores.length
    ? topScores
        .map(
          (entry, index) => `
            <article class="leaderboard-item">
              <div class="rank-badge">${index + 1}</div>
              <div>
                <div class="leaderboard-top">
                  <strong>${escapeHtml(entry.username)}</strong>
                  <span class="score-pill">${entry.score} pts</span>
                </div>
                <div class="leaderboard-meta">
                  <span>${entry.accuracy}% accuracy</span>
                  <span>${formatDuration(entry.timeTakenMs)}</span>
                </div>
              </div>
              <span class="tag">${escapeHtml(entry.categoriesLabel || "Mixed")}</span>
            </article>
          `,
        )
        .join("")
    : renderPanelEmptyState(
        "Leaderboard Locked",
        "Complete a quiz to publish the first ranked score on the board.",
      );

  elements.dashboardLeaderboard.innerHTML = markup;
}

function renderPanelEmptyState(title, description) {
  return `
    <div class="empty-state advanced-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
}

function showDashboard() {
  renderProfile();
  updateQuestionExplorer();
  showView("dashboard");
}

function showView(viewName) {
  elements.dashboardSection.classList.toggle("hidden", viewName !== "dashboard");
  elements.quizSection.classList.toggle("hidden", viewName !== "quiz");
  elements.resultsSection.classList.toggle("hidden", viewName !== "results");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress() {
  const quiz = state.currentQuiz;

  if (!quiz) {
    return;
  }

  const completion = Math.round(((quiz.currentIndex + 1) / quiz.questions.length) * 100);
  elements.progressFill.style.width = `${completion}%`;
  elements.progressLabel.textContent = `${completion}%`;
}

function setFeedback(type, message) {
  elements.feedbackBanner.className = "feedback-banner";

  if (!message) {
    elements.feedbackBanner.classList.add("hidden");
    elements.feedbackBanner.textContent = "";
    return;
  }

  elements.feedbackBanner.classList.remove("hidden");
  elements.feedbackBanner.classList.add(type);
  elements.feedbackBanner.textContent = message;
}

function clearQuizTimer() {
  if (state.currentQuiz?.timerHandle) {
    clearInterval(state.currentQuiz.timerHandle);
    state.currentQuiz.timerHandle = null;
  }
}

function downloadCertificateAsPdf() {
  if (!state.lastResult || state.lastResult.accuracy < 70) {
    showToast("A certificate is available only when accuracy is 70% or higher.");
    return;
  }

  if (!window.jspdf?.jsPDF) {
    showToast("The PDF generator library is not available.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const documentPdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  documentPdf.setFillColor(9, 17, 31);
  documentPdf.rect(0, 0, 297, 210, "F");
  documentPdf.setDrawColor(46, 196, 182);
  documentPdf.setLineWidth(1.5);
  documentPdf.roundedRect(12, 12, 273, 186, 6, 6);

  documentPdf.setTextColor(255, 209, 102);
  documentPdf.setFont("helvetica", "bold");
  documentPdf.setFontSize(28);
  documentPdf.text("QuizMaster Pro", 148.5, 38, { align: "center" });

  documentPdf.setTextColor(243, 248, 255);
  documentPdf.setFontSize(20);
  documentPdf.text("Completion Certificate", 148.5, 56, { align: "center" });

  documentPdf.setFont("helvetica", "normal");
  documentPdf.setFontSize(12);
  documentPdf.text("This certifies that", 148.5, 78, { align: "center" });

  documentPdf.setFont("helvetica", "bold");
  documentPdf.setFontSize(24);
  documentPdf.text(state.lastResult.username, 148.5, 95, { align: "center" });

  documentPdf.setFont("helvetica", "normal");
  documentPdf.setFontSize(13);
  documentPdf.text(
    `completed a ${state.lastResult.categoriesLabel} quiz with ${state.lastResult.accuracy}% accuracy`,
    148.5,
    114,
    { align: "center" },
  );
  documentPdf.text(`Final Score: ${state.lastResult.score} points`, 148.5, 126, { align: "center" });
  documentPdf.text(`Awarded on ${formatLongDate(state.lastResult.timestamp)}`, 148.5, 138, { align: "center" });

  documentPdf.setTextColor(46, 196, 182);
  documentPdf.setFont("helvetica", "bold");
  documentPdf.text("Performance Rating: " + state.lastResult.rating, 148.5, 160, { align: "center" });

  documentPdf.save(`${state.lastResult.username.replace(/\s+/g, "_").toLowerCase()}-quizmaster-pro-certificate.pdf`);
}

function ensureAudioContext() {
  if (state.audioContext || !window.AudioContext) {
    return;
  }

  state.audioContext = new window.AudioContext();
}

function playResultSound(type) {
  if (!state.audioContext) {
    return;
  }

  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);

  const now = state.audioContext.currentTime;
  const frequency = type === "correct" ? 620 : 190;

  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.type = type === "correct" ? "triangle" : "sawtooth";
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

function updateCurrentProfile(updates) {
  const profiles = getProfiles();
  const username = state.profile.username;
  const nextProfile = {
    ...state.profile,
    ...updates,
  };

  profiles[username] = nextProfile;
  saveProfiles(profiles);
  state.profile = nextProfile;
}

function getProfiles() {
  return parseStoredJson(STORAGE_KEYS.profiles, {});
}

function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}

function getLeaderboard() {
  return parseStoredJson(STORAGE_KEYS.leaderboard, []);
}

function getSortedLeaderboard() {
  return [...getLeaderboard()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.timeTakenMs - right.timeTakenMs;
  });
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

function getPerformanceRating(accuracy) {
  if (accuracy >= 80) {
    return "Expert";
  }

  if (accuracy >= 50) {
    return "Intermediate";
  }

  return "Beginner";
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLongDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getFavoriteTrack(scores) {
  const categoryCounts = {};

  scores.forEach((score) => {
    (score.answers || []).forEach((answer) => {
      categoryCounts[answer.category] = (categoryCounts[answer.category] || 0) + 1;
    });
  });

  const sortedCategories = Object.entries(categoryCounts).sort((left, right) => right[1] - left[1]);
  return sortedCategories.length ? sortedCategories[0][0] : "Mixed Topics";
}

function getPlayerLevel(quizCount, bestScore, averageAccuracy) {
  if (quizCount >= 12 || bestScore >= 120 || averageAccuracy >= 85) {
    return "Elite";
  }

  if (quizCount >= 6 || bestScore >= 80 || averageAccuracy >= 65) {
    return "Advanced";
  }

  if (quizCount >= 2 || bestScore >= 40 || averageAccuracy >= 45) {
    return "Skilled";
  }

  return "Rookie";
}

function calculatePracticeStreak(scores) {
  const uniqueDates = [...new Set(scores.map((score) => new Date(score.timestamp).toISOString().slice(0, 10)))]
    .sort()
    .reverse();

  if (!uniqueDates.length) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previousDate = new Date(uniqueDates[index - 1]);
    const currentDate = new Date(uniqueDates[index]);
    const differenceInDays = Math.round((previousDate - currentDate) / 86400000);

    if (differenceInDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function setTextIfPresent(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function redirectToLogin() {
  window.location.href = "./login.html";
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

function shuffleArray(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
