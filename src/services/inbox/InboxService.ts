/**
 * Inbox Service
 * Handles quick capture and triage of inbox items
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getInboxItems as getInboxItemsAPI,
  getPendingCount as getPendingCountAPI,
  createInboxItem as createInboxItemAPI,
  dismissInboxItem as dismissInboxItemAPI,
  processInboxItem as processInboxItemAPI,
  deleteInboxItem as deleteInboxItemAPI,
  getInboxStats as getInboxStatsAPI,
  type InboxItem as InboxItemAPI,
  type CreateInboxItemInput as CreateInboxItemInputAPI,
} from '@/api/inboxAPI';
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
 * Note: API layer doesn't support all the parsed fields yet, so we use a simpler approach
 */
export async function createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
  const parsed = parseContent(input.content);

  // Map service types to API types (API has fewer types)
  const mapToAPIType = (type: InboxItemType): 'task' | 'note' | 'shopping' | 'reminder' | 'idea' | 'unknown' => {
    if (type === 'event' || type === 'habit' || type === 'goal' || type === 'other') {
      return 'idea'; // Map unsupported types to 'idea'
    }
    return type as 'task' | 'note' | 'shopping' | 'reminder' | 'idea' | 'unknown';
  };

  // API layer expects simpler input - we'll use suggested_type from parsing
  const apiInput: CreateInboxItemInputAPI = {
    content: input.content,
    suggested_type: mapToAPIType(parsed.suggestedType),
  };

  const result = await createInboxItemAPI(apiInput);
  return result as InboxItem;
}

/**
 * Get all inbox items for the current user
 */
export async function getInboxItems(status?: 'pending' | 'processed' | 'dismissed'): Promise<InboxItem[]> {
  const items = await getInboxItemsAPI(status);
  return items as InboxItem[];
}

/**
 * Get pending inbox items count
 */
export async function getPendingCount(): Promise<number> {
  try {
    return await getPendingCountAPI();
  } catch (error) {
    logger.error('InboxService', 'Failed to get pending count', { error, operation: 'getPendingCount' });
    return 0;
  }
}

/**
 * Dismiss an inbox item
 */
export async function dismissInboxItem(itemId: string): Promise<void> {
  await dismissInboxItemAPI(itemId);
}

/**
 * Mark inbox item as processed (after converting to task/note/etc)
 */
export async function markAsProcessed(
  itemId: string,
  processedToType: string,
  processedToId: string
): Promise<void> {
  await processInboxItemAPI(itemId, processedToType, processedToId);
}

/**
 * Delete an inbox item permanently
 */
export async function deleteInboxItem(itemId: string): Promise<void> {
  await deleteInboxItemAPI(itemId);
}

/**
 * Get inbox statistics
 */
export async function getInboxStats(): Promise<InboxStats> {
  try {
    const stats = await getInboxStatsAPI();
    return stats as InboxStats;
  } catch (error) {
    logger.error('InboxService', 'Failed to get inbox stats', { error, operation: 'getInboxStats' });
    return { pending: 0, processedToday: 0, total: 0, byType: {} as Record<InboxItemType, number> };
  }
}
