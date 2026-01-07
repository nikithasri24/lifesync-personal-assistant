/**
 * Groq LLM Provider
 *
 * Free tier: 14,400 requests/day
 * Models: llama-3-groq-70b-tool-use (best for function calling), llama-3.3-70b-versatile, mixtral-8x7b-32768
 * Fast inference, function calling support
 */

import Groq from 'groq-sdk';
import type {
  LLMProvider,
  Message,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  FunctionCall
} from '../interfaces';
import { logger } from '../../../services/logger';

export class GroqProvider implements LLMProvider {
  private client: Groq;
  private model: string;
  private available: boolean = true;

  constructor(apiKey: string, model: string = 'llama-3.1-8b-instant') {
    this.client = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true // OK for personal use; use server proxy in production
    });
    this.model = model;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
          ...(msg.name && { name: msg.name })
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        ...(options?.functions && {
          tools: options.functions.map(fn => ({
            type: 'function' as const,
            function: {
              name: fn.name,
              description: fn.description,
              parameters: fn.parameters
            }
          }))
        })
      });

      const choice = response.choices[0];

      // Check for function call
      let functionCall: FunctionCall | undefined;
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        functionCall = {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        };
      }

      return {
        content: choice.message.content ?? '',
        functionCall,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined
      };
    } catch (error) {
      logger.error('GroqProvider', error as Error, { context: 'chat failed' });

      // Mark as unavailable on rate limit or auth errors
      if (error instanceof Error &&
          (error.message.includes('rate limit') || error.message.includes('401'))) {
        this.available = false;
      }

      throw error;
    }
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<ChatChunk> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: true
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          yield {
            content: delta.content,
            done: false
          };
        }
      }

      yield { done: true };
    } catch (error) {
      logger.error('GroqProvider', error as Error, { context: 'streamChat failed' });
      throw error;
    }
  }

  getName(): string {
    return 'groq';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.available) {
      return false;
    }

    try {
      // Simple ping to check availability
      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      logger.warn('Groq', 'Availability check failed', { error });
      return false;
    }
  }
}
