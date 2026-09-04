import { showVocabularyUnlock } from "../ui/unlockCelebration";

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    credentials: "same-origin",
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error || `learning_api_${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export const learningApi = {
  session: () => jsonRequest("/api/learning/session"),
  login: (accessKey) => jsonRequest("/api/learning/session", { method: "POST", body: JSON.stringify({ accessKey }) }),
  progress: () => jsonRequest("/api/learning/progress"),
  battleHistory: ({ offset = 0, limit = 50 } = {}) =>
    jsonRequest(`/api/learning/progress?view=battles&offset=${encodeURIComponent(offset)}&limit=${encodeURIComponent(limit)}`),
  codex: () => jsonRequest("/api/learning/codex"),
  discoveryNext: () => jsonRequest("/api/learning/discovery"),
  discoveryAttempt: async ({ attemptId, vocabularyId, submittedAnswer, responseTimeMs }) => {
    const result = await jsonRequest("/api/learning/discovery", {
      method: "POST",
      body: JSON.stringify({ attemptId, vocabularyId, submittedAnswer, responseTimeMs }),
    });
    showVocabularyUnlock(result?.unlock);
    return result;
  },
  nextQuestion: (mode = "challenge") => jsonRequest(`/api/learning/question?mode=${encodeURIComponent(mode)}`),
  saveStats: (stats) => jsonRequest("/api/learning/stats", { method: "PUT", body: JSON.stringify(stats) }),
  submitAttempt: async ({ attemptId, vocabularyId, sessionKey, mode, submittedAnswer, responseTimeMs, metadata }) => {
    const result = await jsonRequest("/api/learning/attempt", {
      method: "POST",
      body: JSON.stringify({ attemptId, vocabularyId, sessionKey, mode, submittedAnswer, responseTimeMs, metadata }),
    });

    let celebration = result?.unlock;
    if (celebration?.newlyUnlocked) {
      try {
        const codex = await jsonRequest("/api/learning/codex");
        const completedCollection = (codex?.collections || []).find((collection) =>
          collection?.completed &&
          Array.isArray(collection?.memberVocabularyIds) &&
          collection.memberVocabularyIds.includes(celebration.vocabularyId),
        );
        if (completedCollection?.reward?.earned) {
          celebration = {
            ...celebration,
            collectionReward: {
              newlyEarned: true,
              collectionId: completedCollection.id,
              collectionTitle: completedCollection.title,
              ...completedCollection.reward,
            },
          };
        }
      } catch {
        // The word unlock remains valid even if the optional reward read model cannot be refreshed.
      }
    }

    showVocabularyUnlock(celebration);
    return result;
  },
  completeBattle: (sessionKey) => jsonRequest("/api/learning/battle-result", {
    method: "POST",
    body: JSON.stringify({ sessionKey }),
  }),
  parentSession: () => jsonRequest("/api/admin/session?role=parent"),
  parentLogin: (accessKey) => jsonRequest("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ accessKey, role: "parent" }),
  }),
  parentLogout: () => jsonRequest("/api/admin/session?role=parent", { method: "DELETE" }),
  adminSession: () => jsonRequest("/api/admin/session"),
  adminLogin: (accessKey) => jsonRequest("/api/admin/session", {
    method: "POST",
    body: JSON.stringify({ accessKey, role: "admin" }),
  }),
  adminLogout: () => jsonRequest("/api/admin/session", { method: "DELETE" }),
  adminVocabularyList: ({ search = "" } = {}) =>
    jsonRequest(`/api/admin/vocabulary?search=${encodeURIComponent(search)}`),
};
