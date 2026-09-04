import fs from "node:fs";

const page = fs.readFileSync("src/pages/WordCodex.jsx", "utf8");
const presentation = fs.readFileSync("src/game/codexPresentation.js", "utf8");

const checks = [
  [page.includes("presentCollection"), "Codex must use child-facing collection presentation"],
  [page.includes("getWordBelonging"), "Codex word cards must show child-facing belonging"],
  [!page.includes('{item.category || "word"}'), "raw category must not be rendered on child Codex cards"],
  [presentation.includes('adverb: { belonging: "💨 風之節奏"'), "adverb child-facing theme missing"],
  [presentation.includes('auxiliary: { belonging: "🪄 助力魔法"'), "auxiliary child-facing theme missing"],
  [presentation.includes('"be verb": { belonging: "🌟 存在魔法"'), "be_verb child-facing theme missing"],
  [presentation.includes('rewardName: "風語旅人徽章"'), "adverb reward identity missing"],
  [presentation.includes('title: "冒險百寶箱"'), "unknown raw category safe fallback missing"],
  [presentation.includes("CATEGORY_PRESENTATION[category] || SAFE_FALLBACK_PRESENTATION"), "raw collection transform must not depend on a fixed whitelist"],
  [presentation.includes('return CATEGORY_PRESENTATION[key]?.belonging || SAFE_FALLBACK_PRESENTATION.belonging'), "every word needs a belonging fallback"],
  [presentation.includes("if (!category) return collection;"), "existing non-taxonomy cute collections must be preserved"],
  [!presentation.includes("RAW_COLLECTION_CATEGORIES"), "raw collection safety must not use an incomplete whitelist"],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

console.log("codex_collection_presentation_contract=PASS raw_taxonomy_whitelist=none fallback=world_theme");
