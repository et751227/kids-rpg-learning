const { noStore, playerId, requireSession, upstream } = require("../../server/learning-proxy.cjs");

const SESSION_RE = /^battle-v2-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;

  const { sessionKey } = req.body || {};
  if (!SESSION_RE.test(sessionKey || "")) {
    return res.status(400).json({ error: "invalid_battle_session" });
  }

  try {
    const result = await upstream(`/v1/players/${encodeURIComponent(playerId())}/battles/result`, {
      method: "POST",
      body: { sessionKey },
    });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("learning battle result proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
