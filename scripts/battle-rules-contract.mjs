import assert from "node:assert/strict";
import {
  MONSTER_TIERS,
  attackResult,
  baseAttack,
  damageReduction,
  deterministicEvadeRoll,
  didEvade,
  evadeChance,
  monsterDamage,
  monsterMaxHp,
  monsterTierForRoll,
  receivedMonsterDamage,
  timingThresholds,
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

assert.equal(baseAttack(10, 1), 13.7);
const lv10Fast = attackResult({ level: 10, strength: 1, agility: 1, responseTimeMs: 1000, correct: true });
const lv20Fast = attackResult({ level: 20, strength: 1, agility: 1, responseTimeMs: 1000, correct: true });
assert.ok(lv20Fast.damage > lv10Fast.damage, "level must contribute offense");

assert.equal(receivedMonsterDamage(level, 1, MONSTER_TIERS.normal, true), 0, "correct answer must prevent attack");
assert.ok(receivedMonsterDamage(level, 20, MONSTER_TIERS.normal, false) < normalDamage, "VIT must mitigate wrong-answer damage");
assert.ok(damageReduction(20) > damageReduction(10));
assert.ok(damageReduction(30) < 0.3);

const agi1 = timingThresholds(1);
const agi30 = timingThresholds(30);
assert.equal(agi1.fastMs, 5000);
assert.equal(agi1.normalMs, 10000);
assert.ok(agi30.fastMs < 7500);
assert.ok(agi30.normalMs < 14000);
assert.equal(evadeChance(1), 0);
assert.ok(evadeChance(20) > evadeChance(10));
assert.ok(evadeChance(30) < 0.3);

const sessionKey = "battle-v2-00000000-0000-4000-8000-000000000001";
const attemptId = "attempt-001";
assert.equal(deterministicEvadeRoll(sessionKey, attemptId), deterministicEvadeRoll(sessionKey, attemptId));
assert.equal(didEvade(sessionKey, attemptId, 1, false), false);
assert.equal(didEvade(sessionKey, attemptId, 30, true), false);
assert.equal(receivedMonsterDamage(level, 1, MONSTER_TIERS.normal, false, true), 0, "evade must prevent wrong-answer damage");

console.log("battle_rules_contract=PASS");
