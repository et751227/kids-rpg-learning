const { noStore, requireSession, upstream, validateAccessKey } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!requireSession(req, res)) return;
  const key = String(req.headers?.["x-kids-admin-key"] || "");
  if (!validateAccessKey(key)) return res.status(403).json({ error: "admin_key_required" });

  try {
    const result = await upstream("/v1/vocabulary/import", { method: "POST", body: req.body || {} });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("vocabulary import proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
