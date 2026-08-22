const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;

  try {
    const result = await upstream(`/v1/players/${encodeURIComponent(playerId())}/progress`);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("learning progress proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
