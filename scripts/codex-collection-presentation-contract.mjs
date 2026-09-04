import fs from "node:fs";

const page = fs.readFileSync("src/pages/WordCodex.jsx", "utf8");
const presentation = fs.readFileSync("src/game/codexPresentation.js", "utf8");

const checks = [
  [page.includes("presentCollection"), "Codex must use child-facing collection presentation"],
  [page.includes("getWordBelonging"), "Codex word cards must show child-facing belonging"],
  [!page.includes('{item.category || "word"}'), "raw category must not be rendered on child Codex cards"],
  [presentation.includes('adverb: { belonging: "💨 風之節奏"'), "adverb child-facing theme missing"],
  [presentation.includes('rewardName: "風語旅人徽章"'), "adverb reward identity missing"],
  [presentation.includes('return CATEGORY_PRESENTATION[key]?.belonging || "✨ 冒險魔法"'), "every word needs a belonging fallback"],
  [presentation.includes("if (!category) return collection;"), "existing non-taxonomy cute collections must be preserved"],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

console.log("codex_collection_presentation_contract=PASS");
