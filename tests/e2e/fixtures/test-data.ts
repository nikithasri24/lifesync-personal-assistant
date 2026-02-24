/**
 * Test Data Generators
 *
 * Provides factory functions for creating test data.
 */

export const testData = {
  /**
   * Generate a test task
   */
  task: (overrides?: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'todo' | 'in-progress' | 'done';
    dueDate?: string;
  }) => ({
    title: `Test Task ${Date.now()}`,
    description: 'Created by automated test',
    priority: 'medium' as const,
    status: 'todo' as const,
    dueDate: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Generate a test habit
   */
  habit: (overrides?: {
    name?: string;
    description?: string;
    frequency?: 'daily' | 'weekly';
    category?: string;
  }) => ({
    name: `Test Habit ${Date.now()}`,
    description: 'Created by automated test',
    frequency: 'daily' as const,
    category: 'health',
    ...overrides,
  }),

  /**
   * Generate a test note
   */
  note: (overrides?: {
    title?: string;
    content?: string;
    tags?: string[];
  }) => ({
    title: `Test Note ${Date.now()}`,
    content: 'This is a test note created by automation',
    tags: ['test'],
    ...overrides,
  }),

  /**
   * Generate a test journal entry
   */
  journalEntry: (overrides?: {
    title?: string;
    content?: string;
    date?: string;
  }) => ({
    title: `Test Journal Entry ${Date.now()}`,
    content: 'This is a test journal entry',
    date: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Generate a test goal
   */
  goal: (overrides?: {
    title?: string;
    description?: string;
    category?: string;
    targetDate?: string;
  }) => ({
    title: `Test Goal ${Date.now()}`,
    description: 'Test goal description',
    category: 'personal',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),

  /**
   * Generate a test shopping item
   */
  shoppingItem: (overrides?: {
    name?: string;
    quantity?: number;
    category?: string;
  }) => ({
    name: `Test Item ${Date.now()}`,
    quantity: 1,
    category: 'groceries',
    ...overrides,
  }),

  /**
   * Generate a test meal
   */
  meal: (overrides?: {
    name?: string;
    date?: string;
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }) => ({
    name: `Test Meal ${Date.now()}`,
    date: new Date().toISOString(),
    mealType: 'dinner' as const,
    ...overrides,
  }),

  /**
   * Generate a test Together message
   */
  togetherMessage: (overrides?: {
    content?: string;
    type?: 'message' | 'milestone' | 'challenge';
  }) => ({
    content: `Test message ${Date.now()}`,
    type: 'message' as const,
    ...overrides,
  }),
};

/**
 * Generate multiple test items
 */
export function generateTestItems<T>(
  generator: () => T,
  count: number
): T[] {
  return Array.from({ length: count }, generator);
}

/**
 * Create unique identifier for test data
 */
export function uniqueId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
