/**
 * Milestones API
 * CRUD operations for relationship milestones with Merged Mode support
 *
 * Merged Mode: When enabled, fetches milestones for both users in a partnership
 * so couples can see all milestones (birthdays, anniversaries, etc.) in one unified view
 */

import { supabase } from '@/lib/supabase';
import { apiCall, requireAuth } from '@/api/apiWrapper';
import { parseToLifeSyncError } from '@/lib/errors';
import { logger } from '@/services/logger';
import { getTogetherMergedConnection } from '../hooks/useTogetherMergedMode';
import type {
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  MilestoneFilters,
} from '../types';

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all milestones with optional filters (supports merged mode)
 * In merged mode, returns both users' milestones for unified view
 */
export async function getMilestones(filters?: MilestoneFilters): Promise<Milestone[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getTogetherMergedConnection('milestones');

      let query = supabase
        .from('milestones')
        .select('*')
        .order('milestone_date', { ascending: true });

      // If merged mode, get both users' milestones
      // Otherwise, just get current user's milestones
      if (mergedConnection) {
        logger.debug('Together', 'Merged mode enabled - fetching milestones for both users');
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply filters
      if (filters?.type) {
        query = query.eq('milestone_type', filters.type);
      }
      if (filters?.for_whom) {
        query = query.eq('for_whom', filters.for_whom);
      }

      const { data, error } = await query;

      if (error) throw parseToLifeSyncError(error);

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

      return results;
    },
    { domain: 'Together', operation: 'getMilestones' }
  );
}

/**
 * Get upcoming milestones from view
 */
export async function getUpcomingMilestones(): Promise<Milestone[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('upcoming_milestones')
        .select('*')
        .limit(10);

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Together', operation: 'getUpcomingMilestones' }
  );
}

/**
 * Get single milestone by ID
 */
export async function getMilestone(id: string): Promise<Milestone | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw parseToLifeSyncError(error);

      return data;
    },
    { domain: 'Together', operation: 'getMilestone', data: { id } }
  );
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new milestone
 */
export async function createMilestone(milestone: CreateMilestoneRequest): Promise<Milestone> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          user_id: user.id,
          ...milestone,
        })
        .select()
        .single();

      if (error) throw parseToLifeSyncError(error);

      return data;
    },
    { domain: 'Together', operation: 'createMilestone' }
  );
}

/**
 * Update existing milestone
 */
export async function updateMilestone(id: string, updates: Partial<CreateMilestoneRequest>): Promise<Milestone> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw parseToLifeSyncError(error);

      return data;
    },
    { domain: 'Together', operation: 'updateMilestone', data: { id } }
  );
}

/**
 * Delete milestone
 */
export async function deleteMilestone(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw parseToLifeSyncError(error);
    },
    { domain: 'Together', operation: 'deleteMilestone', data: { id } }
  );
}
