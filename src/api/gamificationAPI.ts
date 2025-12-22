/**
 * Gamification API
 * CRUD operations for XP, achievements, levels, and streaks
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

// =====================================================
// TYPES
// =====================================================

export interface UserProgress {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  achievements_unlocked: string[];
  badges: string[];
  created_at: string;
  updated_at: string;
}

// Support for user_gamification table (more detailed schema)
export interface UserGamification {
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

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  requirement_type: string;
  requirement_value: number;
  is_hidden: boolean;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  source_id?: string;
  description: string;
  created_at: string;
}

// =====================================================
// USER PROGRESS
// =====================================================

/**
 * Get user's gamification progress
 */
export async function getUserProgress(): Promise<UserProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('GamificationAPI', 'Failed to get user progress', { error });
    throw error;
  }
  return data as UserProgress | null;
}

/**
 * Initialize user progress (for new users)
 */
export async function initializeProgress(): Promise<UserProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      total_xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
      achievements_unlocked: [],
      badges: [],
    })
    .select()
    .single();

  if (error) {
    logger.error('GamificationAPI', 'Failed to initialize progress', { error });
    throw error;
  }
  return data as UserProgress;
}

/**
 * Add XP to user's progress
 */
export async function addXP(amount: number, source: string, description: string, sourceId?: string): Promise<UserProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Log XP transaction
  await supabase.from('xp_transactions').insert({
    user_id: user.id,
    amount,
    source,
    source_id: sourceId,
    description,
  });

  // Get current progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const currentXP = (progress?.total_xp || 0) + amount;
  const newLevel = Math.floor(currentXP / 1000) + 1;

  // Update progress
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      total_xp: currentXP,
      level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    logger.error('GamificationAPI', 'Failed to add XP', { error });
    throw error;
  }
  return data as UserProgress;
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    logger.error('GamificationAPI', 'Failed to get achievements', { error });
    throw error;
  }
  return data as Achievement[];
}

/**
 * Unlock an achievement for the user
 */
export async function unlockAchievement(achievementCode: string): Promise<UserProgress> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current achievements
  const { data: progress } = await supabase
    .from('user_progress')
    .select('achievements_unlocked')
    .eq('user_id', user.id)
    .single();

  const current = progress?.achievements_unlocked || [];
  if (current.includes(achievementCode)) {
    return getUserProgress() as Promise<UserProgress>;
  }

  // Add new achievement
  const { data, error } = await supabase
    .from('user_progress')
    .update({
      achievements_unlocked: [...current, achievementCode],
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('GamificationAPI', 'Failed to unlock achievement', { error });
    throw error;
  }
  return data as UserProgress;
}

// =====================================================
// USER GAMIFICATION (detailed schema)
// =====================================================

/**
 * Get user's gamification data from user_gamification table
 */
export async function getUserGamification(): Promise<UserGamification | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('GamificationAPI', 'Failed to get user gamification', { error });
    throw error;
  }
  return data as UserGamification | null;
}

/**
 * Update user gamification data
 */
export async function updateUserGamification(
  updates: Partial<Omit<UserGamification, 'id' | 'user_id' | 'created_at'>>
): Promise<UserGamification> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_gamification')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('GamificationAPI', 'Failed to update user gamification', { error });
    throw error;
  }
  return data as UserGamification;
}

/**
 * Initialize user gamification (for new users)
 */
export async function initializeUserGamification(): Promise<UserGamification> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_gamification')
    .insert({
      user_id: user.id,
      total_xp: 0,
      current_level: 1,
      xp_to_next_level: 100,
      current_streak: 0,
      longest_streak: 0,
      tasks_completed: 0,
      habits_completed: 0,
      goals_achieved: 0,
      focus_sessions: 0,
      focus_minutes: 0,
      rank_title: 'Beginner',
    })
    .select()
    .single();

  if (error) {
    logger.error('GamificationAPI', 'Failed to initialize user gamification', { error });
    throw error;
  }
  return data as UserGamification;
}

/**
 * Get achievement definitions
 */
export async function getAchievementDefinitions(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    logger.error('GamificationAPI', 'Failed to get achievement definitions', { error });
    throw error;
  }
  return data as Achievement[];
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<unknown[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false });

  if (error) {
    logger.error('GamificationAPI', 'Failed to get user achievements', { error });
    throw error;
  }
  return data || [];
}

/**
 * Unlock user achievement
 */
export async function unlockUserAchievement(achievementId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: user.id,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    });

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    logger.error('GamificationAPI', 'Failed to unlock achievement', { error });
    throw error;
  }
}

/**
 * Log point transaction
 */
export async function logPointTransaction(
  amount: number,
  source: string,
  sourceId?: string,
  description?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('point_transactions')
    .insert({
      user_id: user.id,
      points: amount,
      source,
      source_id: sourceId,
      description,
      created_at: new Date().toISOString(),
    });

  if (error) {
    logger.error('GamificationAPI', 'Failed to log point transaction', { error });
    throw error;
  }
}

