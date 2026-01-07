import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../calendarAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Calendar API', () => {
  const mockUser = { id: 'test-user-123' };
  const mockEvent = {
    id: 'event-1',
    user_id: 'test-user-123',
    title: 'Team Meeting',
    description: 'Weekly team sync',
    start_date: '2025-01-20T10:00:00Z',
    end_date: '2025-01-20T11:00:00Z',
    type: 'meeting',
    location: 'Zoom',
    is_all_day: false,
    recurrence_rule: null,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  it('should create calendar event', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockEvent,
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const input = {
      title: 'Team Meeting',
      start_date: '2025-01-20T10:00:00Z',
      end_date: '2025-01-20T11:00:00Z',
      type: 'meeting' as const,
      all_day: false,
      is_recurring: false,
    };

    const result = await createCalendarEvent(input);

    expect(vi.mocked(supabase!.from)).toHaveBeenCalledWith('calendar_events');
    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        title: 'Team Meeting',
        type: 'meeting',
      })
    );
    expect(result.title).toBe('Team Meeting');
  });

  it('should get calendar events', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [mockEvent],
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await getCalendarEvents();

    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(mockQuery.order).toHaveBeenCalledWith('start_date', { ascending: true });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Team Meeting');
  });

  it('should get calendar events by date range', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [mockEvent], error: null })),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    await getCalendarEvents({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });

    expect(mockQuery.lte).toHaveBeenCalledWith('start_date', '2025-01-31');
    expect(mockQuery.gte).toHaveBeenCalledWith('end_date', '2025-01-01');
  });

  it('should update calendar event', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockEvent, title: 'Updated Meeting' },
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await updateCalendarEvent('event-1', { title: 'Updated Meeting' });

    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Meeting',
      })
    );
    expect(result.title).toBe('Updated Meeting');
  });

  it('should delete calendar event', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq1 = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockResolvedValue({ error: null });

    const mockQuery = {
      delete: mockDelete,
    };

    mockDelete.mockReturnValue({ eq: mockEq1 });
    mockEq1.mockReturnValue({ eq: mockEq2 });

    (supabase!.from as any).mockReturnValue(mockQuery);

    await deleteCalendarEvent('event-1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq1).toHaveBeenCalledWith('id', 'event-1');
    expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
  });

  it('should handle recurring events', async () => {
    const recurringEvent = {
      ...mockEvent,
      recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
    };

    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: recurringEvent,
        error: null,
      }),
    };

    (supabase!.from as any).mockReturnValue(mockQuery);

    const result = await createCalendarEvent({
      title: 'Weekly Meeting',
      start_date: '2025-01-20T10:00:00Z',
      end_date: '2025-01-20T11:00:00Z',
      type: 'meeting',
      all_day: false,
      is_recurring: true,
      recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
    });

    expect(result.recurrence_rule).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO');
  });

  it('should throw error when not authenticated', async () => {
    (supabase!.auth.getUser as any).mockResolvedValue({
      data: { user: null },
    });

    await expect(getCalendarEvents()).rejects.toThrow('Not authenticated');
  });
});
