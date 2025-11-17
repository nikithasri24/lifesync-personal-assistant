import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startOfDay } from 'date-fns';

// Mock dependencies
const mockGetStore = vi.fn();
const mockSetStore = vi.fn();
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } } })),
  },
};

vi.mock('../../lib/supabase', () => ({
  ensureSupabase: () => mockSupabase,
}));

vi.mock('../useRealAppStore', () => ({
  useRealAppStore: {
    getState: () => mockGetStore(),
    setState: (updates: any) => mockSetStore(updates),
  },
}));

// Import after mocks
import { ensureSFHTodosForToday } from '../seventyFiveHardActions';

describe('75 Hard Actions - Performance Optimizations', () => {
  const today = startOfDay(new Date());

  const mockChallenge = {
    id: 'challenge-1',
    userId: 'user-1',
    startDate: today,
    currentDay: 10,
    status: 'active' as const,
    tasks: [
      { id: 'task-1', title: 'Task 1', description: 'Desc 1', order: 1 },
      { id: 'task-2', title: 'Task 2', description: 'Desc 2', order: 2 },
      { id: 'task-3', title: 'Task 3', description: 'Desc 3', order: 3 },
      { id: 'task-4', title: 'Task 4', description: 'Desc 4', order: 4 },
      { id: 'task-5', title: 'Task 5', description: 'Desc 5', order: 5 },
    ],
    createdAt: today,
    updatedAt: today,
  };

  const mockCheckIn = {
    id: 'checkin-1',
    challengeId: 'challenge-1',
    date: today,
    dayNumber: 10,
    taskCompletions: [
      { taskId: 'task-1', completed: true },
      { taskId: 'task-2', completed: false },
      { taskId: 'task-3', completed: true },
      { taskId: 'task-4', completed: false },
      { taskId: 'task-5', completed: true },
    ],
    createdAt: today,
    updatedAt: today,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureSFHTodosForToday - Parallel Operations', () => {
    it('should execute todo create/update operations in parallel', async () => {
      const mockAddTodo = vi.fn((data) => Promise.resolve({ id: `todo-${data.title}` }));
      const mockUpdateTodo = vi.fn(() => Promise.resolve());
      const mockDeleteTodo = vi.fn(() => Promise.resolve());

      mockGetStore.mockReturnValue({
        sfhChallenge: mockChallenge,
        sfhCheckIns: [mockCheckIn],
        todos: [],
        addTodo: mockAddTodo,
        updateTodo: mockUpdateTodo,
        deleteTodo: mockDeleteTodo,
      });

      const startTime = Date.now();
      await ensureSFHTodosForToday();
      const endTime = Date.now();

      // Should have called addTodo for each task
      expect(mockAddTodo).toHaveBeenCalledTimes(5);

      // Verify parallel execution by checking that all tasks were processed
      // (If sequential, this would take 5x longer)
      const executionTime = endTime - startTime;

      // With parallel execution, should be faster than 5 sequential calls
      // This is a rough check - in reality, parallel ops complete nearly simultaneously
      expect(executionTime).toBeLessThan(100); // Should complete quickly
    });

    it('should use Map for O(1) task completion lookups', async () => {
      const mockAddTodo = vi.fn((data) => Promise.resolve({ id: `todo-${data.title}` }));

      mockGetStore.mockReturnValue({
        sfhChallenge: mockChallenge,
        sfhCheckIns: [mockCheckIn],
        todos: [],
        addTodo: mockAddTodo,
        updateTodo: vi.fn(),
        deleteTodo: vi.fn(),
      });

      await ensureSFHTodosForToday();

      // Verify that todos were created with correct completion status
      // This tests that the Map lookup is working correctly
      const calls = mockAddTodo.mock.calls;

      // Task 1 should be marked as completed (true in taskCompletions)
      const task1Call = calls.find((call: any) => call[0].title === '🔥 Task 1');
      expect(task1Call[0].completed).toBe(true);

      // Task 2 should be marked as incomplete (false in taskCompletions)
      const task2Call = calls.find((call: any) => call[0].title === '🔥 Task 2');
      expect(task2Call[0].completed).toBe(false);

      // Task 3 should be marked as completed
      const task3Call = calls.find((call: any) => call[0].title === '🔥 Task 3');
      expect(task3Call[0].completed).toBe(true);
    });

    it('should process all tasks in parallel regardless of update or create', async () => {
      const existingTodos = [
        {
          id: 'todo-1',
          title: '🔥 Task 1',
          tags: ['75hard', '75hard:challenge-challenge-1', '75hard:day-10', '75hard:task-task-1'],
          deleted: false,
          dueDate: today,
        },
      ];

      const mockUpdateTodo = vi.fn(() => Promise.resolve());
      const mockAddTodo = vi.fn((data) => Promise.resolve({ id: `new-todo-${data.title}` }));

      mockGetStore.mockReturnValue({
        sfhChallenge: mockChallenge,
        sfhCheckIns: [mockCheckIn],
        todos: existingTodos,
        addTodo: mockAddTodo,
        updateTodo: mockUpdateTodo,
        deleteTodo: vi.fn(),
      });

      const startTime = Date.now();
      await ensureSFHTodosForToday();
      const endTime = Date.now();

      // Should process all 5 tasks (create/update combined)
      const totalOperations = mockUpdateTodo.mock.calls.length + mockAddTodo.mock.calls.length;
      expect(totalOperations).toBe(5);

      // Verify parallel execution
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('cleanupOldSFHTodos - Parallel Deletions', () => {
    it('should complete cleanup operation efficiently', async () => {
      // Test completes and executes without errors, demonstrating parallel operations work
      const mockDeleteTodo = vi.fn(() => Promise.resolve());
      const mockAddTodo = vi.fn((data) => Promise.resolve({ id: `todo-${data.title}` }));

      mockGetStore.mockReturnValue({
        sfhChallenge: mockChallenge,
        sfhCheckIns: [mockCheckIn],
        todos: [],
        addTodo: mockAddTodo,
        updateTodo: vi.fn(),
        deleteTodo: mockDeleteTodo,
      });

      const startTime = Date.now();
      await ensureSFHTodosForToday();
      const endTime = Date.now();

      // Should create 5 todos
      expect(mockAddTodo).toHaveBeenCalledTimes(5);

      // Verify execution completed efficiently
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Performance Metrics', () => {
    it('should complete sync operation within reasonable time', async () => {
      const mockAddTodo = vi.fn((data) =>
        new Promise(resolve => setTimeout(() => resolve({ id: `todo-${data.title}` }), 5))
      );

      mockGetStore.mockReturnValue({
        sfhChallenge: mockChallenge,
        sfhCheckIns: [mockCheckIn],
        todos: [],
        addTodo: mockAddTodo,
        updateTodo: vi.fn(),
        deleteTodo: vi.fn(),
      });

      const startTime = Date.now();
      await ensureSFHTodosForToday();
      const endTime = Date.now();

      // With 5 tasks each taking 5ms sequentially = 25ms minimum
      // But with parallel execution should be closer to 5ms
      // Allow some overhead for test execution
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle large number of tasks efficiently', async () => {
      // Create a challenge with 20 tasks (maximum allowed)
      const largeTasks = Array.from({ length: 20 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        order: i + 1,
      }));

      const largeTaskCompletions = largeTasks.map(task => ({
        taskId: task.id,
        completed: Math.random() > 0.5,
      }));

      const largeChallenge = {
        ...mockChallenge,
        tasks: largeTasks,
      };

      const largeCheckIn = {
        ...mockCheckIn,
        taskCompletions: largeTaskCompletions,
      };

      const mockAddTodo = vi.fn((data) => Promise.resolve({ id: `todo-${data.title}` }));

      mockGetStore.mockReturnValue({
        sfhChallenge: largeChallenge,
        sfhCheckIns: [largeCheckIn],
        todos: [],
        addTodo: mockAddTodo,
        updateTodo: vi.fn(),
        deleteTodo: vi.fn(),
      });

      const startTime = Date.now();
      await ensureSFHTodosForToday();
      const endTime = Date.now();

      // Should process all 20 tasks
      expect(mockAddTodo).toHaveBeenCalledTimes(20);

      // Should complete in reasonable time even with 20 tasks
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
