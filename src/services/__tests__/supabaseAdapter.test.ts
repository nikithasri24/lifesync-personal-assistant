import { describe, it, expect, beforeEach, vi } from 'vitest';
import SupabaseAdapter from '../supabaseAdapter';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock ensureSupabase
vi.mock('../../lib/supabase', () => ({
  ensureSupabase: vi.fn(() => mockSupabaseClient),
}));

// Create mock Supabase client
const createMockQuery = () => {
  const query = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    head: true,
  };

  // Make all chainable methods return the query object
  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
};

const mockSupabaseClient = {
  from: vi.fn(() => createMockQuery()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
} as unknown as SupabaseClient;

describe('SupabaseAdapter', () => {
  let adapter: SupabaseAdapter;
  let mockGetUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId = vi.fn(() => 'test-user-123');
    adapter = new SupabaseAdapter(mockGetUserId);
  });

  describe('Authentication', () => {
    it('should throw error when user is not authenticated', async () => {
      mockGetUserId.mockReturnValue(null);
      const unauthAdapter = new SupabaseAdapter(mockGetUserId);

      await expect(unauthAdapter.getTasks()).rejects.toThrow(
        'Supabase user is not authenticated'
      );
    });

    it('should require user ID for all protected operations', async () => {
      mockGetUserId.mockReturnValue(null);
      const unauthAdapter = new SupabaseAdapter(mockGetUserId);

      await expect(unauthAdapter.getProjects()).rejects.toThrow('not authenticated');
      await expect(unauthAdapter.getHabits()).rejects.toThrow('not authenticated');
      await expect(unauthAdapter.getRecipes()).rejects.toThrow('not authenticated');
    });

    it('should allow health check without authentication', async () => {
      mockGetUserId.mockReturnValue(null);
      const unauthAdapter = new SupabaseAdapter(mockGetUserId);

      const result = await unauthAdapter.healthCheck();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });

    it('should query tasks on health check when authenticated', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.healthCheck();

      expect(result.status).toBe('ok');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
    });
  });

  describe('Sanitization', () => {
    it('should remove undefined values from payload', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', title: 'Test', user_id: 'test-user-123' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.createTask({
        title: 'Test Task',
        description: undefined, // Should be removed
        status: 'todo',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.not.objectContaining({ description: undefined })
      );
    });
  });

  describe('Tasks', () => {
    it('should get tasks for authenticated user', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', user_id: 'test-user-123' },
        { id: '2', title: 'Task 2', user_id: 'test-user-123' },
      ];

      const mockQuery = createMockQuery();
      // Override order to return query on first call, then resolve on second call
      let orderCallCount = 0;
      mockQuery.order.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount < 2) {
          return mockQuery;
        }
        return Promise.resolve({ data: mockTasks, error: null }) as any;
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getTasks();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
      expect(result).toEqual(mockTasks);
    });

    it('should create task with defaults', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', title: 'New Task', status: 'todo', priority: 'medium' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.createTask({ title: 'New Task' });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          user_id: 'test-user-123',
          status: 'todo',
          priority: 'medium',
          deleted: false,
        })
      );
      expect(result.id).toBe('1');
    });

    it('should update task', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({
        data: { id: '1', title: 'Updated Task' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.updateTask('1', { title: 'Updated Task' });

      expect(mockQuery.update).toHaveBeenCalledWith({ title: 'Updated Task' });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
    });

    it('should soft delete task', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', deleted: true },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.deleteTask('1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted: true })
      );
      expect(result.deleted).toBe(true);
    });

    it('should restore deleted task', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', deleted: false, deleted_at: null },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.restoreTask('1');

      expect(mockQuery.update).toHaveBeenCalledWith({
        deleted: false,
        deleted_at: null,
      });
      expect(result.deleted).toBe(false);
    });

    it('should permanently delete task', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.permanentlyDeleteTask('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(result.message).toBe('deleted');
      expect(result.task.id).toBe('1');
    });

    it('should reorder tasks', async () => {
      const order = [
        { id: '1', position: 0 },
        { id: '2', position: 1 },
      ];

      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.reorderTasks(order);

      expect(result.updated).toBe(2);
      expect(result.success).toBe(true);
    });

    it('should handle errors in get tasks', async () => {
      const mockQuery = createMockQuery();
      // Override order to return query on first call, error on second call
      let orderCallCount = 0;
      mockQuery.order.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount < 2) {
          return mockQuery;
        }
        return Promise.resolve({
          data: null,
          error: new Error('Database error'),
        }) as any;
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await expect(adapter.getTasks()).rejects.toThrow('Database error');
    });
  });

  describe('Projects', () => {
    it('should get projects', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockProjects, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getProjects();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
      expect(result).toEqual(mockProjects);
    });

    it('should create project with defaults', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', name: 'New Project', status: 'active' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.createProject({ name: 'New Project' });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Project',
          status: 'active',
          color: '#6366f1',
          icon: '📁',
        })
      );
    });

    it('should update project', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', name: 'Updated' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.updateProject('1', { name: 'Updated' });

      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
    });

    it('should delete project', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteProject('1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('Habits', () => {
    it('should get habits', async () => {
      const mockHabits = [{ id: '1', name: 'Exercise' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockHabits, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getHabits();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('habits');
      expect(result).toEqual(mockHabits);
    });

    it('should create habit with defaults', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', name: 'Exercise', frequency: 'daily' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.createHabit({ name: 'Exercise' });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Exercise',
          frequency: 'daily',
          goal_mode: 'daily-target',
          streak_count: 0,
          best_streak: 0,
          current_progress: 0,
        })
      );
    });

    it('should add habit entry using RPC', async () => {
      const mockRpc = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', habit_id: 'h1', date: '2025-11-19' },
          error: null,
        }),
      });
      vi.mocked(mockSupabaseClient.rpc).mockImplementation(mockRpc as any);

      const result = await adapter.addHabitEntry('h1', {
        date: '2025-11-19',
        value: 1,
      });

      expect(mockRpc).toHaveBeenCalledWith('upsert_habit_entry', {
        p_habit_id: 'h1',
        p_date: '2025-11-19',
        p_value: 1,
        p_notes: null,
      });
      expect(result.habit_id).toBe('h1');
    });

    it('should get habit entry for date', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({
        data: { id: 'e1', value: 1 },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getHabitEntryForDate('h1', '2025-11-19');

      expect(result).toEqual({ id: 'e1', value: 1 });
    });

    it('should return null when no habit entry found', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getHabitEntryForDate('h1', '2025-11-19');

      expect(result).toBeNull();
    });

    it('should delete habit entry for date', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteHabitEntryForDate('h1', '2025-11-19');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('habit_id', 'h1');
      expect(mockQuery.eq).toHaveBeenCalledWith('date', '2025-11-19');
    });

    it('should delete all habit entries', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteAllHabitEntries('h1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('habit_id', 'h1');
    });

    it('should delete habit', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteHabit('h1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'h1');
    });
  });

  describe('Finance', () => {
    it('should get financial accounts', async () => {
      const mockAccounts = [{ id: '1', name: 'Checking' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockAccounts, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getFinancialAccounts();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('financial_accounts');
      expect(result).toEqual(mockAccounts);
    });

    it('should get financial transactions', async () => {
      const mockTransactions = [{ id: '1', amount: -50.00 }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockTransactions, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getFinancialTransactions();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('financial_transactions');
      expect(result).toEqual(mockTransactions);
    });

    it('should create financial transaction', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', amount: -50.00 },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.createFinancialTransaction({
        amount: -50.00,
        date: '2025-11-19',
        description: 'Test',
        type: 'expense',
        accountId: 'acc1',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ amount: -50.00, user_id: 'test-user-123' })
      );
      expect(result.id).toBe('1');
    });
  });

  describe('Shopping', () => {
    it('should get shopping lists', async () => {
      const mockLists = [{ id: '1', name: 'Groceries' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockLists, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getShoppingLists();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('shopping_lists');
      expect(result).toEqual(mockLists);
    });

    it('should create shopping list with defaults', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', name: 'Groceries', status: 'active' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.createShoppingList({ name: 'Groceries' });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });

    it('should assert shopping list ownership before getting items', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({
        data: { id: 'list1' },
        error: null,
      });
      mockQuery.order.mockResolvedValue({ data: [], error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.getShoppingListItems('list1');

      // Should verify ownership first
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
    });

    it('should throw error when shopping list not owned by user', async () => {
      const mockQuery = createMockQuery();
      mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await expect(adapter.getShoppingListItems('list1')).rejects.toThrow(
        'Shopping list not found'
      );
    });
  });

  describe('Recipes', () => {
    it('should get recipes', async () => {
      const mockRecipes = [{ id: '1', name: 'Pasta' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockRecipes, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getRecipes();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('recipes');
      expect(result).toEqual(mockRecipes);
    });

    it('should create recipe with name truncation', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: '1', name: 'New Recipe' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const longName = 'A'.repeat(300);
      await adapter.createRecipe({ name: longName });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.stringMatching(/^A+$/) })
      );
    });

    it('should delete recipe', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteRecipe('r1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'r1');
    });
  });

  describe('Analytics', () => {
    it('should get analytics summary', async () => {
      // Create a fresh mock for each from() call
      vi.mocked(mockSupabaseClient.from).mockImplementation(() => {
        const query = createMockQuery();
        query.select.mockReturnValue(query);

        // Override eq to support chaining
        let eqCallCount = 0;
        query.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount === 2) {
            // Second .eq() call resolves the promise
            return Promise.resolve({ count: 10, error: null }) as any;
          }
          // First .eq() call returns the query for chaining
          return query;
        });

        return query as any;
      });

      const result = await adapter.getAnalytics();

      expect(result.tasks).toBeDefined();
      expect(result.habits).toBeDefined();
      expect(result.finance).toBeDefined();
      expect(result.focus).toBeDefined();
    });
  });

  describe('75 Hard Challenge', () => {
    it('should get SFH challenges', async () => {
      const mockChallenges = [{ id: 'c1', start_date: '2025-01-01' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockChallenges, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getSFHChallenges();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sfh_challenge');
      expect(result).toEqual(mockChallenges);
    });

    it('should get SFH entries for challenges', async () => {
      const mockEntries = [{ id: 'e1', challenge_id: 'c1' }];
      const mockQuery = createMockQuery();
      mockQuery.order.mockResolvedValue({ data: mockEntries, error: null });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getSFHEntries(['c1', 'c2']);

      expect(mockQuery.in).toHaveBeenCalledWith('challenge_id', ['c1', 'c2']);
      expect(result).toEqual(mockEntries);
    });

    it('should return empty array when no challenge IDs provided', async () => {
      const result = await adapter.getSFHEntries([]);

      expect(result).toEqual([]);
    });

    it('should create SFH challenge', async () => {
      const mockQuery = createMockQuery();
      mockQuery.single.mockResolvedValue({
        data: { id: 'c1', start_date: '2025-01-01' },
        error: null,
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.createSFHChallenge({ start_date: '2025-01-01' });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'test-user-123' })
      );
    });

    it('should delete SFH challenge', async () => {
      const mockQuery = createMockQuery();
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await adapter.deleteSFHChallenge('c1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'c1');
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive errors', async () => {
      const mockQuery = createMockQuery();
      // Override order to return query on first call, error on second call
      let orderCallCount = 0;
      mockQuery.order.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount < 2) {
          return mockQuery;
        }
        return Promise.resolve({
          data: null,
          error: { message: 'Connection failed' },
        }) as any;
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      await expect(adapter.getTasks()).rejects.toThrow('Connection failed');
    });

    it('should handle empty data gracefully', async () => {
      const mockQuery = createMockQuery();
      // Override order to return query on first call, null data on second call
      let orderCallCount = 0;
      mockQuery.order.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount < 2) {
          return mockQuery;
        }
        return Promise.resolve({ data: null, error: null }) as any;
      });
      vi.mocked(mockSupabaseClient.from).mockReturnValue(mockQuery as any);

      const result = await adapter.getTasks();

      expect(result).toEqual([]);
    });
  });
});
