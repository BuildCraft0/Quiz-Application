const QUESTIONS_URL = "./src/data/questions.json";

export async function loadQuestions() {
  // Questions are stored separately so the quiz engine can fetch and filter them dynamically.
  const response = await fetch(QUESTIONS_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Unable to load questions from ${QUESTIONS_URL}`);
  }

  const data = await response.json();

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error("Question bank is malformed.");
  }

  return data.questions;
}

export function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function uniqueValues(questions, key) {
  return [...new Set(questions.map((question) => question[key]))];
}

export function filterQuestions(questions, filters = {}) {
  const selectedCategories = filters.categories?.length ? filters.categories : uniqueValues(questions, "category");
  const selectedDifficulties = filters.difficulties?.length
    ? filters.difficulties
    : uniqueValues(questions, "difficulty");
  const searchTerm = normalizeText(filters.search || "");

  return questions.filter((question) => {
    const matchesCategory = selectedCategories.includes(question.category);
    const matchesDifficulty = selectedDifficulties.includes(question.difficulty);
    const haystack = normalizeText(
      `${question.question} ${question.category} ${question.difficulty} ${question.explanation}`,
    );
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);

    return matchesCategory && matchesDifficulty && matchesSearch;
  });
}

export function prepareQuestionsForSession(questions, count) {
  // Each quiz session gets a shuffled subset with independently shuffled options.
  return shuffle(questions)
    .slice(0, count)
    .map((question) => ({
      ...question,
      options: shuffle(question.options),
    }));
}

function normalizeText(value) {
  return value.toLowerCase().trim();
}
