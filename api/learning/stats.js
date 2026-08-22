const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;

  const { strength, vitality, agility } = req.body || {};
  const values = [strength, vitality, agility];
  if (values.some((value) => !Number.isInteger(value) || value < 1)) {
    return res.status(400).json({ error: "invalid_stats" });
  }

  try {
    const result = await upstream(`/v1/players/${encodeURIComponent(playerId())}/stats`, {
      method: "PUT",
      body: { strength, vitality, agility },
    });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("learning stats proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
