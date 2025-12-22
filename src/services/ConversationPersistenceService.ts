/**
 * ConversationPersistenceService
 * Handles saving and loading AI conversations to/from Supabase
 * Enables contextual memory across sessions
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  addMessageToConversation
} from '@/api/conversationsAPI';
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

    // Use API layer instead of direct Supabase
    try {
      const conversation = await createConversation({
        session_id: this.currentSessionId,
        messages: [],
        message_count: 0,
      });

      this.currentConversationId = conversation.id;
      console.log('[ConversationPersistence] Started session:', this.currentSessionId);

      return this.currentSessionId;
    } catch (error) {
      console.error('[ConversationPersistence] Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId: string): Promise<Conversation | null> {
    // Use API layer instead of direct Supabase
    try {
      const conversations = await getConversations();
      const conversation = conversations.find(c => c.session_id === sessionId);

      if (!conversation) {
        console.error('[ConversationPersistence] Session not found:', sessionId);
        return null;
      }

      this.currentSessionId = sessionId;
      this.currentConversationId = conversation.id;

      return conversation as Conversation;
    } catch (error) {
      console.error('[ConversationPersistence] Failed to resume session:', error);
      return null;
    }
  }

  /**
   * Add a message to the current conversation
   */
  async addMessage(message: ConversationMessage): Promise<void> {
    if (!this.currentConversationId) {
      console.warn('[ConversationPersistence] No active session');
      return;
    }

    // Use API layer instead of direct Supabase
    try {
      await addMessageToConversation(this.currentConversationId, message);
    } catch (error) {
      console.error('[ConversationPersistence] Failed to add message:', error);
    }
  }

  /**
   * Fallback method to add message (fetch, append, update)
   * @deprecated - Now handled by API layer
   */
  private async addMessageFallback(message: ConversationMessage): Promise<void> {
    // This method is deprecated - API layer handles this
    await this.addMessage(message);
  }

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(
    userId: string,
    limit: number = 10
  ): Promise<ConversationSummary[]> {
    // Use API layer instead of direct Supabase
    try {
      const conversations = await getConversations();
      // Sort by updated_at and limit
      return conversations
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, limit)
        .map(c => ({
          id: c.id,
          session_id: c.session_id,
          message_count: c.message_count,
          summary: c.summary ?? null,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
    } catch (error) {
      console.error('[ConversationPersistence] Failed to get recent:', error);
      return [];
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    // Use API layer instead of direct Supabase
    // Note: RPC function search_conversations needs to be added to API layer
    // For now, do client-side filtering
    try {
      const conversations = await getConversations();
      const filtered = conversations.filter(c => {
        const messagesText = JSON.stringify(c.messages).toLowerCase();
        return messagesText.includes(query.toLowerCase());
      });
      return filtered.slice(0, limit) as Conversation[];
    } catch (error) {
      console.error('[ConversationPersistence] Search failed:', error);
      return [];
    }
  }

  /**
   * Update conversation summary
   */
  async updateSummary(conversationId: string, summary: string): Promise<void> {
    // Use API layer instead of direct Supabase
    try {
      await updateConversation(conversationId, { summary });
    } catch (error) {
      console.error('[ConversationPersistence] Failed to update summary:', error);
    }
  }

  /**
   * Save context snapshot for the current conversation
   */
  async saveContextSnapshot(context: Record<string, unknown>): Promise<void> {
    if (!this.currentConversationId) return;

    // Use API layer instead of direct Supabase
    try {
      await updateConversation(this.currentConversationId, { context_snapshot: context });
    } catch (error) {
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

