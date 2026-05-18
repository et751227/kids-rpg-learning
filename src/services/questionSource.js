import { mockVocabulary } from "../data/mockVocabulary";

const LEGACY_QUESTION_API_URL =
  "https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main";

function normalizeQuestion(item) {
  return {
    chinese: String(item?.chinese || "").trim(),
    english: String(item?.english || "").trim()
  };
}

function getConfiguredQuestionApiUrl() {
  return import.meta.env.VITE_QUESTION_API_URL || LEGACY_QUESTION_API_URL;
}

export async function loadVocabularyQuestions() {
  const questionApiUrl = getConfiguredQuestionApiUrl();

  try {
    const response = await fetch(questionApiUrl);
    if (!response.ok) {
      throw new Error(`Question API responded with ${response.status}`);
    }

    const data = await response.json();
    const normalized = data
      .map(normalizeQuestion)
      .filter((item) => item.chinese && item.english);

    if (normalized.length > 0) {
      return normalized;
    }
  } catch (error) {
    console.warn("Question API unavailable; falling back to mock vocabulary.", error);
  }

  return mockVocabulary;
}

export async function getRandomVocabularyQuestion() {
  const questions = await loadVocabularyQuestions();
  const random = questions[Math.floor(Math.random() * questions.length)];

  return {
    questionText: random.chinese,
    answer: random.english,
    direction: "中 ➜ 英"
  };
}
