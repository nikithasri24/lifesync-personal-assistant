/**
 * Ollama LLM Provider (Local Fallback)
 *
 * Free tier: Unlimited (runs locally)
 * Models: llama3.2, llama3.1, mistral, etc.
 * Requires: Ollama installed and running (http://localhost:11434)
 */

import type {
  LLMProvider,
  Message,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  FunctionCall
} from '../interfaces';
import { logger } from '../../../services/logger';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const ollamaMessages: OllamaMessage[] = messages.map(msg => ({
        role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Ollama doesn't support function calling natively
      // We'll use prompt engineering to simulate it
      if (options?.functions && options.functions.length > 0) {
        const functionsPrompt = this.buildFunctionsPrompt(options.functions);
        ollamaMessages.unshift({
          role: 'system',
          content: functionsPrompt
        });
      }

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();

      // Try to parse function call from response
      const functionCall = this.extractFunctionCall(data.message.content);

      return {
        content: functionCall ? '' : data.message.content,
        functionCall
      };
    } catch (error) {
      logger.error('OllamaProvider.chat failed', { error });
      throw error;
    }
  }

  async *streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<ChatChunk> {
    try {
      const ollamaMessages: OllamaMessage[] = messages.map(msg => ({
        role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: ollamaMessages,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const data: OllamaResponse = JSON.parse(line);

            if (data.message?.content) {
              yield {
                content: data.message.content,
                done: false
              };
            }

            if (data.done) {
              yield { done: true };
              return;
            }
          }
        }
      }

      yield { done: true };
    } catch (error) {
      logger.error('OllamaProvider.streamChat failed', { error });
      throw error;
    }
  }

  getName(): string {
    return 'ollama';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch (error) {
      logger.warn('OllamaProvider availability check failed', { error });
      return false;
    }
  }

  /**
   * Build prompt that instructs model to output function calls in JSON format
   */
  private buildFunctionsPrompt(functions: ChatOptions['functions']): string {
    const functionsDesc = functions!.map(fn =>
      `${fn.name}: ${fn.description}\nParameters: ${JSON.stringify(fn.parameters)}`
    ).join('\n\n');

    return `You are a helpful assistant with access to functions. When you need to call a function, output ONLY a JSON object in this exact format:
{
  "function": "function_name",
  "arguments": { "arg1": "value1", "arg2": "value2" }
}

Available functions:
${functionsDesc}

If you're just responding (not calling a function), output normal text.`;
  }

  /**
   * Extract function call from model response
   * Looks for JSON object with "function" and "arguments" fields
   */
  private extractFunctionCall(content: string): FunctionCall | undefined {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return undefined;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.function && parsed.arguments) {
        return {
          name: parsed.function,
          arguments: JSON.stringify(parsed.arguments)
        };
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
