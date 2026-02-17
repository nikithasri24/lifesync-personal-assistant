/**
 * Type mappers for conversations
 * Converts between database Json types and application types
 */

import type { Database } from '@/types/database.types';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

/**
 * Converts database row to application Conversation type
 */
export function mapRowToConversation(row: ConversationRow): Conversation {
  // Parse messages array
  const messages: ConversationMessage[] = Array.isArray(row.messages)
    ? (row.messages as unknown as ConversationMessage[])
    : [];

  // Parse context_snapshot
  const context_snapshot =
    typeof row.context_snapshot === 'object' && row.context_snapshot !== null
      ? (row.context_snapshot as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    user_id: row.user_id,
    session_id: row.session_id,
    messages,
    summary: row.summary ?? null,
    context_snapshot,
    started_at: row.started_at ?? new Date().toISOString(),
    last_message_at: row.last_message_at ?? new Date().toISOString(),
    message_count: row.message_count ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Converts application Conversation to database insert format
 */
export function mapConversationToInsert(
  conversation: Partial<Conversation>
): Omit<ConversationInsert, 'user_id'> {
  return {
    session_id: conversation.session_id,
    messages: (conversation.messages ?? []) as unknown as Database['public']['Tables']['conversations']['Insert']['messages'],
    summary: conversation.summary,
    context_snapshot: conversation.context_snapshot as unknown as Database['public']['Tables']['conversations']['Insert']['context_snapshot'],
    started_at: conversation.started_at,
    last_message_at: conversation.last_message_at,
    message_count: conversation.message_count,
  };
}

/**
 * Converts partial Conversation update to database update format
 */
export function mapConversationToUpdate(
  updates: Partial<Conversation>
): Database['public']['Tables']['conversations']['Update'] {
  const dbUpdate: Database['public']['Tables']['conversations']['Update'] = {};

  if (updates.session_id !== undefined) dbUpdate.session_id = updates.session_id;
  if (updates.summary !== undefined) dbUpdate.summary = updates.summary;
  if (updates.started_at !== undefined) dbUpdate.started_at = updates.started_at;
  if (updates.last_message_at !== undefined) dbUpdate.last_message_at = updates.last_message_at;
  if (updates.message_count !== undefined) dbUpdate.message_count = updates.message_count;

  if (updates.messages !== undefined) {
    dbUpdate.messages = updates.messages as unknown as Database['public']['Tables']['conversations']['Update']['messages'];
  }

  if (updates.context_snapshot !== undefined) {
    dbUpdate.context_snapshot = updates.context_snapshot as Database['public']['Tables']['conversations']['Update']['context_snapshot'];
  }

  return dbUpdate;
}
