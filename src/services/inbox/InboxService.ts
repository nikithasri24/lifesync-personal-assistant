/**
 * Inbox Service
 * Handles quick capture and triage of inbox items
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import type { InboxItem, CreateInboxItemInput, InboxItemType, InboxItemPriority, InboxStats } from './types';

// Simple AI parsing for content classification
function parseContent(content: string): {
  suggestedType: InboxItemType;
  suggestedPriority: InboxItemPriority | null;
  suggestedDate: string | null;
  suggestedTags: string[];
} {
  const lowerContent = content.toLowerCase();

  // Detect type from keywords
  let suggestedType: InboxItemType = 'idea';
  if (/\b(todo|task|do|complete|finish|submit)\b/.test(lowerContent)) {
    suggestedType = 'task';
  } else if (/\b(buy|shop|get|pick up|grocery)\b/.test(lowerContent)) {
    suggestedType = 'shopping';
  } else if (/\b(meeting|call|appointment|event|at \d|on \w+day)\b/.test(lowerContent)) {
    suggestedType = 'event';
  } else if (/\b(remind|reminder|don't forget|remember)\b/.test(lowerContent)) {
    suggestedType = 'reminder';
  } else if (/\b(note|idea|thought|maybe|consider)\b/.test(lowerContent)) {
    suggestedType = 'idea';
  } else if (/\b(goal|achieve|want to|plan to|by end of)\b/.test(lowerContent)) {
    suggestedType = 'goal';
  }

  // Detect priority
  let suggestedPriority: InboxItemPriority | null = null;
  if (/\b(urgent|asap|immediately|critical)\b/.test(lowerContent)) {
    suggestedPriority = 'urgent';
  } else if (/\b(important|high priority|must)\b/.test(lowerContent)) {
    suggestedPriority = 'high';
  } else if (/\b(low priority|whenever|someday)\b/.test(lowerContent)) {
    suggestedPriority = 'low';
  }

  // Detect date patterns (simple)
  let suggestedDate: string | null = null;
  const todayMatch = /\b(today)\b/.test(lowerContent);
  const tomorrowMatch = /\b(tomorrow)\b/.test(lowerContent);
  if (todayMatch) {
    suggestedDate = new Date().toISOString().split('T')[0];
  } else if (tomorrowMatch) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    suggestedDate = tomorrow.toISOString().split('T')[0];
  }

  // Extract hashtags as tags
  const hashtagMatches = content.match(/#(\w+)/g);
  const suggestedTags = hashtagMatches ? hashtagMatches.map(t => t.slice(1)) : [];

  return { suggestedType, suggestedPriority, suggestedDate, suggestedTags };
}

/**
 * Create a new inbox item (quick capture)
 */
export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const parsed = parseContent(input.content);

  const { data, error } = await supabase
    .from('inbox_items')
    .insert({
      user_id: user.id,
      content: input.content,
      source: input.source || 'manual',
      suggested_type: parsed.suggestedType,
      suggested_priority: parsed.suggestedPriority,
      suggested_date: parsed.suggestedDate,
      suggested_tags: parsed.suggestedTags,
    })
    .select()
    .single();

  if (error) {
    logger.error('InboxService', error, { operation: 'createInboxItem' });
    throw error;
  }

  return data as InboxItem;
}

/**
 * Get all inbox items for the current user
 */
export async function getInboxItems(status?: 'pending' | 'processed' | 'dismissed'): Promise<InboxItem[]> {
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
    logger.error('InboxService', error, { operation: 'getInboxItems' });
    throw error;
  }

  return (data || []) as InboxItem[];
}

/**
 * Get pending inbox items count
 */
export async function getPendingCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('inbox_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    logger.error('InboxService', error, { operation: 'getPendingCount' });
    return 0;
  }

  return count || 0;
}

/**
 * Dismiss an inbox item
 */
export async function dismissInboxItem(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('inbox_items')
    .update({
      status: 'dismissed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('InboxService', error, { operation: 'dismissInboxItem' });
    throw error;
  }
}

/**
 * Mark inbox item as processed (after converting to task/note/etc)
 */
export async function markAsProcessed(
  itemId: string,
  processedToType: string,
  processedToId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('inbox_items')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      processed_to_type: processedToType,
      processed_to_id: processedToId,
    })
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('InboxService', error, { operation: 'markAsProcessed' });
    throw error;
  }
}

/**
 * Delete an inbox item permanently
 */
export async function deleteInboxItem(itemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) {
    logger.error('InboxService', error, { operation: 'deleteInboxItem' });
    throw error;
  }
}

/**
 * Get inbox statistics
 */
export async function getInboxStats(): Promise<InboxStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { pending: 0, processedToday: 0, total: 0, byType: {} as Record<string, number> };
  }

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

  // Count by type
  const byType: Record<string, number> = {};
  for (const item of allResult.data || []) {
    const type = item.suggested_type || 'other';
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    pending: pendingResult.count || 0,
    processedToday: processedTodayResult.count || 0,
    total: (pendingResult.count || 0) + (processedTodayResult.count || 0),
    byType: byType as Record<InboxItemType, number>,
  };
}
