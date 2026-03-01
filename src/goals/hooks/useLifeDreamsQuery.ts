import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import {
  getUserLifeDreams,
  createLifeDream,
  updateLifeDream,
  deleteLifeDream,
} from '@/goals/api/lifeGoalsAPI';
import type { LifeDream, CreateLifeDreamInput, UpdateLifeDreamInput } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Life Dreams ====================

export function useLifeDreamsQuery(): UseQueryResult<LifeDream[], Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.dreams(),
    queryFn: getUserLifeDreams,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateLifeDreamMutation(): UseMutationResult<LifeDream, Error, CreateLifeDreamInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLifeDreamInput) => {
      logger.debug('Goals', 'Creating life dream', { title: input.title, category: input.category });
      return createLifeDream(input);
    },
    onSuccess: (newDream) => {
      logger.info('Goals', 'Life dream created successfully', { id: newDream.id, title: newDream.title });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return [newDream];
        return [newDream, ...old];
      });
    },
    onError: (error: Error, input) => {
      logger.error('Goals', 'Failed to create life dream', { error: error.message, title: input.title });
    },
  });
}

export function useUpdateLifeDreamMutation(): UseMutationResult<LifeDream, Error, { dreamId: string; updates: UpdateLifeDreamInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dreamId, updates }: { dreamId: string; updates: UpdateLifeDreamInput }) => {
      logger.debug('Goals', 'Updating life dream', { dreamId, updates });
      return updateLifeDream(dreamId, updates);
    },
    onSuccess: (updatedDream, { dreamId }) => {
      logger.info('Goals', 'Life dream updated successfully', { id: dreamId, title: updatedDream.title });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.map((dream) => (dream.id === dreamId ? updatedDream : dream));
      });
    },
    onError: (error: Error, { dreamId }) => {
      logger.error('Goals', 'Failed to update life dream', { error: error.message, dreamId });
    },
  });
}

export function useDeleteLifeDreamMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dreamId: string) => {
      logger.debug('Goals', 'Deleting life dream', { dreamId });
      return deleteLifeDream(dreamId);
    },
    onSuccess: (_, dreamId) => {
      logger.info('Goals', 'Life dream deleted successfully', { id: dreamId });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.filter((dream) => dream.id !== dreamId);
      });
    },
    onError: (error: Error, dreamId) => {
      logger.error('Goals', 'Failed to delete life dream', { error: error.message, dreamId });
    },
  });
}
