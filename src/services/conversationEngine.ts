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
- VERY concise - keep responses under 50 words
- Use emojis sparingly for friendliness
- Proactively suggest helpful actions

IMPORTANT Response Guidelines:
- After executing a tool, give ONE brief confirmation (e.g., "Done! Created 'Buy groceries' for your wife.")
- NEVER repeat yourself or describe the same action multiple times
- NEVER say "Here's a summary of what I did" - just state what you did once
- Be direct and natural, like texting a friend

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
   * Build system message with current context (optimized for token efficiency)
   */
  private buildSystemMessage(): string {
    let systemMessage = SYSTEM_PROMPT;

    if (this.context) {
      const { today, patterns } = this.context;

      // Compact context - only essential info
      systemMessage += `\n\nToday: ${today.tasks.completed}/${today.tasks.total} tasks, ${today.habits.completed}/${today.habits.due} habits, ${today.focus.minutesToday}min focus`;

      // Only add warnings if critical
      if (today.tasks.overdue > 0) {
        systemMessage += `, ${today.tasks.overdue} overdue`;
      }

      if (today.habits.streaksAtRisk.length > 0) {
        systemMessage += `\n⚠️ Streaks at risk: ${today.habits.streaksAtRisk.slice(0, 3).map(h => h.name).join(', ')}`;
      }
    }

    return systemMessage;
  }

  /**
   * Convert tool definitions to function format for LLM (filtered by relevance)
   */
  private getToolFunctions(userMessage?: string): FunctionDefinition[] {
    const allDefinitions = toolRegistry.getDefinitions();

    // If no message or few tools, return all
    if (!userMessage || allDefinitions.length <= 10) {
      return allDefinitions.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }));
    }

    // Filter tools based on keywords to reduce token usage
    const messageLower = userMessage.toLowerCase();
    const keywords = {
      task: ['task', 'todo', 'complete', 'finish', 'done', 'add'],
      habit: ['habit', 'streak', 'routine'],
      goal: ['goal', 'objective', 'target'],
      schedule: ['schedule', 'calendar', 'event', 'meeting'],
    };

    // Determine relevant categories
    const relevantCategories = new Set<string>();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => messageLower.includes(word))) {
        relevantCategories.add(category);
      }
    }

    // If no category detected, include task and habit (most common)
    if (relevantCategories.size === 0) {
      relevantCategories.add('task');
      relevantCategories.add('habit');
    }

    // Filter tools
    const filtered = allDefinitions.filter(tool => {
      const toolName = tool.function.name.toLowerCase();
      return Array.from(relevantCategories).some(cat => toolName.includes(cat));
    });

    // Return filtered or all if filter is too restrictive
    const result = filtered.length > 0 ? filtered : allDefinitions.slice(0, 10);

    return result.map(tool => ({
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
      // Build messages for LLM (keep fewer messages to reduce token usage)
      const llmMessages: Message[] = [
        { role: 'system', content: this.buildSystemMessage() },
        ...this.messages.slice(-6) // Keep last 6 messages for context (reduced from 10)
      ];

      // Get available tools (filtered by user message to reduce tokens)
      const functions = this.getToolFunctions(userMessage);

      // Call LLM with reduced token limits to avoid rate limits
      let response = await smartChat(llmMessages, {
        functions: functions.length > 0 ? functions : undefined,
        temperature: 0.5, // Lower temperature for more focused, concise responses
        maxTokens: 300 // Reduced to encourage brevity
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

        // Add tool result to messages (keep it concise to avoid repetition)
        this.messages.push({
          role: 'assistant',
          content: '',
          name: name
        });
        // Only send success status and message, not full result to reduce verbosity
        const toolResultSummary = result.success
          ? `Success: ${result.message || 'Done'}`
          : `Error: ${result.error || 'Failed'}`;
        this.messages.push({
          role: 'user', // Tool results are sent as user messages in Groq
          content: toolResultSummary,
          name: 'tool_result'
        });

        // Continue conversation with tool result (keep fewer messages)
        const continueMessages: Message[] = [
          { role: 'system', content: this.buildSystemMessage() },
          ...this.messages.slice(-8) // Reduced from 12
        ];

        response = await smartChat(continueMessages, {
          functions,
          temperature: 0.5, // Lower temperature for more focused, concise responses
          maxTokens: 300 // Reduced to encourage brevity
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
