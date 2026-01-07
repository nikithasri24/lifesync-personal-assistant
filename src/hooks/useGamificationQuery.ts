/**
 * Gamification React Query Hooks
 * Provides data fetching and mutations for the gamification system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserGamification,
  getAchievementDefinitions,
  getUserAchievements,
  getPointTransactions,
  awardXp,
  recordTaskCompletion,
  recordHabitCompletion,
  recordGoalAchieved,
  type UserGamification,
  type AchievementDefinition,
  type UserAchievement,
  type PointTransaction,
  type PointSourceType,
} from '@/services/gamification';
import { logger } from '@/services/logger';

// ============================================================================
// Query Keys
// ============================================================================

export const gamificationKeys = {
  all: ['gamification'] as const,
  profile: () => [...gamificationKeys.all, 'profile'] as const,
  achievements: () => [...gamificationKeys.all, 'achievements'] as const,
  definitions: () => [...gamificationKeys.all, 'definitions'] as const,
  userAchievements: () => [...gamificationKeys.all, 'userAchievements'] as const,
  transactions: (limit?: number) => [...gamificationKeys.all, 'transactions', limit] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Get user's gamification profile
 */
export function useGamificationProfile() {
  return useQuery<UserGamification, Error>({
    queryKey: gamificationKeys.profile(),
    queryFn: getUserGamification,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get all achievement definitions
 */
export function useAchievementDefinitions() {
  return useQuery<AchievementDefinition[], Error>({
    queryKey: gamificationKeys.definitions(),
    queryFn: getAchievementDefinitions,
    staleTime: 1000 * 60 * 60, // 1 hour (static data)
  });
}

/**
 * Get user's unlocked achievements
 */
export function useUserAchievements() {
  return useQuery<UserAchievement[], Error>({
    queryKey: gamificationKeys.userAchievements(),
    queryFn: getUserAchievements,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get recent point transactions
 */
export function usePointTransactions(limit = 20) {
  return useQuery<PointTransaction[], Error>({
    queryKey: gamificationKeys.transactions(limit),
    queryFn: () => getPointTransactions(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get achievements with progress
 */
export function useAchievementsWithProgress() {
  const { data: definitions } = useAchievementDefinitions();
  const { data: userAchievements } = useUserAchievements();
  const { data: profile } = useGamificationProfile();

  if (!definitions || !profile) {
    return { achievements: [], isLoading: true };
  }

  const unlockedIds = new Set(userAchievements?.map(a => a.achievementId) ?? []);

  const achievements = definitions.map(def => {
    const isUnlocked = unlockedIds.has(def.id);
    const userAchievement = userAchievements?.find(a => a.achievementId === def.id);
    
    let progress = 0;
    if (isUnlocked) {
      progress = 100;
    } else {
      // Calculate progress based on requirement type
      switch (def.requirementType) {
        case 'tasks_completed':
          progress = Math.min(100, (profile.tasksCompleted / def.requirementTarget) * 100);
          break;
        case 'habits_completed':
          progress = Math.min(100, (profile.habitsCompleted / def.requirementTarget) * 100);
          break;
        case 'goals_achieved':
          progress = Math.min(100, (profile.goalsAchieved / def.requirementTarget) * 100);
          break;
        case 'streak_days':
          progress = Math.min(100, (Math.max(profile.currentStreak, profile.longestStreak) / def.requirementTarget) * 100);
          break;
        case 'focus_minutes':
          progress = Math.min(100, (profile.focusMinutes / def.requirementTarget) * 100);
          break;
        case 'total_xp':
          progress = Math.min(100, (profile.totalXp / def.requirementTarget) * 100);
          break;
        case 'level_reached':
          progress = Math.min(100, (profile.currentLevel / def.requirementTarget) * 100);
          break;
      }
    }

    return {
      ...def,
      isUnlocked,
      progress: Math.floor(progress),
      unlockedAt: userAchievement?.unlockedAt ? new Date(userAchievement.unlockedAt) : undefined,
    };
  });

  return { achievements, isLoading: false };
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Award XP mutation
 */
export function useAwardXpMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, reason, sourceType, sourceId }: {
      amount: number;
      reason: string;
      sourceType: PointSourceType;
      sourceId?: string;
    }) => {
      return awardXp(amount, reason, sourceType, sourceId);
    },
    onSuccess: () => {
      // Invalidate all gamification queries
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
    onError: (error) => {
      logger.error('Gamification', error instanceof Error ? error : new Error(String(error)));
    },
  });
}

/**
 * Record task completion mutation
 */
export function useRecordTaskCompletionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, priority }: { taskId: string; priority?: 'low' | 'medium' | 'high' }) => {
      return recordTaskCompletion(taskId, priority);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.all });
    },
  });
}

