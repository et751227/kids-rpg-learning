export const BASE_STATS = { strength: 1, vitality: 1, agility: 1 };

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

export function monsterMaxHp(level) {
  return Math.round(55 + Number(level || 1) * 5);
}

export function monsterDamage(level) {
  return Math.max(1, Math.round(4 + Number(level || 1) * 0.6));
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
