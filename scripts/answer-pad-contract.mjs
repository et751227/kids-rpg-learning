import assert from "node:assert/strict";
import { ANSWER_KEYS, ANSWER_KEY_ROWS } from "../src/game/answerPadLayout.js";

assert.deepEqual(ANSWER_KEY_ROWS.map((row) => row.join("")), ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]);
assert.equal(ANSWER_KEYS.length, 26);
assert.equal(new Set(ANSWER_KEYS).size, 26);
assert.equal([...ANSWER_KEYS].sort().join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
assert.equal(ANSWER_KEYS.find((key) => key === "N"), "N");
assert.equal(ANSWER_KEYS.find((key) => key === "U"), "U");
assert.notEqual(ANSWER_KEYS.indexOf("N"), ANSWER_KEYS.indexOf("U"));

console.log("answer-pad-contract: PASS (26 unique keys; N/U identity preserved)");
