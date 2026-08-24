const { noStore, requireSession, upstream, validateAccessKey } = require("../../server/learning-proxy.cjs");

function adminKey(req) {
  return String(req.headers?.["x-kids-admin-key"] || "");
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (!requireSession(req, res)) return;
  if (!validateAccessKey(adminKey(req))) return res.status(403).json({ error: "admin_key_required" });

  try {
    if (req.method === "GET") {
      const search = encodeURIComponent(String(req.query?.search || ""));
      const includeDisabled = req.query?.includeDisabled === "true" ? "true" : "false";
      const result = await upstream(`/v1/vocabulary?search=${search}&includeDisabled=${includeDisabled}`);
      return res.status(result.status).json(result.payload);
    }
    if (req.method === "POST") {
      const result = await upstream("/v1/vocabulary", { method: "POST", body: req.body || {} });
      return res.status(result.status).json(result.payload);
    }
    if (req.method === "PUT") {
      const id = String(req.query?.id || "").trim();
      if (!id) return res.status(400).json({ error: "vocabulary_id_required" });
      const result = await upstream(`/v1/vocabulary/${encodeURIComponent(id)}`, { method: "PUT", body: req.body || {} });
      return res.status(result.status).json(result.payload);
    }
    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("vocabulary management proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
