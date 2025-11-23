/**
 * 75 Hard - Memoized Zustand Selectors
 *
 * OPTIMIZATION: These selectors prevent unnecessary component re-renders
 * by only subscribing to the specific data they need, not the entire store.
 *
 * Usage:
 * ```typescript
 * // ❌ BAD - Re-renders on ANY store change
 * const { sfhChallenge, sfhCheckIns } = useRealAppStore();
 *
 * // ✅ GOOD - Only re-renders when stats actually change
 * const stats = useRealAppStore(selectTodayStats);
 * ```
 */

import { startOfDay, isSameDay, isThisWeek } from 'date-fns';
import type { RealAppState } from './useRealAppStore';
import type { DailyCheckIn, TaskCompletion, SeventyFiveHardChallenge } from '../types/seventyFiveHard';

// ==================== Today's Data Selectors ====================

/**
 * Select today's check-in
 * Only causes re-render when today's check-in changes
 */
export const selectTodayCheckIn = (state: RealAppState): DailyCheckIn | null => {
  const today = startOfDay(new Date());
  const checkIns = state.sfhCheckIns as DailyCheckIn[];
  const checkIn = checkIns.find((c: DailyCheckIn) => isSameDay(c.date, today));
  return checkIn ?? null;
};

/**
 * Select today's task completion stats
 * Only causes re-render when completion counts change
 */
export const selectTodayStats = (state: RealAppState): {
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  completionPercentage: number;
} | null => {
  const todayCheckIn = selectTodayCheckIn(state);
  const challenge = state.sfhChallenge;
  if (!todayCheckIn || !challenge) return null;

  const taskCompletions = todayCheckIn.taskCompletions;
  const completedCount = taskCompletions.filter((t: TaskCompletion) => t.completed).length;
  const totalCount = challenge.tasks.length;
  const allComplete = completedCount === totalCount;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return { completedCount, totalCount, allComplete, completionPercentage };
};

/**
 * Select current day number
 * Only causes re-render when day number changes
 */
export const selectCurrentDay = (state: RealAppState): number | null => {
  const challenge = state.sfhChallenge;
  return challenge?.currentDay ?? null;
};

/**
 * Select challenge status
 * Only causes re-render when status changes
 */
export const selectChallengeStatus = (state: RealAppState): 'active' | 'completed' | null => {
  const challenge = state.sfhChallenge;
  return challenge?.status ?? null;
};

// ==================== Progress Selectors ====================

/**
 * Select this week's check-ins
 * Only causes re-render when this week's check-ins change
 */
export const selectWeekCheckIns = (state: RealAppState): DailyCheckIn[] => {
  const checkIns = state.sfhCheckIns as DailyCheckIn[];
  return checkIns.filter((c: DailyCheckIn) => isThisWeek(c.date, { weekStartsOn: 0 }));
};

/**
 * Select this week's completion stats
 * Only causes re-render when week's completion changes
 */
export const selectWeekStats = (state: RealAppState): {
  daysCompleted: number;
  totalDays: number;
  completionRate: number;
} | null => {
  const weekCheckIns = selectWeekCheckIns(state);
  if (!state.sfhChallenge) return null;

  const daysCompleted = weekCheckIns.filter((c: DailyCheckIn) =>
    c.taskCompletions.every((t) => t.completed)
  ).length;
  const totalDays = weekCheckIns.length;
  const completionRate = totalDays > 0 ? (daysCompleted / totalDays) * 100 : 0;

  return { daysCompleted, totalDays, completionRate };
};

/**
 * Select overall challenge progress
 * Only causes re-render when overall progress changes
 */
export const selectChallengeProgress = (state: RealAppState): {
  currentDay: number;
  totalDays: number;
  percentComplete: number;
  daysRemaining: number;
} | null => {
  const challenge = state.sfhChallenge;
  if (!challenge) return null;

  const currentDay = challenge.currentDay;
  const totalDays = 75;
  const percentComplete = (currentDay / totalDays) * 100;
  const daysRemaining = totalDays - currentDay;

  return { currentDay, totalDays, percentComplete, daysRemaining };
};

// ==================== Task Selectors ====================

/**
 * Select specific task completion status
 * Only causes re-render when this specific task's status changes
 */
export const selectTaskCompletion = (taskId: string): ((state: RealAppState) => boolean) => (state: RealAppState): boolean => {
  const todayCheckIn = selectTodayCheckIn(state);
  if (!todayCheckIn) return false;

  const taskCompletion = todayCheckIn.taskCompletions.find((tc) => tc.taskId === taskId);
  return taskCompletion?.completed ?? false;
};

/**
 * Select all task completions for today
 * Only causes re-render when task completions array changes
 */
export const selectTaskCompletions = (state: RealAppState): TaskCompletion[] => {
  const todayCheckIn = selectTodayCheckIn(state);
  return todayCheckIn?.taskCompletions ?? [];
};

// ==================== UI State Selectors ====================

/**
 * Select failure prompt visibility
 * Only causes re-render when failure prompt state changes
 */
export const selectFailurePromptState = (state: RealAppState): {
  show: boolean;
  date: Date | null;
} => ({
  show: state.sfhShowFailurePrompt,
  date: state.sfhFailureDate,
});

/**
 * Select day complete message visibility
 * Only causes re-render when message state changes
 */
export const selectDayCompleteMessage = (state: RealAppState): boolean => {
  return state.sfhShowDayCompleteMessage;
};

/**
 * Select celebration state
 * Only causes re-render when celebration state changes
 */
export const selectCelebrationState = (state: RealAppState): boolean => {
  return state.sfhShowCelebration;
};

// ==================== Data Existence Selectors ====================

/**
 * Select whether user has an active challenge
 * Only causes re-render when challenge existence changes
 */
export const selectHasActiveChallenge = (state: RealAppState): boolean => {
  const challenge = state.sfhChallenge;
  return challenge !== null && challenge.status === 'active';
};

/**
 * Select whether today's check-in exists
 * Only causes re-render when today's check-in existence changes
 */
export const selectHasTodayCheckIn = (state: RealAppState): boolean => {
  return selectTodayCheckIn(state) !== null;
};

// ==================== Composite Selectors ====================

/**
 * Select dashboard widget data
 * Combines multiple selectors for dashboard display
 */
export const selectDashboardWidget = (state: RealAppState): {
  hasChallenge: boolean;
  currentDay: number | null;
  stats: ReturnType<typeof selectTodayStats>;
  challengeStatus: 'active' | 'completed' | null;
} => ({
  hasChallenge: selectHasActiveChallenge(state),
  currentDay: selectCurrentDay(state),
  stats: selectTodayStats(state),
  challengeStatus: selectChallengeStatus(state),
});

/**
 * Select 75 Hard page data
 * Combines all data needed for the main 75 Hard page
 */
export const selectPageData = (state: RealAppState): {
  challenge: SeventyFiveHardChallenge | null;
  todayCheckIn: ReturnType<typeof selectTodayCheckIn>;
  todayStats: ReturnType<typeof selectTodayStats>;
  weekCheckIns: DailyCheckIn[];
  progress: ReturnType<typeof selectChallengeProgress>;
  uiState: {
    showFailurePrompt: boolean;
    failureDate: Date | null;
    showDayCompleteMessage: boolean;
    showCelebration: boolean;
  };
} => ({
  challenge: state.sfhChallenge,
  todayCheckIn: selectTodayCheckIn(state),
  todayStats: selectTodayStats(state),
  weekCheckIns: selectWeekCheckIns(state),
  progress: selectChallengeProgress(state),
  uiState: {
    showFailurePrompt: state.sfhShowFailurePrompt,
    failureDate: state.sfhFailureDate,
    showDayCompleteMessage: state.sfhShowDayCompleteMessage,
    showCelebration: state.sfhShowCelebration,
  },
});

// ==================== Performance Helpers ====================

/**
 * Create a shallow equality checker for selector results
 * Use this to prevent re-renders when object contents are the same
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

/**
 * Example usage with shallow equality:
 *
 * ```typescript
 * import { useShallow } from 'zustand/react/shallow';
 *
 * // This will only re-render when stats values change, not when object reference changes
 * const stats = useRealAppStore(useShallow(selectTodayStats));
 * ```
 */
