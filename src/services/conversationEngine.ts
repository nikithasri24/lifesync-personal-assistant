// Conversational AI Engine using Groq (FREE)
// ChatGPT-style conversation with function calling for your life management app

import Groq from 'groq-sdk';
import { toolRegistry } from '@/lib/ai/toolRegistry';
import { taskTools } from '@/todos/tools';
import { financeTools } from '@/finance/tools';
import { habitTools } from '@/habits/tools';
import { goalTools } from '@/goals/tools';
import { shoppingTools } from '@/shopping/tools';
import { mealTools } from '@/mealPlanning/tools';
import { journalTools } from '@/journal/tools';
import { apiClient } from './apiClient';
import { logger } from './logger';

// Types for function arguments and results
type FunctionArgs = Record<string, unknown>;

interface FunctionResult {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

const groq = new Groq({
  apiKey: ((import.meta.env.VITE_GROQ_API_KEY as string | undefined) ?? (import.meta.env.GROQ_API_KEY as string | undefined)) ?? '',
  dangerouslyAllowBrowser: true // OK for demo; use server proxy in production
});

// Register all tools on module initialization
function initializeTools(): void {
  toolRegistry.register([
    ...taskTools,
    ...financeTools,
    ...habitTools,
    ...goalTools,
    ...shoppingTools,
    ...mealTools,
    ...journalTools
  ]);

  logger.info('ConversationEngine', 'Tools registered', {
    totalTools: toolRegistry.count(),
    toolNames: toolRegistry.getToolNames()
  });
}

// Initialize tools when module loads
initializeTools();

// Get user context for better AI responses
async function getUserContext(): Promise<string> {
  try {
    // For now, return minimal context
    // This can be expanded later with more user data
    const context = {
      current_time: new Date().toISOString()
    };

    return JSON.stringify(context, null, 2);
  } catch (_error) {
    return '{}';
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  functionCalls?: Array<{ name: string; args: FunctionArgs; result: FunctionResult }>;
}

export class ConversationEngine {
  private messages: ConversationMessage[] = [];
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async chat(userMessage: string): Promise<{
    response: string;
    functionCalls?: Array<{ name: string; args: FunctionArgs; result: FunctionResult }>;
  }> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // Build messages for Groq (only keep last 10 for context)
    const recentMessages = this.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get user context
    const context = await getUserContext();

    // Get all registered tools
    const allTools = toolRegistry.getDefinitions();

    // System prompt with dynamic tool listing
    const toolSummary = toolRegistry.getSummary();
    const systemMessage = `You are a helpful AI assistant managing the user's personal life. You have access to their tasks, finances, goals, habits, meals, shopping, journal, and travel plans.

Current Context:
${context}

Available Tools (${allTools.length} total):
${toolRegistry.getToolNames().join(', ')}

Guidelines:
- Be conversational and natural, like ChatGPT
- Ask clarifying questions when you need more information
- Use functions to actually perform actions (don't just say you'll do something)
- Be proactive and suggest helpful actions
- Keep responses concise but warm
- When recording expenses, always ask for the category if not provided
- Suggest budgets when you notice spending patterns
- Help connect goals to concrete plans

Examples:
User: "I just spent 5 bucks on coffee"
You: "Got it! I'll record that. By the way, you've spent $47 on coffee this month. Want me to set a budget?"

User: "I want to save 10k for Japan"
You: "Awesome goal! When are you planning to go? I'll help create a savings plan and break it down into steps."`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          ...recentMessages
        ],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        tools: allTools as any,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      });

      const response = completion.choices[0]?.message;

      if (!response) {
        throw new Error('No response from AI');
      }

      // Handle function calls
      const functionCalls: Array<{ name: string; args: FunctionArgs; result: FunctionResult }> = [];

      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute all function calls
        for (const toolCall of response.tool_calls) {
          const functionName: string = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments) as FunctionArgs;

          let result: FunctionResult;

          // Execute tool using ToolRegistry
          if (toolRegistry.has(functionName)) {
            result = await toolRegistry.execute(
              functionName,
              functionArgs as Record<string, unknown>,
              this.userId
            );
          } else {
            // Unknown tool
            result = {
              success: false,
              error: `Unknown tool: ${functionName}`
            };
          }

          functionCalls.push({
            name: functionName,
            args: functionArgs,
            result
          });
        }

        // Get final response after function execution
        const followUp = await groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemMessage },
            ...recentMessages,
            {
              role: 'assistant',
              content: response.content ?? '',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
              tool_calls: response.tool_calls as any
            },
            {
              role: 'tool',
              content: JSON.stringify(functionCalls.map(fc => fc.result)),
              tool_call_id: response.tool_calls[0].id
            }
          ],
          temperature: 0.7,
          max_tokens: 512,
        });

        const finalResponse = followUp.choices[0]?.message?.content ?? 'Done!';

        // Add to history
        this.messages.push({
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date(),
          functionCalls
        });

        return {
          response: finalResponse,
          functionCalls
        };
      }

      // No function calls, just text response
      const textResponse = response.content ?? 'I can help you with that!';

      this.messages.push({
        role: 'assistant',
        content: textResponse,
        timestamp: new Date()
      });

      return { response: textResponse };

    } catch (error: unknown) {
      // Log detailed error information - GROQ SDK errors have special structure
      if (error instanceof Error) {
        logger.error('ConversationEngine', error, {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract GROQ API error details
        const errObj = error as Record<string, unknown>;
        logger.error('ConversationEngine', new Error('GROQ API Error'), {
          status: errObj.status,
          message: errObj.message,
          error: JSON.stringify(error, null, 2)
        });
      } else {
        logger.error('ConversationEngine', new Error('Unknown Error'), { error });
      }

      // Fallback response
      const fallback = "Sorry, I'm having trouble connecting right now. Please try again.";
      this.messages.push({
        role: 'assistant',
        content: fallback,
        timestamp: new Date()
      });

      return { response: fallback };
    }
  }

  getHistory(): ConversationMessage[] {
    return this.messages;
  }

  clearHistory(): void {
    this.messages = [];
  }
}
