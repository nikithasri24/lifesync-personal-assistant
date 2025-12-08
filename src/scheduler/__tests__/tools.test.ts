import { describe, it, expect, beforeEach, vi } from 'vitest';
import { schedulerTools } from '../tools';
import * as schedulerAPI from '@/api/schedulerAPI';

// Mock the scheduler API
vi.mock('@/api/schedulerAPI');

describe('Scheduler AI Tools', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_schedule_block tool', () => {
    it('should create schedule block', async () => {
      const mockBlock = {
        id: 'block-1',
        title: 'Deep Work',
        start_time: '09:00',
        end_time: '11:00',
        days_of_week: ['Monday', 'Wednesday'],
        user_id: mockUserId,
      };

      vi.mocked(schedulerAPI.createScheduleBlock).mockResolvedValue(mockBlock as any);

      const tool = schedulerTools.find((t) => t.definition.function.name === 'create_schedule_block');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          title: 'Deep Work',
          start_time: '09:00',
          end_time: '11:00',
          days_of_week: ['Monday', 'Wednesday'],
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.schedule_block?.title).toBe('Deep Work');
    });
  });

  describe('get_schedule tool with filters', () => {
    it('should get schedule blocks', async () => {
      const mockBlocks = [
        { id: 'block-1', title: 'Deep Work', days_of_week: ['Monday'] },
        { id: 'block-2', title: 'Meetings', days_of_week: ['Tuesday'] },
      ];

      vi.mocked(schedulerAPI.getScheduleBlocks).mockResolvedValue(mockBlocks as any);

      const tool = schedulerTools.find((t) => t.definition.function.name === 'get_schedule');
      expect(tool).toBeDefined();

      const result = await tool!.execute({}, mockUserId);

      expect(result.success).toBe(true);
      expect(result.schedule_blocks).toHaveLength(2);
    });
  });

  describe('update_schedule tool', () => {
    it('should update schedule block', async () => {
      const mockBlock = {
        id: 'block-1',
        title: 'Updated Work',
      };

      vi.mocked(schedulerAPI.updateScheduleBlock).mockResolvedValue(mockBlock as any);

      const tool = schedulerTools.find((t) => t.definition.function.name === 'update_schedule');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          block_id: 'block-1',
          title: 'Updated Work',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
    });
  });

  describe('delete_schedule tool', () => {
    it('should delete schedule block', async () => {
      vi.mocked(schedulerAPI.deleteScheduleBlock).mockResolvedValue();

      const tool = schedulerTools.find((t) => t.definition.function.name === 'delete_schedule');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          block_id: 'block-1',
        },
        mockUserId
      );

      expect(result.success).toBe(true);
    });
  });

  describe('find_free_time tool', () => {
    it('should find free time slots', async () => {
      const mockBlocks = [
        {
          id: 'block-1',
          start_time: '09:00',
          end_time: '11:00',
          days_of_week: ['Monday'],
        },
      ];

      vi.mocked(schedulerAPI.getScheduleBlocks).mockResolvedValue(mockBlocks as any);

      const tool = schedulerTools.find((t) => t.definition.function.name === 'find_free_time');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        {
          day_of_week: 'Monday',
          duration_minutes: 60,
        },
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.free_slots).toBeDefined();
    });
  });
});
