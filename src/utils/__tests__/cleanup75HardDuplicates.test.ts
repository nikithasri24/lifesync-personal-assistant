import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cleanup75HardDuplicates } from '../cleanup75HardDuplicates';
import { useAppStore } from '../../stores/useAppStore';

// Mock the store
vi.mock('../../stores/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(),
  },
}));

describe('cleanup75HardDuplicates', () => {
  let mockDeleteTodo: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockDeleteTodo = vi.fn().mockResolvedValue(undefined);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('No 75 Hard tasks', () => {
    it('should handle empty todos array', async () => {
      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos: [],
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ No 75 Hard tasks found');
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });

    it('should handle todos without 75hard tag', async () => {
      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos: [
          { id: '1', title: 'Regular task', tags: ['work'] },
          { id: '2', title: 'Another task', tags: ['personal'] },
        ],
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ No 75 Hard tasks found');
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });
  });

  describe('No duplicates', () => {
    it('should keep all unique 75 Hard tasks', async () => {
      const todos = [
        {
          id: '1',
          title: 'Workout 1',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Workout 2',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout2'],
        },
        {
          id: '3',
          title: 'Read',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-read'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 total 75 Hard todos'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicates: 0'));
      expect(consoleLogSpy).toHaveBeenCalledWith('\n✅ No duplicates to clean up!');
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });
  });

  describe('With duplicates', () => {
    it('should identify and delete duplicate tasks', async () => {
      const todos = [
        {
          id: '1',
          title: 'Workout 1 - First',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Workout 1 - Duplicate',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '3',
          title: 'Read - Unique',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-read'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 total 75 Hard todos'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicates: 1'));
      expect(mockDeleteTodo).toHaveBeenCalledTimes(1);
      expect(mockDeleteTodo).toHaveBeenCalledWith('2');
    });

    it('should keep the first occurrence and delete subsequent duplicates', async () => {
      const todos = [
        {
          id: '1',
          title: 'First occurrence',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Second occurrence',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '3',
          title: 'Third occurrence',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Keeping: "First occurrence"');
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️  Duplicate: "Second occurrence"');
      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️  Duplicate: "Third occurrence"');
      expect(mockDeleteTodo).toHaveBeenCalledTimes(2);
      expect(mockDeleteTodo).toHaveBeenCalledWith('2');
      expect(mockDeleteTodo).toHaveBeenCalledWith('3');
    });

    it('should handle multiple sets of duplicates', async () => {
      const todos = [
        // Workout1 duplicates
        {
          id: '1',
          title: 'Workout 1 - First',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Workout 1 - Duplicate',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        // Read duplicates
        {
          id: '3',
          title: 'Read - First',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-read'],
        },
        {
          id: '4',
          title: 'Read - Duplicate',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-read'],
        },
        // Unique task
        {
          id: '5',
          title: 'Water - Unique',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-water'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicates: 2'));
      expect(mockDeleteTodo).toHaveBeenCalledTimes(2);
      expect(mockDeleteTodo).toHaveBeenCalledWith('2');
      expect(mockDeleteTodo).toHaveBeenCalledWith('4');
    });
  });

  describe('Edge cases', () => {
    it('should handle tasks with missing tags', async () => {
      const todos = [
        {
          id: '1',
          title: 'Valid task',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Missing day tag',
          tags: ['75hard', '75hard:challenge-1', '75hard:task-workout1'],
        },
        {
          id: '3',
          title: 'Missing task tag',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      // Only the valid task should be counted
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 1'));
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });

    it('should handle tags as non-array', async () => {
      const todos = [
        {
          id: '1',
          title: 'Task without array tags',
          tags: '75hard', // Not an array
        },
        {
          id: '2',
          title: 'Valid task',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      // Should handle non-array tags gracefully
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 1'));
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });

    it('should handle different challenges as separate', async () => {
      const todos = [
        {
          id: '1',
          title: 'Challenge 1 - Day 1 - Workout',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Challenge 2 - Day 1 - Workout',
          tags: ['75hard', '75hard:challenge-2', '75hard:day-1', '75hard:task-workout1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      // Different challenges should be considered unique
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicates: 0'));
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });

    it('should handle different days as separate', async () => {
      const todos = [
        {
          id: '1',
          title: 'Day 1 - Workout',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Day 2 - Workout',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-2', '75hard:task-workout1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      // Different days should be considered unique
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Unique: 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicates: 0'));
      expect(mockDeleteTodo).not.toHaveBeenCalled();
    });
  });

  describe('Console output', () => {
    it('should log summary statistics', async () => {
      const todos = [
        {
          id: '1',
          title: 'Task 1',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Task 2 - Duplicate',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
      ];

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      expect(consoleLogSpy).toHaveBeenCalledWith('🧹 Starting cleanup of duplicate 75 Hard tasks...');
      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Found 2 total 75 Hard todos');
      expect(consoleLogSpy).toHaveBeenCalledWith('\n📊 Summary:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Total: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Unique: 1');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Duplicates: 1');
      expect(consoleLogSpy).toHaveBeenCalledWith('\n🗑️  Deleting 1 duplicates...');
      expect(consoleLogSpy).toHaveBeenCalledWith('\n✅ Cleanup complete!');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Deleted 1 duplicate todos');
      expect(consoleLogSpy).toHaveBeenCalledWith('   Kept 1 unique todos');
    });
  });

  describe('Async deletion', () => {
    it('should wait for all deletions to complete', async () => {
      const todos = [
        {
          id: '1',
          title: 'Task 1',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '2',
          title: 'Duplicate 1',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
        {
          id: '3',
          title: 'Duplicate 2',
          tags: ['75hard', '75hard:challenge-1', '75hard:day-1', '75hard:task-workout1'],
        },
      ];

      const deletePromises: Promise<void>[] = [];
      mockDeleteTodo = vi.fn().mockImplementation((_id: string) => {
        const promise = new Promise<void>((resolve) => setTimeout(resolve, 10));
        deletePromises.push(promise);
        return promise;
      });

      (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        todos,
        deleteTodo: mockDeleteTodo,
      });

      await cleanup75HardDuplicates();

      // All deletions should be awaited
      expect(mockDeleteTodo).toHaveBeenCalledTimes(2);
      await Promise.all(deletePromises);
    });
  });
});
