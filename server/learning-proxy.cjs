const crypto = require("node:crypto");

const COOKIE_NAME = "kids_family_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function parseCookies(req) {
  const raw = String(req.headers?.cookie || "");
  return Object.fromEntries(raw.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index >= 0 ? [part.slice(0, index), decodeURIComponent(part.slice(index + 1))] : [part, ""];
  }));
}

function sessionSecret() {
  return requiredEnv("KIDS_SESSION_SECRET");
}

function signPayload(payload) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function createSessionToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${signPayload(payload)}`;
}

function verifySession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  return safeEqual(parts[2], signPayload(payload));
}

function requireSession(req, res) {
  if (verifySession(req)) return true;
  res.status(401).json({ error: "family_session_required" });
  return false;
}

function setSessionCookie(res) {
  const token = createSessionToken();
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function validateAccessKey(accessKey) {
  return safeEqual(accessKey || "", requiredEnv("KIDS_FAMILY_ACCESS_KEY"));
}

function playerId() {
  return requiredEnv("KIDS_LEARNING_PLAYER_ID");
}

function apiBaseUrl() {
  const url = requiredEnv("KIDS_LEARNING_API_URL").replace(/\/+$/, "");
  if (!url.startsWith("https://")) throw new Error("kids_learning_api_url_must_use_https");
  return url;
}

async function upstream(pathname, { method = "GET", body } = {}) {
  const headers = {
    accept: "application/json",
    "x-kids-ingress-token": requiredEnv("KIDS_LEARNING_INGRESS_TOKEN"),
  };
  if (body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${apiBaseUrl()}${pathname}`, {
    method,
    cache: "no-store",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : {}; }
  catch { payload = { error: "upstream_invalid_json" }; }
  return { status: response.status, payload };
}

function noStore(res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
}

module.exports = {
  clearSessionCookie,
  noStore,
  playerId,
  requireSession,
  setSessionCookie,
  upstream,
  validateAccessKey,
  verifySession,
};
