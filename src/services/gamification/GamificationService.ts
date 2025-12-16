/**
 * Gamification Service
 * Handles XP, levels, achievements, and streak tracking
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to get existing profile
  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // If exists, return it
  if (data) {
    return mapRowToUserGamification(data as UserGamificationRow);
  }

  // Create new profile
  const { data: newProfile, error: createError } = await supabase
    .from('user_gamification')
    .insert({ user_id: user.id })
    .select()
    .single();

  if (createError) throw createError;
  return mapRowToUserGamification(newProfile as UserGamificationRow);
}

/**
 * Get all achievement definitions
 */
export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as AchievementDefinitionRow[]).map(mapRowToAchievementDefinition);
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievement_definitions(*)
    `)
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false });

  if (error) throw error;
  
  return (data ?? []).map((row) => ({
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    reason: row.reason,
    sourceType: row.source_type as PointSourceType,
    sourceId: row.source_id,
    createdAt: row.created_at,
  }));
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  logger.info('Gamification', 'Awarding XP', { amount, reason, sourceType });

  // Get current profile
  const profile = await getUserGamification();
  const newTotalXp = profile.totalXp + amount;
  const { level: newLevel, xpToNext } = levelFromXp(newTotalXp);
  const levelUp = newLevel > profile.currentLevel;
  const newRankTitle = getRankTitle(newLevel);

  // Record the transaction
  await supabase
    .from('point_transactions')
    .insert({
      user_id: user.id,
      amount,
      reason,
      source_type: sourceType,
      source_id: sourceId ?? null,
    });

  // Update profile
  await supabase
    .from('user_gamification')
    .update({
      total_xp: newTotalXp,
      current_level: newLevel,
      xp_to_next_level: xpToNext,
      rank_title: newRankTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let xp = POINT_VALUES.TASK_COMPLETED;
  if (priority === 'high') xp += POINT_VALUES.TASK_HIGH_PRIORITY;

  // Update stats - get current profile and increment
  const profile = await getUserGamification();
  const { error } = await supabase
    .from('user_gamification')
    .update({
      tasks_completed: profile.tasksCompleted + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) logger.error('Gamification', error);

  await awardXp(xp, `Completed task`, 'task', taskId);
  await updateStreak();
}

/**
 * Record habit completion and award XP
 */
export async function recordHabitCompletion(habitId: string, streakDays: number = 0): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let xp = POINT_VALUES.HABIT_COMPLETED;
  if (streakDays > 0) {
    xp += Math.min(streakDays, 10) * POINT_VALUES.HABIT_STREAK_BONUS;
  }

  // Update stats
  const { error } = await supabase
    .from('user_gamification')
    .update({
      habits_completed: (await getUserGamification()).habitsCompleted + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) logger.error('Gamification', error);

  await awardXp(xp, `Completed habit (${streakDays} day streak)`, 'habit', habitId);
  await updateStreak();
}

/**
 * Record goal achievement and award XP
 */
export async function recordGoalAchieved(goalId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Update stats
  const { error } = await supabase
    .from('user_gamification')
    .update({
      goals_achieved: (await getUserGamification()).goalsAchieved + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) logger.error('Gamification', error);

  await awardXp(POINT_VALUES.GOAL_ACHIEVED, 'Achieved a goal!', 'goal', goalId);
  await updateStreak();
}

/**
 * Update user streak based on activity
 */
async function updateStreak(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

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

    await supabase
      .from('user_gamification')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }
}

/**
 * Check and unlock any new achievements
 */
async function checkAndUnlockAchievements(totalXp: number, level: number): Promise<AchievementDefinition[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
      await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: def.id,
          progress: 100,
        });

      // Award XP for achievement (don't recursively check)
      await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          amount: def.xpReward,
          reason: `Achievement: ${def.name}`,
          source_type: 'achievement',
          source_id: def.id,
        });

      await supabase
        .from('user_gamification')
        .update({
          total_xp: totalXp + def.xpReward,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      newlyUnlocked.push(def);
      logger.info('Gamification', 'Achievement unlocked!', { achievement: def.name });
    }
  }

  return newlyUnlocked;
}

