import assert from "node:assert/strict";
import fs from "node:fs";
import { ANSWER_KEYS, ANSWER_KEY_ROWS } from "../src/game/answerPadLayout.js";

assert.deepEqual(ANSWER_KEY_ROWS.map((row) => row.join("")), ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]);
assert.equal(ANSWER_KEYS.length, 26);
assert.equal(new Set(ANSWER_KEYS).size, 26);
assert.equal([...ANSWER_KEYS].sort().join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
assert.equal(ANSWER_KEYS.find((key) => key === "N"), "N");
assert.equal(ANSWER_KEYS.find((key) => key === "U"), "U");
assert.notEqual(ANSWER_KEYS.indexOf("N"), ANSWER_KEYS.indexOf("U"));

const answerPadSource = fs.readFileSync("src/components/AnswerPad.jsx", "utf8");
assert.ok(answerPadSource.includes("⬅ 退格"));
assert.ok(answerPadSource.includes("✅ 確認"));
assert.ok(!answerPadSource.includes("🔄 清除"));
assert.ok(!answerPadSource.includes("onClear"));
assert.ok(answerPadSource.includes("grid-rows-2"));

console.log("answer-pad-contract: PASS (26 unique keys; N/U identity preserved; backspace+submit only)");
