import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { migrateJournalEntries, isMigrationComplete, resetMigrationFlag } from '../migrateJournalEntries';
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

describe('migrateJournalEntries', () => {
  const mockUser = { id: 'test-user-migration' };

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
      localStorage.setItem('journal_entries_migrated', 'true');
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('resetMigrationFlag', () => {
    it('should remove migration flag from localStorage', () => {
      localStorage.setItem('journal_entries_migrated', 'true');
      resetMigrationFlag();
      expect(localStorage.getItem('journal_entries_migrated')).toBeNull();
    });
  });

  describe('migrateJournalEntries', () => {
    it('should skip migration if already completed', async () => {
      localStorage.setItem('journal_entries_migrated', 'true');

      const result = await migrateJournalEntries();

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

      const result = await migrateJournalEntries();

      expect(result).toEqual({
        success: false,
        migrated: 0,
        errors: 0,
      });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should complete migration when no data to migrate', async () => {
      const result = await migrateJournalEntries();

      expect(result).toEqual({
        success: true,
        migrated: 0,
        errors: 0,
      });
      expect(localStorage.getItem('journal_entries_migrated')).toBe('true');
    });

    it('should migrate journal entries from localStorage to Supabase', async () => {
      // Setup localStorage with journal entries
      const mockJournalEntries = [
        {
          id: 'entry-1',
          title: 'Test Entry 1',
          content: 'Content 1',
          mood: 'happy',
          tags: ['test'],
          attachments: [],
          createdAt: new Date('2025-11-15').toISOString(),
        },
        {
          id: 'entry-2',
          title: 'Test Entry 2',
          content: 'Content 2',
          mood: 'calm',
          tags: ['work'],
          attachments: [],
          createdAt: new Date('2025-11-16').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            journalEntries: mockJournalEntries,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateJournalEntries();

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(2);
      expect(result.errors).toBe(0);
      expect(mockFrom).toHaveBeenCalledWith('journal_entries');
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('journal_entries_migrated')).toBe('true');
    });

    it('should handle migration errors gracefully', async () => {
      const mockJournalEntries = [
        {
          id: 'entry-1',
          title: 'Test Entry',
          content: 'Content',
          createdAt: new Date('2025-11-15').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            journalEntries: mockJournalEntries,
          },
        })
      );

      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      (supabase.from as any).mockImplementation(mockFrom);

      const result = await migrateJournalEntries();

      expect(result.success).toBe(false);
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(1);
      // Migration still marks as complete to avoid infinite retries
      expect(localStorage.getItem('journal_entries_migrated')).toBe('true');
    });

    it('should preserve original timestamps when migrating', async () => {
      const originalDate = new Date('2025-11-10T14:30:00Z');
      const mockJournalEntries = [
        {
          id: 'entry-1',
          title: 'Test Entry',
          content: 'Content',
          createdAt: originalDate.toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            journalEntries: mockJournalEntries,
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

      await migrateJournalEntries();

      expect(capturedInsertData).toBeDefined();
      expect(capturedInsertData.created_at).toBe(originalDate.toISOString());
    });

    it('should handle entries with optional fields', async () => {
      const mockJournalEntries = [
        {
          id: 'entry-1',
          content: 'Minimal entry - no title or mood',
          createdAt: new Date('2025-11-15').toISOString(),
        },
      ];

      localStorage.setItem(
        'app-storage',
        JSON.stringify({
          state: {
            journalEntries: mockJournalEntries,
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

      const result = await migrateJournalEntries();

      expect(result.success).toBe(true);
      expect(capturedInsertData.title).toBeNull();
      expect(capturedInsertData.mood).toBeNull();
      expect(capturedInsertData.tags).toEqual([]);
      expect(capturedInsertData.attachments).toEqual([]);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorage.setItem('app-storage', 'invalid json{');

      const result = await migrateJournalEntries();

      // Should not throw, should return empty migration
      expect(result.success).toBe(true);
      expect(result.migrated).toBe(0);
      expect(result.errors).toBe(0);
    });
  });
});
