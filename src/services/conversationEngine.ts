/**
 * Conversation Engine
 *
 * Full-featured AI conversation engine with:
 * - LLM integration via GroqProvider
 * - Tool execution via ToolRegistry
 * - Conversation persistence via ConversationPersistenceService
 * - Rich context via ContextAggregator
 */

import { smartChat } from '@/lib/providers/factory';
import { toolRegistry } from '@/lib/ai/toolRegistry';
import { conversationPersistenceService } from './ConversationPersistenceService';
import { contextAggregator, type AggregatedContext } from './ai/ContextAggregator';
import { logger } from './logger';
import type { Message, FunctionDefinition } from '@/lib/providers/interfaces';

// Ensure all tools are registered when ConversationEngine is imported
import '@/lib/ai/registerAllTools';

interface FunctionCallResult {
  name: string;
  arguments: Record<string, unknown>;
  result: { success: boolean; message?: string };
}

interface ChatResponse {
  response: string;
  functionCalls?: FunctionCallResult[];
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  text: string;
}

const SYSTEM_PROMPT = `You are Maya, a friendly and helpful AI personal assistant for LifeSync.
You help users manage their tasks, habits, calendar, finances, wellness, and daily life.

Your personality:
- Warm, encouraging, and supportive
- Concise but helpful (keep responses under 100 words unless more detail is needed)
- Use emojis sparingly for friendliness
- Proactively suggest helpful actions

You have access to tools to help users. When a user asks you to do something, use the appropriate tool.
After executing a tool, summarize what you did in natural language.

Current context about the user will be provided in each message.`;

export class ConversationEngine {
  private userId: string;
  private history: HistoryEntry[] = [];
  private messages: Message[] = [];
  private sessionStarted: boolean = false;
  private context: AggregatedContext | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize the session and load context
   */
  async initialize(): Promise<void> {
    if (this.sessionStarted) return;

    try {
      // Start a new conversation session
      await conversationPersistenceService.startSession(this.userId);

      // Load rich context
      this.context = await contextAggregator.getAggregatedContext(this.userId);

      this.sessionStarted = true;
      logger.info('ConversationEngine', 'Session initialized', { userId: this.userId });
    } catch (error) {
      logger.error('ConversationEngine', error as Error, { context: 'initialize' });
      // Continue without persistence/context on error
      this.sessionStarted = true;
    }
  }

  /**
   * Build system message with current context
   */
  private buildSystemMessage(): string {
    let systemMessage = SYSTEM_PROMPT;

    if (this.context) {
      const { today, patterns, upcomingEvents } = this.context;

      systemMessage += `\n\n## Current Context (${new Date().toLocaleDateString()})

### Today's Overview:
- Tasks: ${today.tasks.completed}/${today.tasks.total} completed, ${today.tasks.overdue} overdue
- Habits: ${today.habits.completed}/${today.habits.due} completed
- Focus: ${today.focus.minutesToday} minutes across ${today.focus.sessionsToday} sessions
- Events today: ${today.events.length > 0 ? today.events.map(e => e.title).join(', ') : 'None'}

### User Patterns:
- Average ${patterns.avgTasksPerDay} tasks/day
- Average ${patterns.avgFocusMinutes} minutes focus/day
- Habit completion rate: ${patterns.habitCompletionRate}%`;

      if (upcomingEvents.length > 0) {
        systemMessage += `\n\n### Upcoming Events:\n${upcomingEvents.slice(0, 5).map(e => `- ${e.title}`).join('\n')}`;
      }

      if (today.habits.streaksAtRisk.length > 0) {
        systemMessage += `\n\n⚠️ Streaks at risk: ${today.habits.streaksAtRisk.map(h => h.name).join(', ')}`;
      }
    }

    return systemMessage;
  }

  /**
   * Convert tool definitions to function format for LLM
   */
  private getToolFunctions(): FunctionDefinition[] {
    return toolRegistry.getDefinitions().map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));
  }

  /**
   * Process a user message and return the AI response
   */
  async chat(userMessage: string): Promise<ChatResponse> {
    // Ensure session is initialized
    if (!this.sessionStarted) {
      await this.initialize();
    }

    // Add user message to history
    this.history.push({ role: 'user', text: userMessage });
    this.messages.push({ role: 'user', content: userMessage });

    // Persist user message
    await conversationPersistenceService.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    const functionCalls: ChatResponse['functionCalls'] = [];

    try {
      // Build messages for LLM
      const llmMessages: Message[] = [
        { role: 'system', content: this.buildSystemMessage() },
        ...this.messages.slice(-10) // Keep last 10 messages for context
      ];

      // Get available tools
      const functions = this.getToolFunctions();

      // Call LLM
      let response = await smartChat(llmMessages, {
        functions: functions.length > 0 ? functions : undefined,
        temperature: 0.7,
        maxTokens: 1000
      });

      // Handle function calls (tool use)
      while (response.functionCall) {
        const { name, arguments: argsString } = response.functionCall;

        // Parse arguments from JSON string
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(argsString) as Record<string, unknown>;
        } catch {
          logger.warn('ConversationEngine', `Failed to parse tool arguments: ${argsString}`);
        }

        logger.info('ConversationEngine', `Tool call: ${name}`, { args: parsedArgs });

        // Execute the tool
        const result = await toolRegistry.execute(name, parsedArgs, this.userId);
        functionCalls.push({
          name,
          arguments: parsedArgs,
          result: { success: result.success ?? true, message: result.message }
        });

        // Add tool result to messages
        this.messages.push({
          role: 'assistant',
          content: '',
          name: name
        });
        this.messages.push({
          role: 'user', // Tool results are sent as user messages in Groq
          content: `Tool "${name}" result: ${JSON.stringify(result)}`,
          name: 'tool_result'
        });

        // Continue conversation with tool result
        const continueMessages: Message[] = [
          { role: 'system', content: this.buildSystemMessage() },
          ...this.messages.slice(-12)
        ];

        response = await smartChat(continueMessages, {
          functions,
          temperature: 0.7,
          maxTokens: 1000
        });
      }

      const assistantMessage = response.content || "I'm sorry, I couldn't process that request.";

      // Add assistant response to history
      this.history.push({ role: 'assistant', text: assistantMessage });
      this.messages.push({ role: 'assistant', content: assistantMessage });

      // Persist assistant message
      await conversationPersistenceService.addMessage({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
        tool_calls: functionCalls.length > 0 ? functionCalls : undefined
      });

      return {
        response: assistantMessage,
        functionCalls
      };

    } catch (error) {
      logger.error('ConversationEngine', error as Error, { context: 'chat' });

      const errorMessage = "I'm having trouble processing your request. Please try again.";
      this.history.push({ role: 'assistant', text: errorMessage });

      return {
        response: errorMessage,
        functionCalls
      };
    }
  }

  /**
   * Legacy method - use chat() instead
   */
  async processMessage(message: string): Promise<string> {
    const result = await this.chat(message);
    return result.response;
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    this.messages = [];
    conversationPersistenceService.endSession();
    this.sessionStarted = false;
  }

  /**
   * Refresh context (useful after user actions)
   */
  async refreshContext(): Promise<void> {
    try {
      this.context = await contextAggregator.getAggregatedContext(this.userId);
    } catch (error) {
      logger.error('ConversationEngine', error as Error, { context: 'refreshContext' });
    }
  }
}
