const {
  clearAdminSessionCookie,
  clearParentSessionCookie,
  noStore,
  setAdminSessionCookie,
  setParentSessionCookie,
  validateAdminAccessKey,
  validateParentAccessKey,
  verifyAdminSession,
  verifyParentSession,
} = require("../../server/learning-proxy.cjs");

function requestedRole(req) {
  const queryRole = String(req.query?.role || "").toLowerCase();
  const bodyRole = String(req.body?.role || "").toLowerCase();
  return bodyRole || queryRole || "admin";
}

module.exports = async function handler(req, res) {
  noStore(res);
  const role = requestedRole(req);
  if (role !== "admin" && role !== "parent") {
    return res.status(400).json({ error: "invalid_session_role" });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      authenticated: role === "parent" ? verifyParentSession(req) : verifyAdminSession(req),
      role,
    });
  }

  if (req.method === "POST") {
    const accessKey = String(req.body?.accessKey || "");
    try {
      if (role === "parent") {
        if (!validateParentAccessKey(accessKey)) {
          return res.status(401).json({ error: "invalid_parent_access_key" });
        }
        setParentSessionCookie(res);
        return res.status(200).json({ authenticated: true, role: "parent" });
      }

      if (!validateAdminAccessKey(accessKey)) {
        return res.status(401).json({ error: "invalid_admin_access_key" });
      }
      setAdminSessionCookie(res);
      return res.status(200).json({ authenticated: true, role: "admin" });
    } catch (error) {
      console.error(`${role} session setup failed`, error);
      return res.status(503).json({ error: `${role}_auth_not_configured` });
    }
  }

  if (req.method === "DELETE") {
    if (role === "parent") clearParentSessionCookie(res);
    else clearAdminSessionCookie(res);
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
};
