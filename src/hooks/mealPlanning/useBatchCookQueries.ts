/**
 * React Query hooks for Batch Cook Sessions and Meal Logs.
 *
 * Return types for React Query hooks are complex inferred generics
 * (UseQueryResult, UseMutationResult) — not practical to annotate manually.
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBatchCookSessions,
  getActiveBatchSession,
  getActiveSessions,
  createBatchCookSession,
  deleteBatchCookSession,
  addDishToSession,
  updateDishServings,
  updateDishName,
  updateDishRecipe,
  getTodaysMealLogs,
  getMealLogs,
  createMealLog,
  deleteMealLog,
} from '@/api/batchCookAPI';
import type { BatchCookSessionInput, MealLogInput } from '@/meals/types';
import { logger } from '@/services/logger';
import { format } from 'date-fns';

const BATCH_KEYS = {
  all: ['batchCook'] as const,
  sessions: () => [...BATCH_KEYS.all, 'sessions'] as const,
  activeSession: () => [...BATCH_KEYS.all, 'activeSession'] as const,
  logs: (from: string, to: string) => [...BATCH_KEYS.all, 'logs', from, to] as const,
  todaysLogs: () => [...BATCH_KEYS.all, 'todaysLogs'] as const,
};

// ── Sessions ─────────────────────────────────────────────────

export function useBatchCookSessionsQuery() {
  return useQuery({
    queryKey: BATCH_KEYS.sessions(),
    queryFn: getBatchCookSessions,
    staleTime: 1000 * 60 * 2,
  });
}

export function useActiveBatchSessionQuery() {
  return useQuery({
    queryKey: BATCH_KEYS.activeSession(),
    queryFn: getActiveBatchSession,
    staleTime: 1000 * 60 * 2,
  });
}

/** Returns all sessions that still have food remaining — for the multi-tab Fridge Pool. */
export function useActiveSessionsQuery() {
  return useQuery({
    queryKey: [...BATCH_KEYS.all, 'activeSessions'] as const,
    queryFn: getActiveSessions,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateBatchCookSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BatchCookSessionInput) => createBatchCookSession(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useCreateBatchCookSession' });
    },
  });
}

export function useDeleteBatchCookSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteBatchCookSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useDeleteBatchCookSession' });
    },
  });
}

export function useAddDishToSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      customName,
      servingsCooked,
      recipeId,
    }: {
      sessionId: string;
      customName: string;
      servingsCooked: number;
      recipeId?: string | null;
    }) => addDishToSession(sessionId, customName, servingsCooked, recipeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useAddDishToSession' });
    },
  });
}

export function useUpdateDishName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, customName }: { dishId: string; customName: string }) =>
      updateDishName(dishId, customName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err as Error, { context: 'useUpdateDishName' });
    },
  });
}

export function useUpdateDishRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, recipeId }: { dishId: string; recipeId: string | null }) =>
      updateDishRecipe(dishId, recipeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err as Error, { context: 'useUpdateDishRecipe' });
    },
  });
}

export function useUpdateDishServings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dishId, servingsRemaining }: { dishId: string; servingsRemaining: number }) =>
      updateDishServings(dishId, servingsRemaining),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useUpdateDishServings' });
    },
  });
}

// ── Meal Logs ─────────────────────────────────────────────────

export function useTodaysMealLogsQuery(partnerUserId?: string) {
  return useQuery({
    queryKey: [...BATCH_KEYS.todaysLogs(), partnerUserId],
    queryFn: () => getTodaysMealLogs(partnerUserId),
    staleTime: 1000 * 30, // refresh frequently — logs change throughout the day
  });
}

export function useMealLogsQuery(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: BATCH_KEYS.logs(fromDate, toDate),
    queryFn: () => getMealLogs(fromDate, toDate),
    staleTime: 1000 * 60,
  });
}

export function useCreateMealLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MealLogInput) => createMealLog(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.todaysLogs() });
      // Also refresh active session so servings_remaining updates in real time
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.activeSession() });
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.sessions() });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useCreateMealLog' });
    },
  });
}

export function useDeleteMealLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteMealLog(logId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.todaysLogs() });
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.activeSession() });
      void queryClient.invalidateQueries({ queryKey: BATCH_KEYS.sessions() });
    },
    onError: (err) => {
      logger.error('BatchCook', err, { context: 'useDeleteMealLog' });
    },
  });
}

// Convenience: today's date string for query keys
export const todayDateStr = () => format(new Date(), 'yyyy-MM-dd');
