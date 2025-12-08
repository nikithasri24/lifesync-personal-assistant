import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calendarTools } from '../tools';
import * as calendarAPI from '@/api/calendarAPI';

// Mock the calendar API
vi.mock('@/api/calendarAPI');

describe('Calendar AI Tools', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_event tool', () => {
    it('should create calendar event with required fields', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Team Meeting',
        start_date: '2025-01-20T10:00:00Z',
        end_date: '2025-01-20T11:00:00Z',
        type: 'meeting' as const,
        user_id: mockUserId,
      };

      vi.mocked(calendarAPI.createCalendarEvent).mockResolvedValue(mockEvent as any);

      const tool = calendarTools.find((t) => t.definition.function.name === 'create_event');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          title: 'Team Meeting',
          start_date: '2025-01-20T10:00:00Z',
          end_date: '2025-01-20T11:00:00Z',
          type: 'meeting',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.title).toBe('Team Meeting');
    });

    it('should handle missing required fields', async () => {
      const tool = calendarTools.find((t) => t.definition.function.name === 'create_event');

      const result = await tool!.execute(
        {
          title: 'Team Meeting',
          // Missing start_date
        },
        mockUserId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('get_events tool with filters', () => {
    it('should get events by date range', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Meeting 1',
          start_date: '2025-01-20T10:00:00Z',
        },
        {
          id: 'event-2',
          title: 'Meeting 2',
          start_date: '2025-01-21T14:00:00Z',
        },
      ];

      vi.mocked(calendarAPI.getCalendarEvents).mockResolvedValue(mockEvents as any);

      const tool = calendarTools.find((t) => t.definition.function.name === 'get_events');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          start_date: '2025-01-20',
          end_date: '2025-01-22',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(2);
    });

    it('should filter events by type', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Team Meeting',
          type: 'meeting',
        },
      ];

      vi.mocked(calendarAPI.getCalendarEvents).mockResolvedValue(mockEvents as any);

      const tool = calendarTools.find((t) => t.definition.function.name === 'get_events');

      const result = await tool!.execute(
        {
          type: 'meeting',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(calendarAPI.getCalendarEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'meeting',
        })
      );
    });
  });

  describe('update_event tool', () => {
    it('should update calendar event', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Updated Meeting',
        start_date: '2025-01-20T10:00:00Z',
      };

      vi.mocked(calendarAPI.updateCalendarEvent).mockResolvedValue(mockEvent as any);

      const tool = calendarTools.find((t) => t.definition.function.name === 'update_event');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          event_id: 'event-1',
          title: 'Updated Meeting',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.event?.title).toBe('Updated Meeting');
    });
  });

  describe('delete_event tool', () => {
    it('should delete calendar event', async () => {
      vi.mocked(calendarAPI.deleteCalendarEvent).mockResolvedValue();

      const tool = calendarTools.find((t) => t.definition.function.name === 'delete_event');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          event_id: 'event-1',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(calendarAPI.deleteCalendarEvent).toHaveBeenCalledWith('event-1');
    });
  });

  describe('find_free_slots tool', () => {
    it('should find free time slots', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          start_date: '2025-01-20T10:00:00Z',
          end_date: '2025-01-20T11:00:00Z',
        },
        {
          id: 'event-2',
          start_date: '2025-01-20T14:00:00Z',
          end_date: '2025-01-20T15:00:00Z',
        },
      ];

      vi.mocked(calendarAPI.getCalendarEvents).mockResolvedValue(mockEvents as any);

      const tool = calendarTools.find((t) => t.definition.function.name === 'find_free_slots');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          date: '2025-01-20',
          duration_minutes: 60,
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.free_slots).toBeDefined();
      expect(Array.isArray(result.free_slots)).toBe(true);
    });
  });
});
