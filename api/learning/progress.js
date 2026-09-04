const {
  noStore,
  playerId,
  upstream,
  verifyAdminSession,
  verifyParentSession,
  verifySession,
} = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (!verifySession(req) && !verifyParentSession(req) && !verifyAdminSession(req)) {
    return res.status(401).json({ error: "learning_session_required" });
  }

  try {
    const encodedPlayerId = encodeURIComponent(playerId());
    const progress = await upstream(`/v1/players/${encodedPlayerId}/progress`);
    if (progress.status < 200 || progress.status >= 300) {
      return res.status(progress.status).json(progress.payload);
    }

    let wordWeakness = null;
    try {
      const weakness = await upstream(`/v1/players/${encodedPlayerId}/word-weakness`);
      if (weakness.status >= 200 && weakness.status < 300) {
        wordWeakness = weakness.payload;
      } else {
        console.warn("learning weakness read model unavailable", { status: weakness.status });
      }
    } catch (error) {
      console.warn("learning weakness read model request failed", { message: error?.message || "unknown" });
    }

    return res.status(200).json({ ...progress.payload, wordWeakness });
  } catch (error) {
    console.error("learning progress proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
