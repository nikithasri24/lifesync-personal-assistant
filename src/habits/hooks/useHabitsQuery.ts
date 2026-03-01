/**
 * Habit CRUD query hooks.
 * Habit entry hooks live in useHabitEntriesQuery.ts.
 */

import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { HabitData } from '../../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitsMergedConnection,
} from '@/api/habitsAPI';
import { logger } from '@/services/logger';
import { dataEvents } from '@/lib/dataEvents';
import type { MergedConnectionResult } from '@/shared/api/SharedDataProvider';

// =====================================================
// MERGED MODE SUPPORT
// =====================================================

export function useMergedHabitsConnectionQuery(): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery({
    queryKey: ['habits', 'mergedConnection'],
    queryFn: getHabitsMergedConnection,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
}

// =====================================================
// HABITS QUERY HOOKS
// =====================================================

export interface HabitFilters {
  category?: string;
  isActive?: boolean;
}

export function useHabits(filters?: HabitFilters): UseQueryResult<HabitData[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', filters] as const,
    queryFn: () => getHabits(filters),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useHabit(id: string | null): UseQueryResult<HabitData, Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', 'detail', id] as const,
    queryFn: () => {
      if (!id) throw new Error('Habit ID is required');
      return getHabit(id);
    },
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// HABITS MUTATION HOOKS
// =====================================================

export function useCreateHabit(): UseMutationResult<HabitData, Error, Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Habits', 'Creating habit', { name: input.name, category: input.category });
      return createHabit(input);
    },
    onSuccess: (newHabit) => {
      logger.info('Habits', 'Habit created successfully', { id: newHabit.id, name: newHabit.name });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
      dataEvents.emit('habit:created', { habitId: newHabit.id!, habit: newHabit });
    },
    onError: (error: Error) => {
      logger.error('Habits', 'Failed to create habit', { error: error.message });
    },
  });
}

export function useUpdateHabit(): UseMutationResult<HabitData, Error, { id: string; updates: Partial<HabitData> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitData> }) => {
      logger.debug('Habits', 'Updating habit', { id, updates });
      return updateHabit(id, updates);
    },
    onMutate: ({ id, updates }) => {
      logger.debug('Habits', 'Optimistic update: updating habit', { id, updates });
    },
    onSuccess: (updatedHabit, { updates }) => {
      logger.info('Habits', 'Habit updated successfully', { id: updatedHabit.id, name: updatedHabit.name });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
      dataEvents.emit('habit:updated', { habitId: updatedHabit.id!, habit: updatedHabit, changes: updates });
    },
    onError: (error: Error, { id }) => {
      logger.error('Habits', 'Failed to update habit', { error: error.message, id });
    },
  });
}

export function useDeleteHabit(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Habits', 'Deleting habit', { id });
      return deleteHabit(id);
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Habits', 'Habit deleted successfully', { id: deletedId });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
      dataEvents.emit('habit:deleted', { habitId: deletedId });
    },
    onError: (error: Error, id) => {
      logger.error('Habits', 'Failed to delete habit', { error: error.message, id });
    },
  });
}
