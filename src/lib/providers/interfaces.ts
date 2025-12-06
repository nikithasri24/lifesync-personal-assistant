/**
 * Provider Interfaces
 *
 * All external services abstracted behind these interfaces
 * Allows easy swapping between free and paid services
 */

// ==================== LLM Provider ====================

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string; // JSON string
}

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  functions?: FunctionDefinition[];
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  functionCall?: FunctionCall;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatChunk {
  content?: string;
  done: boolean;
}

export interface LLMProvider {
  /**
   * Send a chat completion request
   */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Stream a chat completion (for real-time responses)
   */
  streamChat(messages: Message[], options?: ChatOptions): AsyncIterable<ChatChunk>;

  /**
   * Get provider name (for logging/debugging)
   */
  getName(): string;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

// ==================== Vector Store Provider ====================

export interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface VectorStoreProvider {
  /**
   * Insert or update vectors
   */
  upsert(vectors: Vector[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  search(query: number[], limit: number, filter?: Record<string, unknown>): Promise<SearchResult[]>;

  /**
   * Delete vectors by IDs
   */
  delete(ids: string[]): Promise<void>;

  /**
   * Get vector by ID
   */
  get(id: string): Promise<Vector | null>;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== Embedding Provider ====================

export interface EmbeddingProvider {
  /**
   * Generate embedding for text
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * Get embedding dimension
   */
  getDimension(): number;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== Email Provider ====================

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  attachments?: EmailAttachment[];
  labels?: string[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  data?: ArrayBuffer; // Loaded on demand
}

export interface EmailFilter {
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  labels?: string[];
  since?: Date;
  before?: Date;
}

export interface EmailProvider {
  /**
   * Fetch recent emails
   */
  getRecent(filter?: EmailFilter, limit?: number): Promise<Email[]>;

  /**
   * Get email by ID
   */
  getById(id: string): Promise<Email | null>;

  /**
   * Send email
   */
  send(to: string, subject: string, body: string, attachments?: EmailAttachment[]): Promise<void>;

  /**
   * Mark email as read
   */
  markRead(id: string): Promise<void>;

  /**
   * Add label to email
   */
  addLabel(id: string, label: string): Promise<void>;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== Storage Provider ====================

export interface StorageProvider {
  /**
   * Upload file
   */
  upload(path: string, data: ArrayBuffer | Blob, contentType?: string): Promise<string>;

  /**
   * Download file
   */
  download(path: string): Promise<ArrayBuffer>;

  /**
   * Delete file
   */
  delete(path: string): Promise<void>;

  /**
   * Get signed URL for temporary access
   */
  getSignedUrl(path: string, expiresIn: number): Promise<string>;

  /**
   * List files in directory
   */
  list(prefix: string): Promise<string[]>;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== Notification Provider ====================

export interface Notification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationProvider {
  /**
   * Send notification to user
   */
  send(userId: string, notification: Notification): Promise<void>;

  /**
   * Subscribe user to notifications
   */
  subscribe(userId: string, subscription: PushSubscription): Promise<void>;

  /**
   * Unsubscribe user from notifications
   */
  unsubscribe(userId: string): Promise<void>;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== Calendar Provider ====================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // Minutes before event
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface CalendarProvider {
  /**
   * Get events in date range
   */
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;

  /**
   * Create event
   */
  createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;

  /**
   * Update event
   */
  updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;

  /**
   * Delete event
   */
  deleteEvent(id: string): Promise<void>;

  /**
   * Get provider name
   */
  getName(): string;
}

// ==================== OCR Provider ====================

export interface OCRResult {
  text: string;
  confidence: number;
  blocks?: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRProvider {
  /**
   * Extract text from image
   */
  extractText(image: ArrayBuffer | Blob): Promise<OCRResult>;

  /**
   * Get provider name
   */
  getName(): string;
}
