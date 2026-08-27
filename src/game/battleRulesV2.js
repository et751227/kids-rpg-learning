export const BASE_STATS = { strength: 1, vitality: 1, agility: 1 };

export const MONSTER_TIERS = {
  normal: {
    key: "normal",
    label: "一般怪",
    icon: "👾",
    hpMultiplier: 1,
    attackMultiplier: 1,
    rewardMultiplier: 1,
  },
  elite: {
    key: "elite",
    label: "菁英怪",
    icon: "👹",
    hpMultiplier: 1.5,
    attackMultiplier: 1.2,
    rewardMultiplier: 1.5,
  },
  boss: {
    key: "boss",
    label: "BOSS",
    icon: "🐉",
    hpMultiplier: 2.5,
    attackMultiplier: 1.5,
    rewardMultiplier: 2.5,
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

export function timingThresholds(agility) {
  const agi = Math.max(1, Number(agility || 1));
  return {
    fastMs: Math.round((5 + (agi - 1) * 0.3) * 1000),
    normalMs: Math.round((10 + (agi - 1) * 0.5) * 1000),
  };
}

export function attackResult({ strength, agility, responseTimeMs, correct }) {
  if (!correct) return { damage: 0, grade: "miss", multiplier: 0 };

  const baseDamage = 8 + Math.max(1, Number(strength || 1)) * 1.5;
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

  return { damage: Math.max(1, Math.round(baseDamage * multiplier)), grade, multiplier };
}
