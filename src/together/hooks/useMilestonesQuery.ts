/**
 * Milestones React Query Hooks
 * Manage birthdays, anniversaries, and important dates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, AuthenticationError } from '@/lib/errors';
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
  upcoming: () => [...milestoneKeys.all, 'upcoming'] as const,
  detail: (id: string) => [...milestoneKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all milestones with optional filters
 */
export function useMilestones(filters?: MilestoneFilters) {
  return useQuery({
    queryKey: milestoneKeys.list(filters),
    queryFn: async (): Promise<Milestone[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching milestones', { filters });

      let query = supabase
        .from('milestones')
        .select('*')
        .order('milestone_date', { ascending: true });

      // Apply filters
      if (filters?.type) {
        query = query.eq('milestone_type', filters.type);
      }
      if (filters?.for_whom) {
        query = query.eq('for_whom', filters.for_whom);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Together', 'Failed to fetch milestones', { error });
        throw parseToLifeSyncError(error);
      }

      // Client-side filtering for upcoming/past
      let results = data || [];
      if (filters?.upcoming_only) {
        results = results.filter(m => {
          const date = new Date(m.milestone_date);
          return date >= new Date();
        });
      }
      if (filters?.past_only) {
        results = results.filter(m => {
          const date = new Date(m.milestone_date);
          return date < new Date();
        });
      }

      logger.debug('Together', 'Milestones fetched', { count: results.length });
      return results;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get upcoming milestones (using view for computed fields)
 */
export function useUpcomingMilestones() {
  return useQuery({
    queryKey: milestoneKeys.upcoming(),
    queryFn: async (): Promise<Milestone[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching upcoming milestones');

      const { data, error } = await supabase
        .from('upcoming_milestones')
        .select('*')
        .limit(10);

      if (error) {
        logger.error('Together', 'Failed to fetch upcoming milestones', { error });
        throw parseToLifeSyncError(error);
      }

      logger.debug('Together', 'Upcoming milestones fetched', { count: data?.length || 0 });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single milestone by ID
 */
export function useMilestone(id: string) {
  return useQuery({
    queryKey: milestoneKeys.detail(id),
    queryFn: async (): Promise<Milestone | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching milestone', { id });

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Together', 'Failed to fetch milestone', { error });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}

/**
 * Update existing milestone
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(data.id) });
    },
  });
}

/**
 * Delete milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}
