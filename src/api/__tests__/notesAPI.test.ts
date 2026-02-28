import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  type CreateNoteInput,
  type UpdateNoteInput,
  type NoteFilters,
} from '../notesAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('notesAPI', () => {
  const mockUser = { id: 'test-user-456' };
  const mockNote = {
    id: 'note-123',
    user_id: 'test-user-456',
    title: 'Test Note',
    content: 'Test content for the note',
    tags: ['work', 'important'],
    category: 'personal',
    created_at: '2025-11-19T10:00:00Z',
    updated_at: '2025-11-19T10:30:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('getNotes', () => {
    it('should fetch all notes for authenticated user', async () => {
      // The implementation does: select('*').order('created_at', ...).eq('user_id', ...)
      // plus getMergedConnectionId calls supabase.from('profile_connections')
      // We need a flexible mock that handles the full chain
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [mockNote], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const result = await getNotes();

      expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('notes');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Note');
    });

    it('should apply client-side search filter when provided', async () => {
      const notes = [
        { ...mockNote, title: 'Test Note', content: 'Test content' },
        { ...mockNote, id: 'note-2', title: 'Other', content: 'Different' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: notes, error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const filters: NoteFilters = { searchQuery: 'test' };
      const result = await getNotes(filters);

      // Should filter client-side to only notes with "test" in title or content
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Note');
    });

    it('should apply tags filter using contains', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const filters: NoteFilters = { tags: ['work'] };
      await getNotes(filters);

      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['work']);
    });

    it('should apply category filter when provided', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const filters: NoteFilters = { category: 'personal' };
      await getNotes(filters);

      // eq should be called twice: once for user_id, once for category
      expect(mockQuery.eq).toHaveBeenCalledTimes(2);
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'personal');
    });

    it('should throw error when not authenticated', async () => {
      (supabase!.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      await expect(getNotes()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getNote', () => {
    it('should fetch a single note by id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const result = await getNote('note-123');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'note-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(result.id).toBe('note-123');
      expect(result.title).toBe('Test Note');
    });

    it('should throw error when note not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      await expect(getNote('nonexistent')).rejects.toThrow('Note not found');
    });
  });

  describe('createNote', () => {
    it('should create a new note with all fields', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNote,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const input: CreateNoteInput = {
        title: 'Test Note',
        content: 'Test content for the note',
        tags: ['work', 'important'],
        category: 'personal',
      };

      const result = await createNote(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          title: 'Test Note',
          content: 'Test content for the note',
          tags: ['work', 'important'],
          category: 'personal',
        })
      );
      expect(result.title).toBe('Test Note');
    });

    it('should create a minimal note with only required fields', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockNote, title: null, tags: [], category: null },
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const input: CreateNoteInput = {
        content: 'Just content, no title',
      };

      const _result = await createNote(input);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: null,
          content: 'Just content, no title',
          tags: [],
          category: null,
        })
      );
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

      (supabase!.from as any).mockReturnValue(mockQuery);

      await expect(
        createNote({ content: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('updateNote', () => {
    it('should update a note with provided fields', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockNote, content: 'Updated content' },
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const updates: UpdateNoteInput = {
        content: 'Updated content',
      };

      const result = await updateNote('note-123', updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Updated content',
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'note-123');
      expect(result.content).toBe('Updated content');
    });

    it('should update tags and category', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockNote, tags: ['new-tag'], category: 'work' },
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      const updates: UpdateNoteInput = {
        tags: ['new-tag'],
        category: 'work',
      };

      await updateNote('note-123', updates);

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall.tags).toEqual(['new-tag']);
      expect(updateCall.category).toBe('work');
    });

    it('should throw error when note not found', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      (supabase!.from as any).mockReturnValue(mockQuery);

      // Implementation throws NotFoundError('Note', id) which has message "Note not found: nonexistent"
      await expect(
        updateNote('nonexistent', { content: 'New' })
      ).rejects.toThrow('Note');
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });

      const mockQuery = {
        delete: mockDelete,
      };

      mockDelete.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });

      (supabase!.from as any).mockReturnValue(mockQuery);

      await deleteNote('note-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('id', 'note-123');
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

      (supabase!.from as any).mockReturnValue(mockQuery);

      await expect(deleteNote('note-123')).rejects.toThrow();
    });
  });
});
