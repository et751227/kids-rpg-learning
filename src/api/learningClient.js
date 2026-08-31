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

const adminHeaders = (adminKey) => ({ "x-kids-admin-key": adminKey });

export const learningApi = {
  session: () => jsonRequest("/api/learning/session"),
  login: (accessKey) => jsonRequest("/api/learning/session", { method: "POST", body: JSON.stringify({ accessKey }) }),
  progress: () => jsonRequest("/api/learning/progress"),
  codex: () => jsonRequest("/api/learning/codex"),
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
  vocabularyList: ({ adminKey, search = "", includeDisabled = true }) =>
    jsonRequest(`/api/learning/vocabulary?search=${encodeURIComponent(search)}&includeDisabled=${includeDisabled ? "true" : "false"}`, {
      headers: adminHeaders(adminKey),
    }),
  vocabularyCreate: ({ adminKey, item }) => jsonRequest("/api/learning/vocabulary", {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(item),
  }),
  vocabularyUpdate: ({ adminKey, vocabularyId, item }) => jsonRequest(`/api/learning/vocabulary?id=${encodeURIComponent(vocabularyId)}`, {
    method: "PUT",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(item),
  }),
  vocabularyImport: ({ adminKey, rows, dryRun = true }) => jsonRequest("/api/learning/vocabulary-import", {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ rows, dryRun }),
  }),
};
