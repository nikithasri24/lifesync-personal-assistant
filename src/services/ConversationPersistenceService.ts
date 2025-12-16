/**
 * ConversationPersistenceService
 * Handles saving and loading AI conversations to/from Supabase
 * Enables contextual memory across sessions
 */

import { supabase } from '@/lib/supabase';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';

export interface ConversationSummary {
  id: string;
  session_id: string;
  message_count: number;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

class ConversationPersistenceService {
  private currentSessionId: string | null = null;
  private currentConversationId: string | null = null;

  /**
   * Generate a new session ID
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start a new conversation session
   */
  async startSession(userId: string): Promise<string> {
    this.currentSessionId = this.generateSessionId();
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        session_id: this.currentSessionId,
        messages: [],
        message_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ConversationPersistence] Failed to start session:', error);
      throw error;
    }

    this.currentConversationId = data.id;
    console.log('[ConversationPersistence] Started session:', this.currentSessionId);
    
    return this.currentSessionId;
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('[ConversationPersistence] Failed to resume session:', error);
      return null;
    }

    this.currentSessionId = sessionId;
    this.currentConversationId = data.id;
    
    return data as Conversation;
  }

  /**
   * Add a message to the current conversation
   */
  async addMessage(message: ConversationMessage): Promise<void> {
    if (!this.currentConversationId) {
      console.warn('[ConversationPersistence] No active session');
      return;
    }

    // Append message to the messages array
    const { error } = await supabase.rpc('append_conversation_message', {
      p_conversation_id: this.currentConversationId,
      p_message: message,
    });

    if (error) {
      // Fallback: fetch, append, update
      console.warn('[ConversationPersistence] RPC failed, using fallback:', error);
      await this.addMessageFallback(message);
    }
  }

  /**
   * Fallback method to add message (fetch, append, update)
   */
  private async addMessageFallback(message: ConversationMessage): Promise<void> {
    if (!this.currentConversationId) return;

    const { data: current } = await supabase
      .from('conversations')
      .select('messages, message_count')
      .eq('id', this.currentConversationId)
      .single();

    if (!current) return;

    const messages = [...(current.messages || []), message];
    
    await supabase
      .from('conversations')
      .update({
        messages,
        message_count: messages.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.currentConversationId);
  }

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(
    userId: string,
    limit: number = 10
  ): Promise<ConversationSummary[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, session_id, message_count, summary, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ConversationPersistence] Failed to get recent:', error);
      return [];
    }

    return data as ConversationSummary[];
  }

  /**
   * Search conversations by content
   */
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const { data, error } = await supabase
      .rpc('search_conversations', {
        p_user_id: userId,
        p_search_query: query,
        p_limit: limit,
      });

    if (error) {
      console.error('[ConversationPersistence] Search failed:', error);
      return [];
    }

    return data as Conversation[];
  }

  /**
   * Update conversation summary
   */
  async updateSummary(conversationId: string, summary: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ summary })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationPersistence] Failed to update summary:', error);
    }
  }

  /**
   * Save context snapshot for the current conversation
   */
  async saveContextSnapshot(context: Record<string, unknown>): Promise<void> {
    if (!this.currentConversationId) return;

    const { error } = await supabase
      .from('conversations')
      .update({ context_snapshot: context })
      .eq('id', this.currentConversationId);

    if (error) {
      console.error('[ConversationPersistence] Failed to save context:', error);
    }
  }

  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Get the current conversation ID
   */
  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.currentSessionId = null;
    this.currentConversationId = null;
  }
}

// Export singleton instance
export const conversationPersistenceService = new ConversationPersistenceService();

// Export type for use in components
export type { ConversationPersistenceService };

