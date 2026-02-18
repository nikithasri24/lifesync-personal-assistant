/**
 * Milestones React Query Hooks
 * Manage birthdays, anniversaries, and important dates
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, getUserErrorMessage, AuthenticationError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import {
  getMilestones,
  getUpcomingMilestones,
  getMilestone,
} from '../api/milestonesAPI';
import type {
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  MilestoneFilters,
} from '../types';

// =====================================================
// QUERY KEYS
// =====================================================

export const milestoneKeys = {
  all: ['milestones'] as const,
  lists: () => [...milestoneKeys.all, 'list'] as const,
  list: (filters?: MilestoneFilters) => [...milestoneKeys.lists(), filters] as const,
  infinite: (filters?: MilestoneFilters) => [...milestoneKeys.all, 'infinite', filters] as const,
  upcoming: () => [...milestoneKeys.all, 'upcoming'] as const,
  detail: (id: string) => [...milestoneKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all milestones with optional filters
 * Uses API layer which automatically handles merged mode
 */
export function useMilestones(filters?: MilestoneFilters) {
  return useQuery({
    queryKey: milestoneKeys.list(filters),
    queryFn: () => getMilestones(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get milestones with infinite scroll/pagination
 * Uses API layer which automatically handles merged mode
 */
export function useInfiniteMilestones(filters?: MilestoneFilters) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: milestoneKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }): Promise<Milestone[]> => {
      logger.debug('Together', 'Fetching milestones (paginated)', {
        filters,
        offset: pageParam,
        limit: PAGE_SIZE,
      });

      // Fetch all milestones using API (includes merged mode support)
      const allMilestones = await getMilestones(filters);

      // Client-side pagination
      const start = pageParam;
      const end = start + PAGE_SIZE;
      const page = allMilestones.slice(start, end);

      logger.debug('Together', 'Milestones fetched (paginated)', {
        count: page.length,
        offset: pageParam,
      });

      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      // Return the offset for the next page
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get upcoming milestones (using view for computed fields)
 * Uses API layer which automatically handles merged mode
 */
export function useUpcomingMilestones() {
  return useQuery({
    queryKey: milestoneKeys.upcoming(),
    queryFn: () => getUpcomingMilestones(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Get single milestone by ID
 * Uses API layer which automatically handles merged mode
 */
export function useMilestone(id: string) {
  return useQuery({
    queryKey: milestoneKeys.detail(id),
    queryFn: () => getMilestone(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new milestone
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (milestone: CreateMilestoneRequest): Promise<Milestone> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Creating milestone', { type: milestone.milestone_type });

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          user_id: user.id,
          ...milestone,
        })
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create milestone', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Milestone created', { id: data.id });
      return data;
    },
    onSuccess: () => {
      showToast('Milestone created successfully!', 'success');
      // Invalidate lists and infinite queries, not detail queries
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.upcoming() });
      void queryClient.invalidateQueries({ queryKey: [...milestoneKeys.all, 'infinite'] });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'createMilestone' });
    },
  });
}

/**
 * Update existing milestone
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdateMilestoneRequest): Promise<Milestone> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Updating milestone', { id });

      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to update milestone', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Milestone updated', { id });
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: milestoneKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: milestoneKeys.lists() });
      await queryClient.cancelQueries({ queryKey: milestoneKeys.upcoming() });

      // Snapshot previous values
      const previousMilestone = queryClient.getQueryData<Milestone>(
        milestoneKeys.detail(id)
      );

      // Optimistically update detail query
      if (previousMilestone) {
        queryClient.setQueryData<Milestone>(milestoneKeys.detail(id), {
          ...previousMilestone,
          ...updates,
        });
      }

      // Optimistically update lists
      queryClient.setQueriesData<Milestone[]>(
        { queryKey: milestoneKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone
          );
        }
      );

      // Optimistically update upcoming
      queryClient.setQueriesData<Milestone[]>(
        { queryKey: milestoneKeys.upcoming() },
        (old) => {
          if (!old) return old;
          return old.map((milestone) =>
            milestone.id === id ? { ...milestone, ...updates } : milestone
          );
        }
      );

      return { previousMilestone };
    },
    onSuccess: (data) => {
      showToast('Milestone updated successfully!', 'success');
      // Update specific item in cache with server data
      queryClient.setQueryData(milestoneKeys.detail(data.id), data);
      // Invalidate lists and infinite queries (detail query already updated)
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.upcoming() });
      void queryClient.invalidateQueries({ queryKey: [...milestoneKeys.all, 'infinite'] });
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousMilestone) {
        queryClient.setQueryData(milestoneKeys.detail(id), context.previousMilestone);
      }
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.upcoming() });
      void queryClient.invalidateQueries({ queryKey: [...milestoneKeys.all, 'infinite'] });

      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'updateMilestone' });
    },
  });
}

/**
 * Delete milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Deleting milestone', { id });

      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Together', 'Failed to delete milestone', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Milestone deleted', { id });
    },
    onSuccess: (_, id) => {
      showToast('Milestone deleted', 'success');
      // Remove from cache
      queryClient.removeQueries({ queryKey: milestoneKeys.detail(id) });
      // Invalidate lists and infinite queries
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.upcoming() });
      void queryClient.invalidateQueries({ queryKey: [...milestoneKeys.all, 'infinite'] });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'deleteMilestone' });
    },
  });
}
