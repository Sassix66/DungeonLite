export const GLOBAL_BALANCE = {
  actionApCost: 4,
  enemyRegenDelayMs: 1800,
  enemyRegenPerSecond: 4,
  playerRegenDelayMs: 5000,
  defeatPenaltyDurationMs: 180000,
  defeatAttackMultiplier: 0.70,
  defeatDefenseMultiplier: 0.70,
  minimumEnemyDamageRatio: 0.15,
  defenseConstant: 100,
  playerCritMultiplier: 2,
  enemyCritMultiplier: 2
};

export const ZONE_BALANCE = {
  mine: {
    enemyHp: 1.00,
    enemyAttack: 1.00,
    enemyDefense: 1.00,
    xp: 1.00,
    gold: 1.00,
    eliteChance: 0.05,
    lootQuality: 1.00,
    merchantPrice: 1.00
  },
  crypt: {
    enemyHp: 1.08,
    enemyAttack: 1.06,
    enemyDefense: 1.05,
    xp: 1.08,
    gold: 1.08,
    eliteChance: 0.06,
    lootQuality: 1.08,
    merchantPrice: 1.06
  },
  forest: {
    enemyHp: 1.16,
    enemyAttack: 1.12,
    enemyDefense: 1.10,
    xp: 1.16,
    gold: 1.16,
    eliteChance: 0.07,
    lootQuality: 1.16,
    merchantPrice: 1.12
  },
  fortress: {
    enemyHp: 1.25,
    enemyAttack: 1.20,
    enemyDefense: 1.16,
    xp: 1.25,
    gold: 1.25,
    eliteChance: 0.08,
    lootQuality: 1.25,
    merchantPrice: 1.18
  },
  ice: {
    enemyHp: 1.36,
    enemyAttack: 1.29,
    enemyDefense: 1.23,
    xp: 1.36,
    gold: 1.36,
    eliteChance: 0.09,
    lootQuality: 1.36,
    merchantPrice: 1.25
  },
  volcano: {
    enemyHp: 1.50,
    enemyAttack: 1.40,
    enemyDefense: 1.32,
    xp: 1.50,
    gold: 1.50,
    eliteChance: 0.10,
    lootQuality: 1.50,
    merchantPrice: 1.34
  }
};

export function getZoneBalance(zoneId) {
  return ZONE_BALANCE[zoneId] || ZONE_BALANCE.mine;
}
