import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MONSTER_ARCHETYPES,
  MONSTER_DAMAGE_SCALE,
  MONSTER_TIERS,
  SHIELD_CHARGES,
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
  shieldChargesRemaining,
  timingThresholds,
} from "../src/game/battleRulesV2.js";

assert.equal(monsterTierForRoll(0).key, "normal");
assert.equal(monsterTierForRoll(0.799999).key, "normal");
assert.equal(monsterTierForRoll(0.8).key, "elite");
assert.equal(monsterTierForRoll(0.969999).key, "elite");
assert.equal(monsterTierForRoll(0.97).key, "boss");
assert.equal(monsterTierForRoll(0.999999).key, "boss");

assert.equal(MONSTER_DAMAGE_SCALE, 3);
assert.equal(SHIELD_CHARGES, 2);
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
const wolfSecond = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 2, archetype: wolf, correctHitIndex: 2 });
assert.ok(wolfSecond.damage > wolfFirst.damage);
assert.equal(wolfFirst.archetypeMultiplier, 0.8);
assert.equal(wolfSecond.archetypeMultiplier, 1.15);

const ghost = MONSTER_ARCHETYPES.ghost;
const ghostNormal = attackResult({ level, strength: 4, agility: 4, responseTimeMs: timingThresholds(4).normalMs, correct: true, streak: 1, archetype: ghost, correctHitIndex: 1 });
const ghostSlow = attackResult({ level, strength: 4, agility: 4, responseTimeMs: timingThresholds(4).normalMs + 1, correct: true, streak: 1, archetype: ghost, correctHitIndex: 1 });
assert.equal(ghostNormal.archetypeMultiplier, 1);
assert.equal(ghostSlow.archetypeMultiplier, 0.65);

const golem = MONSTER_ARCHETYPES.golem;
assert.equal(shieldChargesRemaining(golem, 0), 2);
assert.equal(shieldChargesRemaining(golem, 1), 1);
assert.equal(shieldChargesRemaining(golem, 2), 0);
assert.equal(shieldChargesRemaining(golem, 20), 0);
const golemHit1 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: golem, correctHitIndex: 1 });
const golemHit2 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: golem, correctHitIndex: 2 });
const golemHit3 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: golem, correctHitIndex: 3 });
const golemHit4 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: golem, correctHitIndex: 4 });
assert.equal(golemHit1.archetypeMultiplier, 0.55);
assert.equal(golemHit2.archetypeMultiplier, 0.55);
assert.equal(golemHit3.archetypeMultiplier, 1);
assert.equal(golemHit4.archetypeMultiplier, 1);
assert.equal(golemHit1.shieldRemaining, 1);
assert.equal(golemHit2.shieldRemaining, 0);
assert.equal(golemHit3.shieldApplied, false);
assert.equal(golemHit4.shieldApplied, false);

const serpent = MONSTER_ARCHETYPES.serpent;
const serpentDamage = receivedMonsterDamage(level, 1, MONSTER_TIERS.elite, false, false, serpent, 1);
const golemDamage = receivedMonsterDamage(level, 1, MONSTER_TIERS.elite, false, false, golem, 1);
assert.ok(serpentDamage > golemDamage);
assert.equal(receivedMonsterDamage(level, 1, MONSTER_TIERS.elite, false, true, serpent, 1), 0);

const dragon = MONSTER_ARCHETYPES.dragon;
assert.equal(shieldChargesRemaining(dragon, 0), 2);
assert.equal(shieldChargesRemaining(dragon, 2), 0);
const dragonHit1 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: dragon, correctHitIndex: 1 });
const dragonHit2 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: dragon, correctHitIndex: 2 });
const dragonHit3 = attackResult({ level, strength: 4, agility: 4, responseTimeMs: 3000, correct: true, streak: 1, archetype: dragon, correctHitIndex: 3 });
assert.equal(dragonHit1.archetypeMultiplier, 0.7);
assert.equal(dragonHit2.archetypeMultiplier, 0.7);
assert.equal(dragonHit3.archetypeMultiplier, 1);
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

console.log("battle_rules_contract=PASS battle_identity=canonical monster_traits=lifecycle_locked");
