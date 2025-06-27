export const BASE_EXP = 50;
export const GROWTH_RATE = 1.025;

export function calculateXP(level) {
  return Math.floor(BASE_EXP * Math.pow(GROWTH_RATE, level - 1));
}