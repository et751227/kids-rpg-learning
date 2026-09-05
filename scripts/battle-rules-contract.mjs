import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MONSTER_ARCHETYPES,
  MONSTER_DAMAGE_SCALE,
  MONSTER_TIERS,
  attackResult,
  baseAttack,
  comboMultiplier,
  damageReduction,
  deterministicEvadeRoll,
  didEvade,
  evadeChance,
  masteryPreview,
  monsterArchetypeForSession,
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

assert.equal(MONSTER_DAMAGE_SCALE, 3);
assert.equal(MONSTER_TIERS.normal.hpMultiplier, 1);
assert.equal(MONSTER_TIERS.elite.hpMultiplier, 1.7);
assert.equal(MONSTER_TIERS.boss.hpMultiplier, 2.5);
assert.equal(MONSTER_TIERS.normal.attackMultiplier, 1);
assert.equal(MONSTER_TIERS.elite.attackMultiplier, 1.2);
assert.equal(MONSTER_TIERS.boss.attackMultiplier, 1.25);
assert.equal(Object.keys(MONSTER_ARCHETYPES).length, 5);

const level = 10;
const normalHp = monsterMaxHp(level, MONSTER_TIERS.normal);
const eliteHp = monsterMaxHp(level, MONSTER_TIERS.elite);
const bossHp = monsterMaxHp(level, MONSTER_TIERS.boss);
assert.ok(normalHp < eliteHp && eliteHp < bossHp);

const normalDamage = monsterDamage(level, MONSTER_TIERS.normal);
const eliteDamage = monsterDamage(level, MONSTER_TIERS.elite);
const bossDamage = monsterDamage(level, MONSTER_TIERS.boss);
assert.ok(normalDamage < eliteDamage && eliteDamage < bossDamage);

assert.equal(comboMultiplier(0), 1);
assert.equal(comboMultiplier(2), 1);
assert.equal(comboMultiplier(3), 1.1);
assert.equal(comboMultiplier(5), 1.2);
assert.equal(comboMultiplier(7), 1.3);
assert.equal(comboMultiplier(10), 1.4);
assert.equal(comboMultiplier(99), 1.4);

assert.equal(baseAttack(10, 1), 13.7);
const lv10Fast = attackResult({ level: 10, strength: 1, agility: 1, responseTimeMs: 1000, correct: true });
const lv20Fast = attackResult({ level: 20, strength: 1, agility: 1, responseTimeMs: 1000, correct: true });
assert.ok(lv20Fast.damage > lv10Fast.damage);
const combo3 = attackResult({ level: 10, strength: 1, agility: 1, responseTimeMs: 1000, correct: true, streak: 3 });
const combo10 = attackResult({ level: 10, strength: 1, agility: 1, responseTimeMs: 1000, correct: true, streak: 10 });
assert.ok(combo3.damage > lv10Fast.damage);
assert.ok(combo10.damage > combo3.damage);

assert.equal(receivedMonsterDamage(level, 1, MONSTER_TIERS.normal, true), 0);
assert.ok(receivedMonsterDamage(level, 20, MONSTER_TIERS.normal, false) < normalDamage);
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
assert.equal(receivedMonsterDamage(level, 1, MONSTER_TIERS.normal, false, true), 0);

const normalArchetype = monsterArchetypeForSession(sessionKey, "normal");
assert.ok(["wolf", "ghost"].includes(normalArchetype.key));
assert.equal(monsterArchetypeForSession(sessionKey, "boss").key, "dragon");

const wolf = MONSTER_ARCHETYPES.wolf;
const wolfFirst = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: wolf, correctHitIndex: 1 });
const wolfCombo = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 3, archetype: wolf, correctHitIndex: 3 });
assert.ok(wolfCombo.damage > wolfFirst.damage);

const golem = MONSTER_ARCHETYPES.golem;
const golemShield = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 2, archetype: golem, correctHitIndex: 1 });
const golemOpen = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 2, archetype: golem, correctHitIndex: 3 });
assert.ok(golemOpen.damage > golemShield.damage);

const serpent = MONSTER_ARCHETYPES.serpent;
assert.ok(
  receivedMonsterDamage(level, 1, MONSTER_TIERS.elite, false, false, serpent, 1) >
  receivedMonsterDamage(level, 1, MONSTER_TIERS.elite, false, false, golem, 1),
);

const dragon = MONSTER_ARCHETYPES.dragon;
assert.ok(
  receivedMonsterDamage(level, 1, MONSTER_TIERS.boss, false, false, dragon, 0.3) >
  receivedMonsterDamage(level, 1, MONSTER_TIERS.boss, false, false, dragon, 0.7),
);

const perfect = masteryPreview({ outcome: "victory", archetype: serpent, questionCount: 4, correctCount: 4, maxCombo: 4, fastCorrectCount: 4 });
assert.equal(perfect.stars, 3);
assert.equal(perfect.perfect, true);
const defeated = masteryPreview({ outcome: "defeat", archetype: dragon, questionCount: 4, correctCount: 2, maxCombo: 1, fastCorrectCount: 1 });
assert.equal(defeated.stars, 0);

const challengeSource = fs.readFileSync("src/pages/ChallengeV2.jsx", "utf8");
assert.ok(challengeSource.includes("const [battleIdentity, setBattleIdentity] = useState(() => createBattleIdentity())"));
assert.ok(challengeSource.includes("sessionKey: battleIdentity.sessionKey"));
assert.ok(challengeSource.includes("monsterTier: battleIdentity.tier.key"));
assert.ok(challengeSource.includes("monsterArchetype: battleIdentity.archetype.key"));
assert.ok(challengeSource.includes("learningApi.completeBattle(battleIdentity.sessionKey)"));
assert.ok(challengeSource.includes("setBattleIdentity(nextBattleIdentity)"));
assert.ok(!challengeSource.includes("const sessionKey = useRef("));
assert.ok(!challengeSource.includes("const [monsterTier, setMonsterTier]"));

console.log("battle_rules_contract=PASS battle_identity=canonical");
