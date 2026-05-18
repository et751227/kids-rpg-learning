import { mockVocabulary } from "../data/mockVocabulary";

function normalizeQuestion(item) {
  return {
    chinese: String(item?.chinese || "").trim(),
    english: String(item?.english || "").trim()
  };
}

function getConfiguredQuestionApiUrl() {
  return import.meta.env.VITE_QUESTION_API_URL || "";
}

async function loadExternalQuestions(questionApiUrl) {
  const response = await fetch(questionApiUrl);
  if (!response.ok) {
    throw new Error(`Question API responded with ${response.status}`);
  }

  const data = await response.json();
  return data
    .map(normalizeQuestion)
    .filter((item) => item.chinese && item.english);
}

export async function loadVocabularyQuestions() {
  const questionApiUrl = getConfiguredQuestionApiUrl();

  if (!questionApiUrl) {
    return mockVocabulary;
  }

  try {
    const normalized = await loadExternalQuestions(questionApiUrl);
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
