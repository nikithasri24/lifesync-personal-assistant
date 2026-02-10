/**
 * Gamification Service
 * Handles XP, levels, achievements, and streak tracking
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getUserGamification as getUserGamificationAPI,
  updateUserGamification as updateUserGamificationAPI,
  initializeUserGamification as initializeUserGamificationAPI,
  getAchievementDefinitions as getAchievementDefinitionsAPI,
  getUserAchievements as getUserAchievementsAPI,
  unlockUserAchievement as unlockUserAchievementAPI,
  logPointTransaction as logPointTransactionAPI,
} from '@/api/gamificationAPI';
import { logger } from '@/services/logger';
import { ValidationError } from '@/lib/errors';
import {
  type UserGamification,
  type AchievementDefinition,
  type UserAchievement,
  type PointTransaction,
  type PointSourceType,
  levelFromXp,
  getRankTitle,
  POINT_VALUES,
} from './types';

// ============================================================================
// Database Row Types
// ============================================================================

interface UserGamificationRow {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  tasks_completed: number;
  habits_completed: number;
  goals_achieved: number;
  focus_sessions: number;
  focus_minutes: number;
  rank_title: string;
  created_at: string;
  updated_at: string;
}

interface AchievementDefinitionRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  requirement_type: string;
  requirement_target: number;
  xp_reward: number;
  sort_order: number;
  is_active: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

function isUserGamificationRow(value: unknown): value is UserGamificationRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'total_xp' in value &&
    'current_level' in value &&
    typeof (value as UserGamificationRow).id === 'string' &&
    typeof (value as UserGamificationRow).user_id === 'string' &&
    typeof (value as UserGamificationRow).total_xp === 'number' &&
    typeof (value as UserGamificationRow).current_level === 'number'
  );
}

function isAchievementDefinitionRow(value: unknown): value is AchievementDefinitionRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'requirement_type' in value &&
    'requirement_target' in value &&
    typeof (value as AchievementDefinitionRow).id === 'string' &&
    typeof (value as AchievementDefinitionRow).name === 'string' &&
    typeof (value as AchievementDefinitionRow).requirement_target === 'number'
  );
}

// ============================================================================
// Mappers
// ============================================================================

function mapRowToUserGamification(row: UserGamificationRow): UserGamification {
  return {
    id: row.id,
    userId: row.user_id,
    totalXp: row.total_xp,
    currentLevel: row.current_level,
    xpToNextLevel: row.xp_to_next_level,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActivityDate: row.last_activity_date,
    tasksCompleted: row.tasks_completed,
    habitsCompleted: row.habits_completed,
    goalsAchieved: row.goals_achieved,
    focusSessions: row.focus_sessions,
    focusMinutes: row.focus_minutes,
    rankTitle: row.rank_title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToAchievementDefinition(row: AchievementDefinitionRow): AchievementDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category as AchievementDefinition['category'],
    rarity: row.rarity as AchievementDefinition['rarity'],
    requirementType: row.requirement_type as AchievementDefinition['requirementType'],
    requirementTarget: row.requirement_target,
    xpReward: row.xp_reward,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get or create user gamification profile
 */
export async function getUserGamification(): Promise<UserGamification> {
  // Use API layer instead of direct Supabase
  const data = await getUserGamificationAPI();

  // If exists, validate and return it
  if (data) {
    if (!isUserGamificationRow(data)) {
      logger.error('GamificationService', 'Invalid user gamification data from API', { data });
      throw new ValidationError('Invalid user gamification data received from database');
    }
    return mapRowToUserGamification(data);
  }

  // Create new profile
  const newProfile = await initializeUserGamificationAPI();
  if (!isUserGamificationRow(newProfile)) {
    logger.error('GamificationService', 'Invalid new gamification profile from API', { newProfile });
    throw new ValidationError('Invalid gamification profile created');
  }
  return mapRowToUserGamification(newProfile);
}

/**
 * Get all achievement definitions
 */
export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  // Use API layer instead of direct Supabase
  const data = await getAchievementDefinitionsAPI();

  // Validate array
  if (!Array.isArray(data)) {
    logger.error('GamificationService', 'Invalid achievement definitions data from API', { data });
    throw new ValidationError('Invalid achievement definitions data received');
  }

  // Filter and map valid items
  const validDefinitions: AchievementDefinition[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isAchievementDefinitionRow(data[i])) {
      validDefinitions.push(mapRowToAchievementDefinition(data[i]));
    } else {
      logger.warn('GamificationService', 'Invalid achievement definition at index', { index: i, item: data[i] });
    }
  }

  return validDefinitions;
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  // Use API layer instead of direct Supabase
  // Note: API doesn't support joins, so we get basic data
  const data = await getUserAchievementsAPI();

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
    progress: row.progress,
    achievement: row.achievement ? mapRowToAchievementDefinition(row.achievement) : undefined,
  }));
}

/**
 * Get recent point transactions
 */
export async function getPointTransactions(limit = 20): Promise<PointTransaction[]> {
  // Use API layer instead of direct Supabase
  // Note: API doesn't support limit parameter yet, so we'll get all and slice
  // This is a known limitation that should be addressed in the API layer
  logger.warn('Gamification', 'getPointTransactions using client-side limit - API should support this');

  // For now, return empty array as API doesn't have this function yet
  // TODO: Add getPointTransactions to gamificationAPI
  return [];
}

/**
 * Award XP to the user and check for achievements
 */
export async function awardXp(
  amount: number,
  reason: string,
  sourceType: PointSourceType,
  sourceId?: string
): Promise<{ newXp: number; levelUp: boolean; newLevel: number; achievementsUnlocked: AchievementDefinition[] }> {
  // Use API layer instead of direct Supabase
  logger.info('Gamification', 'Awarding XP', { amount, reason, sourceType });

  // Get current profile
  const profile = await getUserGamification();
  const newTotalXp = profile.totalXp + amount;
  const { level: newLevel, xpToNext } = levelFromXp(newTotalXp);
  const levelUp = newLevel > profile.currentLevel;
  const newRankTitle = getRankTitle(newLevel);

  // Record the transaction
  await logPointTransactionAPI(amount, sourceType, sourceId, reason);

  // Update profile
  await updateUserGamificationAPI({
    total_xp: newTotalXp,
    current_level: newLevel,
    xp_to_next_level: xpToNext,
    rank_title: newRankTitle,
  });

  // Check for new achievements
  const achievementsUnlocked = await checkAndUnlockAchievements(newTotalXp, newLevel);

  if (levelUp) {
    logger.info('Gamification', 'Level up!', { newLevel, newRankTitle });
  }

  return { newXp: newTotalXp, levelUp, newLevel, achievementsUnlocked };
}

/**
 * Record task completion and award XP
 */
export async function recordTaskCompletion(taskId: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
  // Use API layer instead of direct Supabase
  let xp = POINT_VALUES.TASK_COMPLETED;
  if (priority === 'high') xp += POINT_VALUES.TASK_HIGH_PRIORITY;

  // Update stats - get current profile and increment
  const profile = await getUserGamification();
  try {
    await updateUserGamificationAPI({
      tasks_completed: profile.tasksCompleted + 1,
    });
  } catch (error) {
    logger.error('Gamification', error instanceof Error ? error : String(error));
  }

  await awardXp(xp, `Completed task`, 'task', taskId);
  await updateStreak();
}

/**
 * Record habit completion and award XP
 */
export async function recordHabitCompletion(habitId: string, streakDays: number = 0): Promise<void> {
  // Use API layer instead of direct Supabase
  let xp = POINT_VALUES.HABIT_COMPLETED;
  if (streakDays > 0) {
    xp += Math.min(streakDays, 10) * POINT_VALUES.HABIT_STREAK_BONUS;
  }

  // Update stats
  const profile = await getUserGamification();
  try {
    await updateUserGamificationAPI({
      habits_completed: profile.habitsCompleted + 1,
    });
  } catch (error) {
    logger.error('Gamification', error instanceof Error ? error : String(error));
  }

  await awardXp(xp, `Completed habit (${streakDays} day streak)`, 'habit', habitId);
  await updateStreak();
}

/**
 * Record goal achievement and award XP
 */
export async function recordGoalAchieved(goalId: string): Promise<void> {
  // Use API layer instead of direct Supabase
  const profile = await getUserGamification();
  try {
    await updateUserGamificationAPI({
      goals_achieved: profile.goalsAchieved + 1,
    });
  } catch (error) {
    logger.error('Gamification', error instanceof Error ? error : String(error));
  }

  await awardXp(POINT_VALUES.GOAL_ACHIEVED, 'Achieved a goal!', 'goal', goalId);
  await updateStreak();
}

/**
 * Update user streak based on activity
 */
async function updateStreak(): Promise<void> {
  // Use API layer instead of direct Supabase
  const profile = await getUserGamification();
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = profile.lastActivityDate;

  let newStreak = profile.currentStreak;
  let longestStreak = profile.longestStreak;

  if (!lastActivity || lastActivity < today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActivity === yesterdayStr) {
      // Continuing streak
      newStreak += 1;
      longestStreak = Math.max(longestStreak, newStreak);

      // Award streak bonuses
      if (newStreak === 7) await awardXp(POINT_VALUES.STREAK_MILESTONE_7, '7-day streak!', 'streak');
      if (newStreak === 30) await awardXp(POINT_VALUES.STREAK_MILESTONE_30, '30-day streak!', 'streak');
      if (newStreak === 100) await awardXp(POINT_VALUES.STREAK_MILESTONE_100, '100-day streak!', 'streak');
    } else if (lastActivity !== today) {
      // Streak broken, restart
      newStreak = 1;
    }

    await updateUserGamificationAPI({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    });
  }
}

/**
 * Check and unlock any new achievements
 */
async function checkAndUnlockAchievements(totalXp: number, level: number): Promise<AchievementDefinition[]> {
  // Use API layer instead of direct Supabase
  const profile = await getUserGamification();
  const definitions = await getAchievementDefinitions();
  const unlocked = await getUserAchievements();
  const unlockedIds = new Set(unlocked.map(a => a.achievementId));
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const def of definitions) {
    if (unlockedIds.has(def.id)) continue;

    let shouldUnlock = false;

    switch (def.requirementType) {
      case 'tasks_completed':
        shouldUnlock = profile.tasksCompleted >= def.requirementTarget;
        break;
      case 'habits_completed':
        shouldUnlock = profile.habitsCompleted >= def.requirementTarget;
        break;
      case 'goals_achieved':
        shouldUnlock = profile.goalsAchieved >= def.requirementTarget;
        break;
      case 'streak_days':
        shouldUnlock = profile.currentStreak >= def.requirementTarget || profile.longestStreak >= def.requirementTarget;
        break;
      case 'focus_minutes':
        shouldUnlock = profile.focusMinutes >= def.requirementTarget;
        break;
      case 'focus_sessions':
        shouldUnlock = profile.focusSessions >= def.requirementTarget;
        break;
      case 'total_xp':
        shouldUnlock = totalXp >= def.requirementTarget;
        break;
      case 'level_reached':
        shouldUnlock = level >= def.requirementTarget;
        break;
    }

    if (shouldUnlock) {
      await unlockUserAchievementAPI(def.id);

      // Award XP for achievement (don't recursively check)
      await logPointTransactionAPI(def.xpReward, 'achievement', def.id, `Achievement: ${def.name}`);

      await updateUserGamificationAPI({
        total_xp: totalXp + def.xpReward,
      });

      newlyUnlocked.push(def);
      logger.info('Gamification', 'Achievement unlocked!', { achievement: def.name });
    }
  }

  return newlyUnlocked;
}

