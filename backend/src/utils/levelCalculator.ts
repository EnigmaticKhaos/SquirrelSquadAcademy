/**
 * Level calculation utilities
 * Uses exponential growth formula: XP required = BASE_XP * (level - 1)^2
 * This means:
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 3: 400 XP
 * - Level 4: 900 XP
 * - Level 5: 1600 XP
 * etc.
 */

const BASE_XP = 100; // Base XP multiplier for level calculation

/**
 * Calculate the level from total XP
 * Formula: level = floor(sqrt(XP / BASE_XP)) + 1
 */
export const calculateLevel = (xp: number): number => {
  if (xp < 0) return 1;
  const level = Math.floor(Math.sqrt(xp / BASE_XP)) + 1;
  return Math.max(1, level); // Ensure minimum level is 1
};

/**
 * Calculate the XP required to reach a specific level
 * Formula: XP = BASE_XP * (level - 1)^2
 */
export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return BASE_XP * Math.pow(level - 1, 2);
};

/**
 * Calculate the XP required for the next level
 */
export const getXPForNextLevel = (currentLevel: number): number => {
  return getXPForLevel(currentLevel + 1);
};

/**
 * Calculate the XP progress within the current level
 * Returns an object with current XP in level, XP needed for next level, and progress percentage
 */
export const getLevelProgress = (xp: number, level: number) => {
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForNextLevel(level);
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentXP: xpInCurrentLevel,
    xpNeeded: xpNeededForNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    xpForCurrentLevel,
    xpForNextLevel,
  };
};

/**
 * Check if user has leveled up
 */
export const hasLeveledUp = (oldXP: number, newXP: number): boolean => {
  return calculateLevel(oldXP) < calculateLevel(newXP);
};

