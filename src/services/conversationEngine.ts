/**
 * Conversation Engine
 *
 * Note: This is a stub implementation. Full implementation pending.
 */

interface ChatResponse {
  response: string;
  functionCalls?: Array<{ result: { success: boolean } }>;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  text: string;
}

export class ConversationEngine {
  private userId: string;
  private history: HistoryEntry[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  async processMessage(_message: string): Promise<string> {
    throw new Error('ConversationEngine.processMessage not implemented');
  }

  async chat(_message: string): Promise<ChatResponse> {
    return {
      response: 'Chat functionality not implemented',
      functionCalls: []
    };
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }
}
