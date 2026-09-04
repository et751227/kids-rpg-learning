import fs from "node:fs";

const proxy = fs.readFileSync("server/learning-proxy.cjs", "utf8");
const session = fs.readFileSync("api/admin/session.js", "utf8");
const progress = fs.readFileSync("api/learning/progress.js", "utf8");
const client = fs.readFileSync("src/api/learningClient.js", "utf8");

const checks = [
  [proxy.includes("kids_parent_session"), "parent cookie missing"],
  [proxy.includes("verifyParentSession"), "parent verifier missing"],
  [proxy.includes("validateParentAccessKey"), "parent access-key validator missing"],
  [session.includes('role === "parent"'), "session role split missing"],
  [session.includes("setParentSessionCookie"), "parent cookie setter missing"],
  [progress.includes("verifyParentSession"), "progress parent auth missing"],
  [client.includes("parentSession"), "parent client session missing"],
  [client.includes('role: "parent"'), "parent client role missing"],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

console.log("parent_session_contract=PASS");
