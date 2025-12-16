/**
 * Gamification System Types
 * Defines the data structures for points, levels, achievements, and streaks
 */

// ============================================================================
// Core Types
// ============================================================================

export interface UserGamification {
  id: string;
  userId: string;
  
  // Points & Levels
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  
  // Stats
  tasksCompleted: number;
  habitsCompleted: number;
  goalsAchieved: number;
  focusSessions: number;
  focusMinutes: number;
  
  // Rank
  rankTitle: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirementType: AchievementRequirementType;
  requirementTarget: number;
  xpReward: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  
  // Joined from achievement_definitions
  achievement?: AchievementDefinition;
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  sourceType: PointSourceType;
  sourceId: string | null;
  createdAt: string;
}

// ============================================================================
// Enums & Categories
// ============================================================================

export type AchievementCategory = 'streak' | 'completion' | 'time' | 'special' | 'milestone' | 'social';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementRequirementType = 
  | 'tasks_completed'
  | 'habits_completed'
  | 'goals_achieved'
  | 'streak_days'
  | 'focus_minutes'
  | 'focus_sessions'
  | 'total_xp'
  | 'level_reached'
  | 'special';

export type PointSourceType = 
  | 'task'
  | 'habit'
  | 'goal'
  | 'focus'
  | 'achievement'
  | 'streak'
  | 'bonus'
  | 'challenge';

// ============================================================================
// Point Values
// ============================================================================

export const POINT_VALUES = {
  // Tasks
  TASK_COMPLETED: 10,
  TASK_HIGH_PRIORITY: 5, // bonus for high priority
  
  // Habits
  HABIT_COMPLETED: 15,
  HABIT_STREAK_BONUS: 5, // per streak day
  
  // Goals
  GOAL_MILESTONE: 25,
  GOAL_ACHIEVED: 100,
  
  // Focus
  FOCUS_SESSION: 20,
  FOCUS_MINUTE: 1,
  
  // Streaks
  STREAK_MAINTAINED: 10, // daily login/activity bonus
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
  STREAK_MILESTONE_100: 500,
} as const;

// ============================================================================
// Level Calculation
// ============================================================================

export const LEVEL_CONFIG = {
  BASE_XP: 100,        // XP needed for level 1 -> 2
  GROWTH_RATE: 1.15,   // Exponential growth rate
  MAX_LEVEL: 100,
} as const;

// Rank titles based on level
export const RANK_TITLES: Record<number, string> = {
  1: 'Beginner',
  5: 'Apprentice',
  10: 'Journeyman',
  15: 'Skilled',
  20: 'Expert',
  30: 'Master',
  40: 'Grandmaster',
  50: 'Legend',
  75: 'Mythic',
  100: 'Transcendent',
};

/**
 * Calculate XP required for a given level
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.GROWTH_RATE, level - 2));
}

/**
 * Calculate level from total XP
 */
export function levelFromXp(totalXp: number): { level: number; xpIntoLevel: number; xpToNext: number } {
  let level = 1;
  let xpRemaining = totalXp;
  
  while (level < LEVEL_CONFIG.MAX_LEVEL) {
    const xpNeeded = xpForLevel(level + 1);
    if (xpRemaining < xpNeeded) {
      return { level, xpIntoLevel: xpRemaining, xpToNext: xpNeeded };
    }
    xpRemaining -= xpNeeded;
    level++;
  }
  
  return { level: LEVEL_CONFIG.MAX_LEVEL, xpIntoLevel: xpRemaining, xpToNext: 0 };
}

/**
 * Get rank title for a level
 */
export function getRankTitle(level: number): string {
  const levels = Object.keys(RANK_TITLES).map(Number).sort((a, b) => b - a);
  for (const l of levels) {
    if (level >= l) return RANK_TITLES[l];
  }
  return 'Beginner';
}

