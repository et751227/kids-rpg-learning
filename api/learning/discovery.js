const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (!requireSession(req, res)) return;
  const id = encodeURIComponent(playerId());
  try {
    if (req.method === "GET") {
      const result = await upstream(`/v1/players/${id}/discovery/next`);
      return res.status(result.status).json(result.payload);
    }
    if (req.method === "POST") {
      const { attemptId, vocabularyId, submittedAnswer, responseTimeMs } = req.body || {};
      if (typeof vocabularyId !== "string" || typeof submittedAnswer !== "string") {
        return res.status(400).json({ error: "invalid_discovery_attempt" });
      }
      const result = await upstream(`/v1/players/${id}/discovery/attempt`, {
        method: "POST",
        body: { attemptId, vocabularyId, submittedAnswer, responseTimeMs },
      });
      return res.status(result.status).json(result.payload);
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("learning discovery proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
