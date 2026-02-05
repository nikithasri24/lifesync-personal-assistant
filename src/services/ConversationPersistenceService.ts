/**
 * ConversationPersistenceService
 * Handles saving and loading AI conversations to/from Supabase
 * Enables contextual memory across sessions
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  getConversations,
  createConversation,
  updateConversation,
  addMessageToConversation
} from '@/api/conversationsAPI';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';
import { logger } from './logger';

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
   * Generate a new session ID (UUID v4)
   */
  generateSessionId(): string {
    // Generate a proper UUID v4
    return crypto.randomUUID();
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
      logger.debug('Service', 'Started conversation session', { sessionId: this.currentSessionId });

      return this.currentSessionId;
    } catch (error) {
      logger.error('Service', error instanceof Error ? error : 'Failed to start session', {});
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
        logger.error('Service', 'Session not found', { sessionId });
        return null;
      }

      this.currentSessionId = sessionId;
      this.currentConversationId = conversation.id;

      return conversation as Conversation;
    } catch (error) {
      logger.error('Service', error instanceof Error ? error : 'Failed to resume session', {});
      return null;
    }
  }

  /**
   * Add a message to the current conversation
   */
  async addMessage(message: ConversationMessage): Promise<void> {
    if (!this.currentConversationId) {
      logger.warn('Service', 'No active session');
      return;
    }

    // Use API layer instead of direct Supabase
    try {
      await addMessageToConversation(this.currentConversationId, message);
    } catch (error) {
      logger.error('Service', error instanceof Error ? error : 'Failed to add message', {});
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
      logger.error('Service', error instanceof Error ? error : 'Failed to get recent conversations', {});
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
      logger.error('Service', error instanceof Error ? error : 'Search failed', {});
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
      logger.error('Service', error instanceof Error ? error : 'Failed to update summary', {});
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
      logger.error('Service', error instanceof Error ? error : 'Failed to save context snapshot', {});
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

