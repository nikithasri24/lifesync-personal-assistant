/**
 * Inbox API
 * CRUD operations for quick capture inbox items
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

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

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all inbox items for the current user
 */
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('inbox_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('InboxAPI', 'Failed to get inbox items', { error });
    throw error;
  }
  return data as InboxItem[];
}

/**
 * Get pending inbox items count
 */
export async function getPendingCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('inbox_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    logger.error('InboxAPI', 'Failed to get pending count', { error });
    throw error;
  }
  return count ?? 0;
}

/**
 * Create a new inbox item
 */
export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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

  if (error) {
    logger.error('InboxAPI', 'Failed to create inbox item', { error });
    throw error;
  }
  return data as InboxItem;
}

/**
 * Update an inbox item
 */
export async function updateInboxItem(
  id: string,
  updates: Partial<Pick<InboxItem, 'content' | 'suggested_type' | 'suggested_category' | 'status' | 'processed_result'>>
): Promise<InboxItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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

  if (error) {
    logger.error('InboxAPI', 'Failed to update inbox item', { error });
    throw error;
  }
  return data as InboxItem;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('InboxAPI', 'Failed to delete inbox item', { error });
    throw error;
  }
}

