import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
  type JournalEntryFilters,
} from '../journalAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('journalAPI', () => {
  const mockUser = { id: 'test-user-123' };
  const mockEntry = {
    id: 'entry-123',
    user_id: 'test-user-123',
    title: 'Test Entry',
    content: 'Test content',
    mood: 'happy',
    tags: ['test', 'api'],
    attachments: [],
    weather: null,
    gratitude: null,
    created_at: '2025-11-19T12:00:00Z',
    updated_at: '2025-11-19T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('getJournalEntries', () => {
    it('should fetch all journal entries for authenticated user', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEntry],
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getJournalEntries();

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('entry-123');
      expect(result[0].title).toBe('Test Entry');
    });

    it('should apply client-side search filter when provided', async () => {
      const entries = [
        { ...mockEntry, title: 'Test Entry', content: 'Test content' },
        { ...mockEntry, id: 'entry-2', title: 'Other', content: 'Different' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: entries,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const filters: JournalEntryFilters = { searchQuery: 'test' };
      const result = await getJournalEntries(filters);

      // Should filter client-side to only entries with "test" in title or content
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Entry');
    });

    it('should apply tags filter using overlaps', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const filters: JournalEntryFilters = { tags: ['work'] };
      await getJournalEntries(filters);

      expect(mockQuery.overlaps).toHaveBeenCalledWith('tags', ['work']);
    });

    it('should apply moods filter using in', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const filters: JournalEntryFilters = { moods: ['happy', 'excited'] };
      await getJournalEntries(filters);

      expect(mockQuery.in).toHaveBeenCalledWith('mood', ['happy', 'excited']);
    });

    it('should apply date range filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const startDate = new Date('2025-11-01');
      const endDate = new Date('2025-11-30');
      const filters: JournalEntryFilters = { startDate, endDate };
      await getJournalEntries(filters);

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getJournalEntries()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when database query fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(getJournalEntries()).rejects.toThrow();
    });
  });

  describe('getJournalEntry', () => {
    it('should fetch a single journal entry by id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEntry,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await getJournalEntry('entry-123');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'entry-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.id).toBe('entry-123');
    });

    it('should throw error when entry not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(getJournalEntry('nonexistent')).rejects.toThrow('Journal entry not found');
    });
  });

  describe('createJournalEntry', () => {
    it('should create a new journal entry', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEntry,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const input: CreateJournalEntryInput = {
        title: 'Test Entry',
        content: 'Test content',
        mood: 'happy',
        tags: ['test'],
        attachments: [],
      };

      const result = await createJournalEntry(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          title: 'Test Entry',
          content: 'Test content',
          mood: 'happy',
          tags: ['test'],
          attachments: [],
        })
      );
      expect(result.title).toBe('Test Entry');
    });

    it('should handle optional fields', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockEntry, title: null, mood: null },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const input: CreateJournalEntryInput = {
        content: 'Minimal entry',
      };

      await createJournalEntry(input);

      const insertCall = mockQuery.insert.mock.calls[0][0];
      expect(insertCall.title).toBeNull();
      expect(insertCall.mood).toBeUndefined();
      expect(insertCall.tags).toEqual([]);
      expect(insertCall.attachments).toEqual([]);
    });

    it('should throw error when creation fails', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        createJournalEntry({ content: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('updateJournalEntry', () => {
    it('should update an existing journal entry', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockEntry, content: 'Updated content' },
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const updates: UpdateJournalEntryInput = {
        content: 'Updated content',
      };

      const result = await updateJournalEntry('entry-123', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Updated content',
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'entry-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.content).toBe('Updated content');
    });

    it('should only update provided fields', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEntry,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const updates: UpdateJournalEntryInput = {
        mood: 'excited',
      };

      await updateJournalEntry('entry-123', updates);

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('mood', 'excited');
      expect(updateCall).not.toHaveProperty('content');
      expect(updateCall).not.toHaveProperty('title');
    });

    it('should throw error when entry not found or update fails', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(
        updateJournalEntry('nonexistent', { content: 'New' })
      ).rejects.toThrow();
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete a journal entry', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await deleteJournalEntry('entry-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'entry-123');
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should throw error when deletion fails', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(deleteJournalEntry('entry-123')).rejects.toThrow();
    });
  });
});
