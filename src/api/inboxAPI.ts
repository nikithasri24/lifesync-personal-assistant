/**
 * Inbox API
 * CRUD operations for quick capture inbox items
 *
 * Migrated to modern pattern: 2026-02-16
 * Uses apiWrapper for standardized error handling
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { isInboxItem, isArrayOf } from '../types/guards';
import { ValidationError } from '../lib/errors';

// =====================================================
// TYPES
// =====================================================

export type InboxItemType = 'task' | 'note' | 'shopping' | 'reminder' | 'idea' | 'unknown';
export type InboxItemStatus = 'pending' | 'processed' | 'dismissed';

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  suggested_type: InboxItemType;
  suggested_category?: string;
  status: InboxItemStatus;
  processed_at?: string;
  processed_result?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateInboxItemInput {
  content: string;
  suggested_type?: InboxItemType;
  suggested_category?: string;
}

export interface InboxStats {
  pending: number;
  processedToday: number;
  total: number;
  byType: Record<InboxItemType, number>;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all inbox items for the current user
 */
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      const validated = handleSupabaseResponse({ data, error }, 'InboxItem');

      if (!Array.isArray(validated) || !validated.every(isInboxItem)) {
        throw new ValidationError('Invalid inbox item data received');
      }

      return validated as InboxItem[];
    },
    { domain: 'InboxAPI', operation: 'getInboxItems', data: { status } }
  );
}

/**
 * Get pending inbox items count
 */
export async function getPendingCount(): Promise<number> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { count, error } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      return count ?? 0;
    },
    { domain: 'InboxAPI', operation: 'getPendingCount' }
  );
}

/**
 * Create a new inbox item
 */
export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('inbox_items')
        .insert({
          user_id: user.id,
          content: input.content,
          suggested_type: input.suggested_type || 'unknown',
          suggested_category: input.suggested_category,
          status: 'pending',
        })
        .select()
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'InboxItem');

      if (!isInboxItem(validated)) {
        throw new ValidationError('Invalid inbox item data received');
      }

      return validated as InboxItem;
    },
    { domain: 'InboxAPI', operation: 'createInboxItem', data: { content: input.content } }
  );
}

/**
 * Update an inbox item
 */
export async function updateInboxItem(
  id: string,
  updates: Partial<Pick<InboxItem, 'content' | 'suggested_type' | 'suggested_category' | 'status' | 'processed_result'>>
): Promise<InboxItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const updateData: Record<string, unknown> = { ...updates };
      if (updates.status === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('inbox_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'InboxItem', id);

      if (!isInboxItem(validated)) {
        throw new ValidationError('Invalid inbox item data received');
      }

      return validated as InboxItem;
    },
    { domain: 'InboxAPI', operation: 'updateInboxItem', data: { id, updates } }
  );
}

/**
 * Mark an inbox item as processed
 */
export async function markProcessed(
  id: string,
  result: Record<string, unknown>
): Promise<InboxItem> {
  return updateInboxItem(id, {
    status: 'processed',
    processed_result: result,
  });
}

/**
 * Dismiss an inbox item
 */
export async function dismissInboxItem(id: string): Promise<InboxItem> {
  return updateInboxItem(id, { status: 'dismissed' });
}

/**
 * Delete an inbox item
 */
export async function deleteInboxItem(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'InboxAPI', operation: 'deleteInboxItem', data: { id } }
  );
}

/**
 * Process an inbox item (mark as processed with metadata)
 */
export async function processInboxItem(
  id: string,
  processedToType: string,
  processedToId: string
): Promise<InboxItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('inbox_items')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          processed_result: {
            processed_to_type: processedToType,
            processed_to_id: processedToId,
          },
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'InboxItem', id);

      if (!isInboxItem(validated)) {
        throw new ValidationError('Invalid inbox item data received');
      }

      return validated as InboxItem;
    },
    { domain: 'InboxAPI', operation: 'processInboxItem', data: { id, processedToType, processedToId } }
  );
}

/**
 * Get inbox statistics
 */
export async function getInboxStats(): Promise<InboxStats> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const today = new Date().toISOString().split('T')[0];

      const [pendingResult, processedTodayResult, allResult] = await Promise.all([
        supabase
          .from('inbox_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('inbox_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'processed')
          .gte('processed_at', `${today}T00:00:00`),
        supabase
          .from('inbox_items')
          .select('suggested_type')
          .eq('user_id', user.id)
          .eq('status', 'pending'),
      ]);

      // Check for errors
      if (pendingResult.error) throw pendingResult.error;
      if (processedTodayResult.error) throw processedTodayResult.error;
      if (allResult.error) throw allResult.error;

      // Count by type
      const byType: Record<InboxItemType, number> = {
        task: 0,
        note: 0,
        shopping: 0,
        reminder: 0,
        idea: 0,
        unknown: 0,
      };

      (allResult.data || []).forEach((item) => {
        const type = item.suggested_type as InboxItemType;
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        pending: pendingResult.count ?? 0,
        processedToday: processedTodayResult.count ?? 0,
        total: (pendingResult.count ?? 0) + (processedTodayResult.count ?? 0),
        byType,
      };
    },
    { domain: 'InboxAPI', operation: 'getInboxStats' }
  );
}
