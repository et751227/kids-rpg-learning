import assert from "node:assert/strict";
import {
  MONSTER_TIERS,
  monsterDamage,
  monsterMaxHp,
  monsterTierForRoll,
} from "../src/game/battleRulesV2.js";

assert.equal(monsterTierForRoll(0).key, "normal");
assert.equal(monsterTierForRoll(0.799999).key, "normal");
assert.equal(monsterTierForRoll(0.8).key, "elite");
assert.equal(monsterTierForRoll(0.969999).key, "elite");
assert.equal(monsterTierForRoll(0.97).key, "boss");
assert.equal(monsterTierForRoll(0.999999).key, "boss");

assert.equal(MONSTER_TIERS.normal.hpMultiplier, 1);
assert.equal(MONSTER_TIERS.elite.hpMultiplier, 1.5);
assert.equal(MONSTER_TIERS.boss.hpMultiplier, 2.5);
assert.equal(MONSTER_TIERS.normal.attackMultiplier, 1);
assert.equal(MONSTER_TIERS.elite.attackMultiplier, 1.2);
assert.equal(MONSTER_TIERS.boss.attackMultiplier, 1.5);

const level = 10;
const normalHp = monsterMaxHp(level, MONSTER_TIERS.normal);
const eliteHp = monsterMaxHp(level, MONSTER_TIERS.elite);
const bossHp = monsterMaxHp(level, MONSTER_TIERS.boss);
assert.ok(normalHp < eliteHp && eliteHp < bossHp);

const normalDamage = monsterDamage(level, MONSTER_TIERS.normal);
const eliteDamage = monsterDamage(level, MONSTER_TIERS.elite);
const bossDamage = monsterDamage(level, MONSTER_TIERS.boss);
assert.ok(normalDamage < eliteDamage && eliteDamage < bossDamage);

console.log("battle_rules_contract=PASS");
