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
  nextQuestion: (mode = "challenge") => jsonRequest(`/api/learning/question?mode=${encodeURIComponent(mode)}`),
  saveStats: (stats) => jsonRequest("/api/learning/stats", { method: "PUT", body: JSON.stringify(stats) }),
  submitAttempt: ({ attemptId, vocabularyId, sessionKey, mode, submittedAnswer, responseTimeMs, metadata }) =>
    jsonRequest("/api/learning/attempt", {
      method: "POST",
      body: JSON.stringify({ attemptId, vocabularyId, sessionKey, mode, submittedAnswer, responseTimeMs, metadata }),
    }),
};
