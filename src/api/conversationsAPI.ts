/**
 * Conversations API
 * CRUD operations for AI conversations with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';
import {
  mapRowToConversation,
  mapConversationToInsert,
  mapConversationToUpdate,
} from './mappers/conversationMappers';
import { DEFAULT_PAGE_SIZE, type PaginationParams, type PaginatedResult } from '../types/pagination';

/**
 * Get conversations for the current user
 */
export async function getConversations(filters?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<Conversation[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapRowToConversation);
    },
    { domain: 'ConversationsAPI', operation: 'getConversations', data: { filters } }
  );
}

/**
 * Get a paginated page of conversations.
 */
export async function getPagedConversations(
  filters?: { startDate?: Date; endDate?: Date },
  pagination: PaginationParams = { page: 1 }
): Promise<PaginatedResult<Conversation>> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
      const offset = (pagination.page - 1) * pageSize;

      let query = supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters?.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, count, error } = await query.range(offset, offset + pageSize - 1);
      if (error) throw error;
      const total = count ?? 0;
      return {
        items: (data ?? []).map(mapRowToConversation),
        total,
        page: pagination.page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    { domain: 'ConversationsAPI', operation: 'getPagedConversations', data: { filters, pagination } }
  );
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Conversation', id);
      return mapRowToConversation(data);
    },
    { domain: 'ConversationsAPI', operation: 'getConversation', data: { id } }
  );
}

/**
 * Create a new conversation
 */
export async function createConversation(conversation: Partial<Conversation>): Promise<Conversation> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbConversation = mapConversationToInsert(conversation);

      const result = await supabase
        .from('conversations')
        .insert({
          ...dbConversation,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Conversation');
      return mapRowToConversation(data);
    },
    { domain: 'ConversationsAPI', operation: 'createConversation' }
  );
}

/**
 * Update a conversation
 */
export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates = mapConversationToUpdate(updates);

      const result = await supabase
        .from('conversations')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Conversation', id);
      return mapRowToConversation(data);
    },
    { domain: 'ConversationsAPI', operation: 'updateConversation', data: { id } }
  );
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'ConversationsAPI', operation: 'deleteConversation', data: { id } }
  );
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: ConversationMessage
): Promise<Conversation> {
  return apiCall(
    async () => {
      const conversation = await getConversation(conversationId);
      const messages = [...(conversation.messages || []), message];

      return updateConversation(conversationId, { messages });
    },
    { domain: 'ConversationsAPI', operation: 'addMessageToConversation', data: { conversationId } }
  );
}

