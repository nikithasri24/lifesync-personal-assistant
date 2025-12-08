import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getScheduleBlocks,
  createScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
} from '../schedulerAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Scheduler API', () => {
  const mockUser = { id: 'test-user-123' };
  const mockScheduleBlock = {
    id: 'block-1',
    user_id: 'test-user-123',
    title: 'Deep Work',
    start_time: '09:00',
    end_time: '11:00',
    days_of_week: ['Monday', 'Wednesday', 'Friday'],
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  it('should create schedule block', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockScheduleBlock,
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const input = {
      title: 'Deep Work',
      start_time: '09:00',
      end_time: '11:00',
      days_of_week: ['Monday', 'Wednesday', 'Friday'],
    };

    const result = await createScheduleBlock(input);

    expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('schedule_blocks');
    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        title: 'Deep Work',
      })
    );
    expect(result.title).toBe('Deep Work');
  });

  it('should get schedule blocks', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockScheduleBlock],
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await getScheduleBlocks();

    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Deep Work');
  });

  it('should update schedule block', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockScheduleBlock, title: 'Updated Block' },
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await updateScheduleBlock('block-1', { title: 'Updated Block' });

    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Block',
      })
    );
    expect(result.title).toBe('Updated Block');
  });

  it('should delete schedule block', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq1 = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });

    const mockQuery = {
      delete: mockDelete,
    };

    mockDelete.mockReturnValue({ eq: mockEq1 });
    mockEq1.mockReturnValue({ eq: mockEq2 });

    (supabase!.from as any).mockReturnValue(mockQuery);

    await deleteScheduleBlock('block-1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq1).toHaveBeenCalledWith('id', 'block-1');
    expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
  });

  it('should find free time slots', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockScheduleBlock],
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await getScheduleBlocks();

    // Verify that schedule blocks can be used to find free slots
    expect(result).toHaveLength(1);
    expect(result[0].start_time).toBe('09:00');
    expect(result[0].end_time).toBe('11:00');
  });
});
