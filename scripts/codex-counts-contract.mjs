import fs from "node:fs";

const source = fs.readFileSync("src/pages/WordCodex.jsx", "utf8");

const checks = [
  [source.includes("總字詞"), "total vocabulary label missing"],
  [source.includes("已探索字詞"), "explored vocabulary label missing"],
  [source.includes("已對決字詞"), "encountered vocabulary label missing"],
  [!source.includes("村莊可遇見"), "village availability must not be first-layer progress"],
  [!source.includes("森林可遇見"), "forest availability must not be first-layer progress"],
  [!source.includes("還沒發現"), "undiscovered pool must not be first-layer progress"],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(message);
}

console.log("codex_counts_contract=PASS");
