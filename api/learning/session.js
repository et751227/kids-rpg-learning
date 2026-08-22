const {
  clearSessionCookie,
  noStore,
  setSessionCookie,
  validateAccessKey,
  verifySession,
} = require("../../server/learning-proxy.cjs");

module.exports = async function handler(req, res) {
  noStore(res);

  if (req.method === "GET") {
    return res.status(200).json({ authenticated: verifySession(req) });
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const accessKey = req.body?.accessKey;
  if (typeof accessKey !== "string" || !validateAccessKey(accessKey)) {
    return res.status(401).json({ error: "invalid_family_access_key" });
  }

  setSessionCookie(res);
  return res.status(200).json({ authenticated: true });
};
