/**
 * Gamification API
 * CRUD operations for XP, achievements, levels, and streaks
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

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
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as UserProgress | null;
    },
    { domain: 'GamificationAPI', operation: 'getUserProgress' }
  );
}

/**
 * Initialize user progress (for new users)
 */
export async function initializeProgress(): Promise<UserProgress> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'User Progress');
      return data as UserProgress;
    },
    { domain: 'GamificationAPI', operation: 'initializeProgress' }
  );
}

/**
 * Add XP to user's progress
 */
export async function addXP(amount: number, source: string, description: string, sourceId?: string): Promise<UserProgress> {
  return apiCall(
    async () => {
      const user = await requireAuth();

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
      const result = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          total_xp: currentXP,
          level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'User Progress');
      return data as UserProgress;
    },
    { domain: 'GamificationAPI', operation: 'addXP', data: { amount, source } }
  );
}

// =====================================================
// ACHIEVEMENTS
// =====================================================

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  return apiCall(
    async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
    { domain: 'GamificationAPI', operation: 'getAchievements' }
  );
}

/**
 * Unlock an achievement for the user
 */
export async function unlockAchievement(achievementCode: string): Promise<UserProgress> {
  return apiCall(
    async () => {
      const user = await requireAuth();

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
      const result = await supabase
        .from('user_progress')
        .update({
          achievements_unlocked: [...current, achievementCode],
        })
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'User Progress');
      return data as UserProgress;
    },
    { domain: 'GamificationAPI', operation: 'unlockAchievement', data: { achievementCode } }
  );
}

// =====================================================
// USER GAMIFICATION (detailed schema)
// =====================================================

/**
 * Get user's gamification data from user_gamification table
 */
export async function getUserGamification(): Promise<UserGamification | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as UserGamification | null;
    },
    { domain: 'GamificationAPI', operation: 'getUserGamification' }
  );
}

/**
 * Update user gamification data
 */
export async function updateUserGamification(
  updates: Partial<Omit<UserGamification, 'id' | 'user_id' | 'created_at'>>
): Promise<UserGamification> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('user_gamification')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'User Gamification');
      return data as UserGamification;
    },
    { domain: 'GamificationAPI', operation: 'updateUserGamification' }
  );
}

/**
 * Initialize user gamification (for new users)
 */
export async function initializeUserGamification(): Promise<UserGamification> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'User Gamification');
      return data as UserGamification;
    },
    { domain: 'GamificationAPI', operation: 'initializeUserGamification' }
  );
}

/**
 * Get achievement definitions
 */
export async function getAchievementDefinitions(): Promise<Achievement[]> {
  return apiCall(
    async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as Achievement[];
    },
    { domain: 'GamificationAPI', operation: 'getAchievementDefinitions' }
  );
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<unknown[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { domain: 'GamificationAPI', operation: 'getUserAchievements' }
  );
}

/**
 * Unlock user achievement
 */
export async function unlockUserAchievement(achievementId: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString(),
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
    },
    { domain: 'GamificationAPI', operation: 'unlockUserAchievement', data: { achievementId } }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      if (error) throw error;
    },
    { domain: 'GamificationAPI', operation: 'logPointTransaction', data: { amount, source } }
  );
}

