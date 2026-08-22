const crypto = require("node:crypto");
const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;

  const { vocabularyId, submittedAnswer, responseTimeMs, mode, sessionKey, metadata } = req.body || {};
  if (typeof vocabularyId !== "string" || typeof submittedAnswer !== "string") {
    return res.status(400).json({ error: "invalid_attempt" });
  }
  if (responseTimeMs !== undefined && (!Number.isInteger(responseTimeMs) || responseTimeMs < 0)) {
    return res.status(400).json({ error: "invalid_response_time" });
  }

  const body = {
    attemptId: crypto.randomUUID(),
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
