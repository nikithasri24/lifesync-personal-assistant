/**
 * Contextual Memory Service
 * Enables AI to remember and reference past conversations
 * "Last week you mentioned stress about the project - how did that go?"
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format, subDays, parseISO } from 'date-fns';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';

export interface MemoryItem {
  id: string;
  date: string;
  topic: string;
  summary: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  relatedEntities?: { type: string; name: string }[];
}

export interface MemorySearchResult {
  memories: MemoryItem[];
  relevantContext: string;
}

export interface ConversationContext {
  recentTopics: string[];
  mentionedEntities: { type: string; name: string }[];
  emotionalContext: string | null;
  lastMentioned: Record<string, string>; // topic -> date
}

// Keywords for topic extraction
const TOPIC_KEYWORDS: Record<string, string[]> = {
  work: ['work', 'job', 'project', 'meeting', 'deadline', 'boss', 'colleague', 'office'],
  health: ['health', 'doctor', 'exercise', 'gym', 'sick', 'tired', 'sleep', 'diet'],
  family: ['family', 'kids', 'husband', 'wife', 'parent', 'mom', 'dad', 'children'],
  finance: ['money', 'budget', 'bills', 'savings', 'spending', 'expense', 'income'],
  stress: ['stress', 'anxious', 'worried', 'overwhelmed', 'pressure', 'burnout'],
  goals: ['goal', 'plan', 'achieve', 'progress', 'milestone', 'target', 'dream'],
  habits: ['habit', 'routine', 'daily', 'streak', 'consistency', 'practice'],
  relationships: ['friend', 'relationship', 'social', 'partner', 'dating'],
};

class ContextualMemoryService {
  /**
   * Extract topics from text
   */
  extractTopics(text: string): string[] {
    const normalizedText = text.toLowerCase();
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some(kw => normalizedText.includes(kw))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Extract entities mentioned in text
   */
  extractEntities(text: string): { type: string; name: string }[] {
    const entities: { type: string; name: string }[] = [];

    // Simple pattern matching for common entity types
    const patterns = [
      { type: 'person', regex: /(?:my|the)\s+(mom|dad|husband|wife|boss|friend|colleague|doctor)\b/gi },
      { type: 'project', regex: /(?:the|my)\s+(\w+)\s+project/gi },
      { type: 'place', regex: /(?:at|to|from)\s+(work|home|office|gym|school)/gi },
    ];

    patterns.forEach(({ type, regex }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({ type, name: match[1].toLowerCase() });
      }
    });

    return entities;
  }

  /**
   * Get recent conversation context for a user
   */
  async getConversationContext(userId: string, days = 7): Promise<ConversationContext> {
    const startDate = subDays(new Date(), days);

    const { data: conversations } = await supabase
      .from('conversations')
      .select('messages, summary, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    const recentTopics: Set<string> = new Set();
    const mentionedEntities: { type: string; name: string }[] = [];
    const lastMentioned: Record<string, string> = {};
    let emotionalContext: string | null = null;

    (conversations || []).forEach(conv => {
      const messages = conv.messages as ConversationMessage[];
      const date = format(parseISO(conv.created_at), 'yyyy-MM-dd');

      messages.forEach(msg => {
        if (msg.role === 'user') {
          const topics = this.extractTopics(msg.content);
          topics.forEach(topic => {
            recentTopics.add(topic);
            if (!lastMentioned[topic]) {
              lastMentioned[topic] = date;
            }
          });

          const entities = this.extractEntities(msg.content);
          mentionedEntities.push(...entities);

          // Check for emotional content
          if (msg.content.toLowerCase().includes('stress') || 
              msg.content.toLowerCase().includes('worried') ||
              msg.content.toLowerCase().includes('anxious')) {
            emotionalContext = 'User has mentioned stress or anxiety recently';
          }
        }
      });
    });

    return {
      recentTopics: Array.from(recentTopics),
      mentionedEntities: mentionedEntities.slice(0, 10),
      emotionalContext,
      lastMentioned,
    };
  }

  /**
   * Search memories by topic or keyword
   */
  async searchMemories(userId: string, query: string, limit = 5): Promise<MemorySearchResult> {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, messages, summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    const queryLower = query.toLowerCase();
    const memories: MemoryItem[] = [];

    (conversations || []).forEach(conv => {
      const messages = conv.messages as ConversationMessage[];
      const userMessages = messages.filter(m => m.role === 'user');
      
      // Check if any message matches the query
      const matchingMessages = userMessages.filter(m => 
        m.content.toLowerCase().includes(queryLower)
      );

      if (matchingMessages.length > 0 || (conv.summary && conv.summary.toLowerCase().includes(queryLower))) {
        const topics = this.extractTopics(matchingMessages.map(m => m.content).join(' '));
        
        memories.push({
          id: conv.id,
          date: format(parseISO(conv.created_at), 'yyyy-MM-dd'),
          topic: topics[0] || 'general',
          summary: conv.summary || matchingMessages[0]?.content.slice(0, 100) || '',
          keywords: topics,
        });
      }
    });

    // Generate relevant context
    const relevantContext = memories.length > 0
      ? `Found ${memories.length} relevant conversation(s) about "${query}"`
      : `No previous conversations found about "${query}"`;

    return {
      memories: memories.slice(0, limit),
      relevantContext,
    };
  }
}

export const contextualMemoryService = new ContextualMemoryService();

