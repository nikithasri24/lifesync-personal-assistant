import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { migrateNotes, isMigrationComplete, resetMigrationFlag } from '../migrateNotes';
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

describe('migrateNotes', () => {
  const mockUser = { id: 'test-user-notes' };

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
      localStorage.setItem('notes_migrated', 'true');
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('resetMigrationFlag', () => {
    it('should remove migration flag from localStorage', () => {
      localStorage.setItem('notes_migrated', 'true');
      resetMigrationFlag();
      expect(localStorage.getItem('notes_migrated')).toBeNull();
    });
  });

  describe('migrateNotes', () => {
    it('should skip migration if already completed', async () => {
      localStorage.setItem('notes_migrated', 'true');

      const result = await migrateNotes();

      expect(result).toEqual({
        success: true,
        migrated: 0,
        errors: 0,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should skip migration if user not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      const result = await migrateNotes();

      expect(result).toEqual({
        success: false,
        migrated: 0,
        errors: 0,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should complete migration when no data to migrate', async () => {
      const result = await migrateNotes();

      expect(result).toEqual({
        success: true,
        migrated: 0,
        errors: 0,
      });
      expect(localStorage.getItem('notes_migrated')).toBe('true');
    });

    it('should migrate notes from localStorage to Supabase', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Meeting Notes',
          content: 'Discussed project timeline',
          tags: ['work', 'meeting'],
          category: 'work',
          createdAt: new Date('2025-11-10').toISOString(),
          updatedAt: new Date('2025-11-12').toISOString(),
        },
        {
          id: 'note-2',
          title: 'Shopping List',
          content: 'Milk, eggs, bread',
          tags: ['personal'],
          category: 'personal',
          createdAt: new Date('2025-11-14').toISOString(),
          updatedAt: new Date('2025-11-14').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            notes: mockNotes,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateNotes();

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockFrom).toHaveBeenCalledWith('notes');
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('notes_migrated')).toBe('true');
    });

    it('should handle migration errors gracefully', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note',
          content: 'Content',
          tags: [],
          createdAt: new Date('2025-11-15').toISOString(),
          updatedAt: new Date('2025-11-15').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            notes: mockNotes,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateNotes();

      expect(result.success).toBe(false);
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(1);
      // Migration still marks as complete to avoid infinite retries
      expect(localStorage.getItem('notes_migrated')).toBe('true');
    });

    it('should preserve original timestamps when migrating', async () => {
      const createdDate = new Date('2025-10-01T09:00:00Z');
      const updatedDate = new Date('2025-11-01T15:30:00Z');

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note',
          content: 'Content',
          tags: [],
          createdAt: createdDate.toISOString(),
          updatedAt: updatedDate.toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            notes: mockNotes,
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

      await migrateNotes();

      expect(capturedInsertData).toBeDefined();
      expect(capturedInsertData.created_at).toBe(createdDate.toISOString());
      expect(capturedInsertData.updated_at).toBe(updatedDate.toISOString());
    });

    it('should handle notes with optional fields', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'Just content, no title or category',
          tags: [],
          createdAt: new Date('2025-11-15').toISOString(),
          updatedAt: new Date('2025-11-15').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            notes: mockNotes,
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

      const result = await migrateNotes();

      expect(result.success).toBe(true);
      expect(capturedInsertData.title).toBeNull();
      expect(capturedInsertData.category).toBeNull();
      expect(capturedInsertData.tags).toEqual([]);
    });

    it('should handle tags array correctly', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Tagged Note',
          content: 'Content',
          tags: ['important', 'urgent', 'follow-up'],
          createdAt: new Date('2025-11-15').toISOString(),
          updatedAt: new Date('2025-11-15').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            notes: mockNotes,
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

      await migrateNotes();

      expect(capturedInsertData.tags).toEqual(['important', 'urgent', 'follow-up']);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('app-storage', 'corrupted json{{{');

      const result = await migrateNotes();

      // Should not throw, should return empty migration
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle missing notes array in localStorage', async () => {
      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            // notes array is missing
          },
        })
      );

      const result = await migrateNotes();

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
