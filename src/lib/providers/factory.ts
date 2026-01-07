/**
 * Provider Factory
 *
 * Creates provider instances based on environment configuration
 * Handles fallback logic and provider selection
 */

import type { LLMProvider } from './interfaces';
import { GroqProvider } from './llm/groq.provider';
import { OllamaProvider } from './llm/ollama.provider';
import { logger } from '../../services/logger';

// Provider configuration from environment
const LLM_PROVIDER = (import.meta.env.VITE_LLM_PROVIDER as string | undefined) ?? 'groq';
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string | undefined) ?? (import.meta.env.GROQ_API_KEY as string | undefined);
const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined) ?? 'http://localhost:11434';
const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'llama3.2';

/**
 * Create LLM provider with automatic fallback
 *
 * Priority:
 * 1. Configured provider (VITE_LLM_PROVIDER)
 * 2. Groq (if API key available)
 * 3. Ollama (if running locally)
 * 4. Error if none available
 */
export async function createLLMProvider(): Promise<LLMProvider> {
  logger.info('LLM', 'Creating LLM provider', { preferredProvider: LLM_PROVIDER });

  // Try configured provider first
  if (LLM_PROVIDER === 'groq' && GROQ_API_KEY) {
    const groq = new GroqProvider(GROQ_API_KEY);
    const available = await groq.isAvailable();

    if (available) {
      logger.info('LLM', 'Using Groq LLM provider');
      return groq;
    }

    logger.warn('LLM', 'Groq provider not available, trying fallback');
  }

  if (LLM_PROVIDER === 'ollama') {
    const ollama = new OllamaProvider(OLLAMA_BASE_URL, OLLAMA_MODEL);
    const available = await ollama.isAvailable();

    if (available) {
      logger.info('LLM', 'Using Ollama LLM provider');
      return ollama;
    }

    logger.warn('LLM', 'Ollama provider not available');
  }

  // Try fallbacks
  logger.info('LLM', 'Trying fallback providers');

  // Try Groq as fallback (if not already tried)
  if (LLM_PROVIDER !== 'groq' && GROQ_API_KEY) {
    const groq = new GroqProvider(GROQ_API_KEY);
    const available = await groq.isAvailable();

    if (available) {
      logger.info('LLM', 'Using Groq as fallback provider');
      return groq;
    }
  }

  // Try Ollama as fallback (if not already tried)
  if (LLM_PROVIDER !== 'ollama') {
    const ollama = new OllamaProvider(OLLAMA_BASE_URL, OLLAMA_MODEL);
    const available = await ollama.isAvailable();

    if (available) {
      logger.info('LLM', 'Using Ollama as fallback provider');
      return ollama;
    }
  }

  throw new Error(
    'No LLM provider available. Please configure GROQ_API_KEY or install Ollama.'
  );
}

/**
 * Create LLM provider with manual fallback handling
 *
 * Returns primary provider with a fallback provider
 * Useful for handling rate limits gracefully
 */
export async function createLLMProviderWithFallback(): Promise<{
  primary: LLMProvider;
  fallback?: LLMProvider;
}> {
  logger.info('LLM', 'Creating LLM provider with fallback');

  let primary: LLMProvider | undefined;
  let fallback: LLMProvider | undefined;

  // Set up Groq as primary if available
  if (GROQ_API_KEY) {
    const groq = new GroqProvider(GROQ_API_KEY);
    if (await groq.isAvailable()) {
      primary = groq;
      logger.info('LLM', 'Primary provider: Groq');
    }
  }

  // Set up Ollama as fallback if available
  const ollama = new OllamaProvider(OLLAMA_BASE_URL, OLLAMA_MODEL);
  if (await ollama.isAvailable()) {
    if (!primary) {
      primary = ollama;
      logger.info('LLM', 'Primary provider: Ollama (no Groq available)');
    } else {
      fallback = ollama;
      logger.info('LLM', 'Fallback provider: Ollama');
    }
  }

  if (!primary) {
    throw new Error(
      'No LLM provider available. Please configure GROQ_API_KEY or install Ollama.'
    );
  }

  return { primary, fallback };
}

/**
 * Smart chat function that automatically retries with fallback provider
 */
export async function smartChat(
  messages: Parameters<LLMProvider['chat']>[0],
  options?: Parameters<LLMProvider['chat']>[1]
): Promise<ReturnType<LLMProvider['chat']>> {
  const { primary, fallback } = await createLLMProviderWithFallback();

  try {
    return await primary.chat(messages, options);
  } catch (error) {
    logger.warn('LLM', 'Primary LLM provider failed, trying fallback', { error });

    if (!fallback) {
      throw error;
    }

    try {
      return await fallback.chat(messages, options);
    } catch (fallbackError) {
      logger.error('LLM', 'Fallback LLM provider also failed', { fallbackError });
      throw fallbackError;
    }
  }
}
