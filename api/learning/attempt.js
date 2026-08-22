const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;

  const { attemptId, vocabularyId, submittedAnswer, responseTimeMs, mode, sessionKey, metadata } = req.body || {};
  if (!UUID_RE.test(attemptId || "") || typeof vocabularyId !== "string" || typeof submittedAnswer !== "string") {
    return res.status(400).json({ error: "invalid_attempt" });
  }
  if (responseTimeMs !== undefined && (!Number.isInteger(responseTimeMs) || responseTimeMs < 0)) {
    return res.status(400).json({ error: "invalid_response_time" });
  }

  const body = {
    attemptId,
    vocabularyId,
    submittedAnswer,
    responseTimeMs,
    mode: mode === "practice" ? "practice" : "challenge",
    sessionKey: typeof sessionKey === "string" ? sessionKey : undefined,
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };

  try {
    const result = await upstream(`/v1/players/${encodeURIComponent(playerId())}/attempts`, {
      method: "POST",
      body,
    });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("learning attempt proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
