const { noStore, requireAdminSession, upstream } = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);
  if (!requireAdminSession(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "admin_v01_read_only" });
  }

  try {
    const search = encodeURIComponent(String(req.query?.search || ""));
    const result = await upstream(`/v1/vocabulary?search=${search}&includeDisabled=true`);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error("admin vocabulary proxy failed", error);
    return res.status(502).json({ error: "learning_upstream_unavailable" });
  }
};
