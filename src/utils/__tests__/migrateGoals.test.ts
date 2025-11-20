import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { migrateGoals, isMigrationComplete, resetMigrationFlag } from '../migrateGoals';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('migrateGoals', () => {
  const mockUser = { id: 'test-user-goals' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isMigrationComplete', () => {
    it('should return false when migration flag not set', () => {
      expect(isMigrationComplete()).toBe(false);
    });

    it('should return true when migration flag is set', () => {
      localStorage.setItem('goals_dreams_migrated', 'true');
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('resetMigrationFlag', () => {
    it('should remove migration flag from localStorage', () => {
      localStorage.setItem('goals_dreams_migrated', 'true');
      resetMigrationFlag();
      expect(localStorage.getItem('goals_dreams_migrated')).toBeNull();
    });
  });

  describe('migrateGoals', () => {
    it('should skip migration if already completed', async () => {
      localStorage.setItem('goals_dreams_migrated', 'true');

      const result = await migrateGoals();

      expect(result).toEqual({
        success: true,
        goalsMigrated: 0,
        dreamsMigrated: 0,
        errors: 0,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should skip migration if user not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      const result = await migrateGoals();

      expect(result).toEqual({
        success: false,
        goalsMigrated: 0,
        dreamsMigrated: 0,
        errors: 0,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should complete migration when no data to migrate', async () => {
      const result = await migrateGoals();

      expect(result).toEqual({
        success: true,
        goalsMigrated: 0,
        dreamsMigrated: 0,
        errors: 0,
      });
      expect(localStorage.getItem('goals_dreams_migrated')).toBe('true');
    });

    it('should migrate goals from localStorage to Supabase', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Learn TypeScript',
          description: 'Complete advanced TypeScript course',
          category: 'learning',
          targetDate: new Date('2025-12-31'),
          status: 'active',
          progress: 30,
          priority: 'high',
          createdAt: new Date('2025-10-01'),
        },
        {
          id: 'goal-2',
          title: 'Run 5K',
          description: 'Complete a 5K run',
          category: 'health',
          status: 'active',
          progress: 50,
          priority: 'medium',
          createdAt: new Date('2025-09-15'),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: mockGoals,
            dreams: [],
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateGoals();

      expect(result.success).toBe(true);
      expect(result.goalsMigrated).toBe(2);
      expect(result.dreamsMigrated).toBe(0);
      expect(result.errors).toBe(0);
      expect(mockFrom).toHaveBeenCalledWith('goals');
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('goals_dreams_migrated')).toBe('true');
    });

    it('should migrate dreams from localStorage to Supabase', async () => {
      const mockDreams = [
        {
          id: 'dream-1',
          title: 'Visit Japan',
          description: 'See cherry blossoms in spring',
          category: 'travel',
          notes: 'Save $5000 for trip',
          createdAt: new Date('2025-08-01'),
          lastUpdated: new Date('2025-11-10'),
        },
        {
          id: 'dream-2',
          title: 'Write a Book',
          description: 'Complete a fiction novel',
          category: 'creative',
          notes: 'Start with outline',
          createdAt: new Date('2025-07-15'),
          lastUpdated: new Date('2025-11-15'),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: [],
            dreams: mockDreams,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateGoals();

      expect(result.success).toBe(true);
      expect(result.goalsMigrated).toBe(0);
      expect(result.dreamsMigrated).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockFrom).toHaveBeenCalledWith('dreams');
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should migrate both goals and dreams together', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Learn React',
          status: 'active',
          progress: 0,
          priority: 'medium',
          createdAt: new Date('2025-10-01'),
        },
      ];

      const mockDreams = [
        {
          id: 'dream-1',
          title: 'Travel the World',
          createdAt: new Date('2025-09-01'),
          lastUpdated: new Date('2025-09-01'),
          notes: '',
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: mockGoals,
            dreams: mockDreams,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateGoals();

      expect(result.success).toBe(true);
      expect(result.goalsMigrated).toBe(1);
      expect(result.dreamsMigrated).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should handle goal migration errors', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Test Goal',
          status: 'active',
          progress: 0,
          priority: 'medium',
          createdAt: new Date('2025-10-01'),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: mockGoals,
            dreams: [],
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateGoals();

      expect(result.success).toBe(false);
      expect(result.goalsMigrated).toBe(0);
      expect(result.errors).toBe(1);
      expect(localStorage.getItem('goals_dreams_migrated')).toBe('true');
    });

    it('should preserve original timestamps for goals', async () => {
      const createdDate = new Date('2025-09-01T10:00:00Z');
      const targetDate = new Date('2025-12-31');

      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Test Goal',
          targetDate,
          status: 'active',
          progress: 25,
          priority: 'high',
          createdAt: createdDate,
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: mockGoals,
            dreams: [],
          },
        })
      );

      let capturedInsertData: any;
      const mockInsert = vi.fn().mockImplementation((data) => {
        capturedInsertData = data;
        return Promise.resolve({ error: null });
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      await migrateGoals();

      expect(capturedInsertData).toBeDefined();
      expect(capturedInsertData.created_at).toBe(createdDate.toISOString());
      expect(capturedInsertData.target_date).toBe('2025-12-31');
    });

    it('should preserve original timestamps for dreams', async () => {
      const createdDate = new Date('2025-08-01T14:30:00Z');
      const updatedDate = new Date('2025-11-10T16:45:00Z');

      const mockDreams = [
        {
          id: 'dream-1',
          title: 'Test Dream',
          createdAt: createdDate,
          lastUpdated: updatedDate,
          notes: '',
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: [],
            dreams: mockDreams,
          },
        })
      );

      let capturedInsertData: any;
      const mockInsert = vi.fn().mockImplementation((data) => {
        capturedInsertData = data;
        return Promise.resolve({ error: null });
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      await migrateGoals();

      expect(capturedInsertData).toBeDefined();
      expect(capturedInsertData.created_at).toBe(createdDate.toISOString());
      expect(capturedInsertData.last_updated).toBe(updatedDate.toISOString());
    });

    it('should handle goals with optional fields', async () => {
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Minimal Goal',
          // No description, category, or targetDate
          status: 'active',
          progress: 0,
          priority: 'medium',
          createdAt: new Date('2025-10-01'),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            goals: mockGoals,
            dreams: [],
          },
        })
      );

      let capturedInsertData: any;
      const mockInsert = vi.fn().mockImplementation((data) => {
        capturedInsertData = data;
        return Promise.resolve({ error: null });
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      await migrateGoals();

      expect(capturedInsertData.description).toBeNull();
      expect(capturedInsertData.category).toBeNull();
      expect(capturedInsertData.target_date).toBeNull();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('app-storage', 'invalid json{{{');

      const result = await migrateGoals();

      expect(result.success).toBe(true);
      expect(result.goalsMigrated).toBe(0);
      expect(result.dreamsMigrated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle missing goals/dreams arrays in localStorage', async () => {
      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            // goals and dreams arrays are missing
          },
        })
      );

      const result = await migrateGoals();

      expect(result.success).toBe(true);
      expect(result.goalsMigrated).toBe(0);
      expect(result.dreamsMigrated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
