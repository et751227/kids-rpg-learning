export const BASE_STATS = { strength: 1, vitality: 1, agility: 1 };

export const MONSTER_TIERS = {
  normal: {
    key: "normal",
    label: "一般怪",
    icon: "👾",
    hpMultiplier: 1,
    attackMultiplier: 1,
  },
  elite: {
    key: "elite",
    label: "菁英怪",
    icon: "👹",
    hpMultiplier: 1.5,
    attackMultiplier: 1.2,
  },
  boss: {
    key: "boss",
    label: "BOSS",
    icon: "🐉",
    hpMultiplier: 2.5,
    attackMultiplier: 1.5,
  },
};

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
  return ["strength", "vitality", "agility"].reduce(
    (sum, key) => sum + Math.max(0, Number(stats?.[key] || 1) - 1),
    0,
  );
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
  const base = 4 + Number(level || 1) * 0.6;
  return Math.max(1, Math.round(base * Number(tier?.attackMultiplier || 1)));
}

export function baseAttack(level, strength) {
  return 8 + Math.max(1, Number(level || 1)) * 0.45 + Math.max(1, Number(strength || 1)) * 1.2;
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
  const input = `kids-battle-evade-v1:${sessionKey}:${attemptId}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 0x100000000;
}

export function didEvade(sessionKey, attemptId, agility, correct) {
  if (correct) return false;
  return deterministicEvadeRoll(sessionKey, attemptId) < evadeChance(agility);
}

export function receivedMonsterDamage(level, vitality, tier = MONSTER_TIERS.normal, correct = false, evaded = false) {
  if (correct || evaded) return 0;
  return Math.max(1, Math.round(monsterDamage(level, tier) * (1 - damageReduction(vitality))));
}

export function timingThresholds(agility) {
  const agi = Math.max(1, Number(agility || 1));
  return {
    fastMs: Math.round((5 + 2.5 * (1 - Math.exp(-(agi - 1) / 10))) * 1000),
    normalMs: Math.round((10 + 4 * (1 - Math.exp(-(agi - 1) / 10))) * 1000),
  };
}

export function attackResult({ level, strength, agility, responseTimeMs, correct }) {
  if (!correct) return { damage: 0, grade: "miss", multiplier: 0 };

  const { fastMs, normalMs } = timingThresholds(agility);

  let grade = "slow";
  let multiplier = 0.8;
  if (responseTimeMs <= fastMs) {
    grade = "fast";
    multiplier = 1.35;
  } else if (responseTimeMs <= normalMs) {
    grade = "normal";
    multiplier = 1;
  }

  return { damage: Math.max(1, Math.round(baseAttack(level, strength) * multiplier)), grade, multiplier };
}
