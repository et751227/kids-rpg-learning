const {
  clearAdminSessionCookie,
  noStore,
  setAdminSessionCookie,
  validateAdminAccessKey,
  verifyAdminSession,
} = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method === "GET") {
    return res.status(200).json({ authenticated: verifyAdminSession(req) });
  }

  if (req.method === "POST") {
    const accessKey = String(req.body?.accessKey || "");
    try {
      if (!validateAdminAccessKey(accessKey)) {
        return res.status(401).json({ error: "invalid_admin_access_key" });
      }
      setAdminSessionCookie(res);
      return res.status(200).json({ authenticated: true });
    } catch (error) {
      console.error("admin session setup failed", error);
      return res.status(503).json({ error: "admin_auth_not_configured" });
    }
  }

  if (req.method === "DELETE") {
    clearAdminSessionCookie(res);
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
};
