/**
 * Conversations API
 * CRUD operations for AI conversations with Supabase
 */

import { supabase } from '../lib/supabase';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';

/**
 * Get conversations for the current user
 */
export async function getConversations(filters?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Conversation not found');

  return data as Conversation;
}

/**
 * Create a new conversation
 */
export async function createConversation(conversation: Partial<Conversation>): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      ...conversation,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create conversation');

  return data as Conversation;
}

/**
 * Update a conversation
 */
export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to update conversation');

  return data as Conversation;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: ConversationMessage
): Promise<Conversation> {
  const conversation = await getConversation(conversationId);
  const messages = [...(conversation.messages || []), message];

  return updateConversation(conversationId, { messages });
}

