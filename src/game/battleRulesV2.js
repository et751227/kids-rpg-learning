export const BASE_STATS = { strength: 1, vitality: 1, agility: 1 };

export const MONSTER_DAMAGE_SCALE = 3;

export const MONSTER_TIERS = {
  normal: { key: "normal", label: "一般怪", icon: "👾", hpMultiplier: 1, attackMultiplier: 1 },
  elite: { key: "elite", label: "菁英怪", icon: "👹", hpMultiplier: 1.7, attackMultiplier: 1.2 },
  boss: { key: "boss", label: "BOSS", icon: "🐉", hpMultiplier: 2.5, attackMultiplier: 1.25 },
};

export const MONSTER_ARCHETYPES = {
  wolf: { key: "wolf", tiers: ["normal"], label: "連擊狼", icon: "🐺", trait: "連擊越長，攻擊越有利；第一擊較弱。", mastery: "維持連擊來證明你掌握節奏" },
  ghost: { key: "ghost", tiers: ["normal"], label: "回聲幽靈", icon: "👻", trait: "慢速回答會被削弱，專注與速度更重要。", mastery: "至少一半答對題要達成快速攻擊" },
  golem: { key: "golem", tiers: ["elite"], label: "鐵壁巨像", icon: "🗿", trait: "前兩次正確攻擊會被護盾減傷。", mastery: "最多只能失誤一次" },
  serpent: { key: "serpent", tiers: ["elite"], label: "毒牙巨蛇", icon: "🐍", trait: "答錯時承受的傷害更高。", mastery: "正確率至少 90%" },
  dragon: { key: "dragon", tiers: ["boss"], label: "王者巨龍", icon: "🐉", trait: "前兩擊有護盾，低血量後進入狂暴。", mastery: "正確率 90% 並維持連擊" },
};

const ARCHETYPES_BY_TIER = {
  normal: ["wolf", "ghost"],
  elite: ["golem", "serpent"],
  boss: ["dragon"],
};

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function monsterArchetypeForSession(sessionKey, tierKey) {
  const options = ARCHETYPES_BY_TIER[tierKey] || ARCHETYPES_BY_TIER.normal;
  const key = options[fnv1a32(`kids-monster-archetype-v1:${sessionKey}:${tierKey}`) % options.length];
  return MONSTER_ARCHETYPES[key];
}

export function monsterTierForRoll(roll) {
  const value = Math.min(0.999999, Math.max(0, Number(roll) || 0));
  if (value < 0.8) return MONSTER_TIERS.normal;
  if (value < 0.97) return MONSTER_TIERS.elite;
  return MONSTER_TIERS.boss;
}

export function randomMonsterTier(random = Math.random) {
  return monsterTierForRoll(random());
}

export function availableStatPoints(level) {
  return Math.max(0, Number(level || 1) - 1);
}

export function allocatedPoints(stats) {
  return ["strength", "vitality", "agility"].reduce((sum, key) => sum + Math.max(0, Number(stats?.[key] || 1) - 1), 0);
}

export function remainingStatPoints(level, stats) {
  return Math.max(0, availableStatPoints(level) - allocatedPoints(stats));
}

export function playerMaxHp(level, vitality) {
  return Math.round(50 + Number(level || 1) * 3 + Number(vitality || 1) * 6);
}

export function monsterMaxHp(level, tier = MONSTER_TIERS.normal) {
  const base = 55 + Number(level || 1) * 5;
  return Math.max(1, Math.round(base * Number(tier?.hpMultiplier || 1)));
}

export function monsterDamage(level, tier = MONSTER_TIERS.normal) {
  const base = (4 + Number(level || 1) * 0.6) * MONSTER_DAMAGE_SCALE;
  return Math.max(1, Math.round(base * Number(tier?.attackMultiplier || 1)));
}

export function baseAttack(level, strength) {
  return 8 + Math.max(1, Number(level || 1)) * 0.45 + Math.max(1, Number(strength || 1)) * 1.2;
}

export function comboMultiplier(streak) {
  const count = Math.max(0, Math.trunc(Number(streak) || 0));
  if (count >= 10) return 1.4;
  if (count >= 7) return 1.3;
  if (count >= 5) return 1.2;
  if (count >= 3) return 1.1;
  return 1;
}

export function damageReduction(vitality) {
  const vit = Math.max(1, Number(vitality || 1));
  return 0.35 * Math.max(0, vit - 1) / (vit + 9);
}

export function evadeChance(agility) {
  const agi = Math.max(1, Number(agility || 1));
  return 0.35 * Math.max(0, agi - 1) / (agi + 9);
}

export function deterministicEvadeRoll(sessionKey, attemptId) {
  return fnv1a32(`kids-battle-evade-v1:${sessionKey}:${attemptId}`) / 0x100000000;
}

export function didEvade(sessionKey, attemptId, agility, correct) {
  if (correct) return false;
  return deterministicEvadeRoll(sessionKey, attemptId) < evadeChance(agility);
}

export function receivedMonsterDamage(level, vitality, tier = MONSTER_TIERS.normal, correct = false, evaded = false, archetype = null, monsterHpRatio = 1) {
  if (correct || evaded) return 0;
  let multiplier = 1;
  if (archetype?.key === "serpent") multiplier *= 1.35;
  if (archetype?.key === "dragon" && monsterHpRatio <= 0.35) multiplier *= 1.4;
  return Math.max(1, Math.round(monsterDamage(level, tier) * (1 - damageReduction(vitality)) * multiplier));
}

export function timingThresholds(agility) {
  const agi = Math.max(1, Number(agility || 1));
  return {
    fastMs: Math.round((5 + 2.5 * (1 - Math.exp(-(agi - 1) / 10))) * 1000),
    normalMs: Math.round((10 + 4 * (1 - Math.exp(-(agi - 1) / 10))) * 1000),
  };
}

export function attackResult({ level, strength, agility, responseTimeMs, correct, streak = 1, archetype = null, correctHitIndex = 1 }) {
  if (!correct) return { damage: 0, grade: "miss", multiplier: 0, comboMultiplier: 1, archetypeMultiplier: 1 };
  const { fastMs, normalMs } = timingThresholds(agility);
  let grade = "slow";
  let multiplier = 0.8;
  if (responseTimeMs <= fastMs) { grade = "fast"; multiplier = 1.35; }
  else if (responseTimeMs <= normalMs) { grade = "normal"; multiplier = 1; }
  const combo = comboMultiplier(streak);
  let archetypeMultiplier = 1;
  if (archetype?.key === "wolf") archetypeMultiplier = streak >= 2 ? 1.15 : 0.8;
  if (archetype?.key === "ghost" && responseTimeMs > normalMs) archetypeMultiplier = 0.65;
  if (archetype?.key === "golem" && correctHitIndex <= 2) archetypeMultiplier = 0.55;
  if (archetype?.key === "dragon" && correctHitIndex <= 2) archetypeMultiplier = 0.7;
  return {
    damage: Math.max(1, Math.round(baseAttack(level, strength) * multiplier * combo * archetypeMultiplier)),
    grade,
    multiplier,
    comboMultiplier: combo,
    archetypeMultiplier,
  };
}

export function masteryPreview({ outcome, archetype, questionCount, correctCount, maxCombo, fastCorrectCount }) {
  const accuracy = questionCount > 0 ? correctCount / questionCount : 0;
  const wrongCount = Math.max(0, questionCount - correctCount);
  if (outcome !== "victory") return { stars: 0, perfect: false, accuracy: Math.round(accuracy * 100) };
  let stars = 1;
  const secondStar = archetype?.key === "wolf"
    ? maxCombo >= Math.min(3, questionCount)
    : archetype?.key === "ghost"
      ? fastCorrectCount >= Math.max(1, Math.ceil(correctCount / 2))
      : archetype?.key === "golem"
        ? wrongCount <= 1
        : archetype?.key === "serpent"
          ? accuracy >= 0.9
          : accuracy >= 0.9 && maxCombo >= Math.min(3, questionCount);
  if (secondStar) stars = 2;
  const perfect = wrongCount === 0;
  if (perfect) stars = 3;
  return { stars, perfect, accuracy: Math.round(accuracy * 100) };
}
