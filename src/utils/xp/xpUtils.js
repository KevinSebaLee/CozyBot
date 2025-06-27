let XpMultiplier = 1;
let globalCooldowns = new Map();

export function getMultiplier() {
  return XpMultiplier;
}

export function setMultiplier(mult) {
  XpMultiplier = mult;
}

export function checkCooldown(userId) {
  const now = Date.now();
  const lastXP = globalCooldowns.get(userId) || 0;
  if (now - lastXP < 60 * 1000) return false; // 1 min cooldown
  globalCooldowns.set(userId, now);
  return true;
}