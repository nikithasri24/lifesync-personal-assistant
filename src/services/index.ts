// Services Barrel Exports
// Centralized exports for all service modules

export * from './api';
export * from './conversationEngine';
export * from './expenseCategorizationEngine';
export * from './logger';
export * from './types';

// Note: apiClient, supabaseAdapter, and database have been deprecated.
// Use the API layer (src/api/) for all database operations.
// Use the API layer (src/api/*.ts) for data access instead.
