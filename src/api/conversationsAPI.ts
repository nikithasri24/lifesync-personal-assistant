/**
 * Conversations API
 * CRUD operations for AI conversations with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';

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
      return (data ?? []) as Conversation[];
    },
    { domain: 'ConversationsAPI', operation: 'getConversations', data: { filters } }
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
      return data as Conversation;
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

      const result = await supabase
        .from('conversations')
        .insert({
          ...conversation,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Conversation');
      return data as Conversation;
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

      const result = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Conversation', id);
      return data as Conversation;
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

