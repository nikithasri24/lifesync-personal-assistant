/**
 * Scheduler Slice
 * Manages schedule blocks state and operations
 */

import type { StateCreator } from 'zustand';
import type { ScheduleBlock } from '@/services/types';
import {
  getScheduleBlocks,
  getScheduleBlocksForDate,
  createScheduleBlock as apiCreateScheduleBlock,
  updateScheduleBlock as apiUpdateScheduleBlock,
  deleteScheduleBlock as apiDeleteScheduleBlock,
  findFreeTimeSlots,
} from '@/api/schedulerAPI';
import { logger } from '@/services/logger';

export interface SchedulerSlice {
  // State
  scheduleBlocks: ScheduleBlock[];
  schedulerLoaded: boolean;
  schedulerLoading: boolean;
  schedulerError: string | null;

  // Actions
  loadScheduleBlocks: (filters?: Parameters<typeof getScheduleBlocks>[0]) => Promise<void>;
  loadScheduleForDate: (date: string) => Promise<void>;
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ScheduleBlock>;
  updateScheduleBlock: (id: string, updates: Partial<ScheduleBlock>) => Promise<ScheduleBlock>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  findFreeTime: (date: string, durationMinutes: number) => Promise<Array<{ start: string; end: string }>>;
  getScheduleBlockById: (id: string) => ScheduleBlock | undefined;
}

export const createSchedulerSlice: StateCreator<SchedulerSlice, [], [], SchedulerSlice> = (
  set,
  get
) => ({
  // Initial state
  scheduleBlocks: [],
  schedulerLoaded: false,
  schedulerLoading: false,
  schedulerError: null,

  // Load schedule blocks with filters
  loadScheduleBlocks: async (filters): Promise<void> => {
    if (get().schedulerLoading) return;

    set({ schedulerLoading: true, schedulerError: null });
    try {
      const blocks = await getScheduleBlocks(filters);
      set({ scheduleBlocks: blocks, schedulerLoaded: true, schedulerLoading: false });
      logger.info('SchedulerSlice', 'Schedule blocks loaded', { count: blocks.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schedule blocks';
      logger.error('SchedulerSlice', error as Error, { context: 'loadScheduleBlocks' });
      set({
        schedulerError: errorMessage,
        schedulerLoading: false,
      });
      throw error;
    }
  },

  // Load schedule for a specific date
  loadScheduleForDate: async (date): Promise<void> => {
    set({ schedulerLoading: true, schedulerError: null });
    try {
      const blocks = await getScheduleBlocksForDate(date);
      set({ scheduleBlocks: blocks, schedulerLoaded: true, schedulerLoading: false });
      logger.info('SchedulerSlice', 'Schedule loaded for date', { date, count: blocks.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schedule';
      logger.error('SchedulerSlice', error as Error, { context: 'loadScheduleForDate', date });
      set({
        schedulerError: errorMessage,
        schedulerLoading: false,
      });
      throw error;
    }
  },

  // Add a new schedule block
  addScheduleBlock: async (block): Promise<ScheduleBlock> => {
    try {
      const created = await apiCreateScheduleBlock(block);
      set((state) => ({ scheduleBlocks: [...state.scheduleBlocks, created].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.start_time.localeCompare(b.start_time);
      }) }));
      logger.info('SchedulerSlice', 'Schedule block created', { id: created.id, date: created.date });
      return created;
    } catch (error) {
      logger.error('SchedulerSlice', error as Error, { context: 'addScheduleBlock' });
      throw error;
    }
  },

  // Update a schedule block
  updateScheduleBlock: async (id, updates): Promise<ScheduleBlock> => {
    try {
      const updated = await apiUpdateScheduleBlock(id, updates);
      set((state) => ({
        scheduleBlocks: state.scheduleBlocks.map((b) => (b.id === id ? updated : b)),
      }));
      logger.info('SchedulerSlice', 'Schedule block updated', { id });
      return updated;
    } catch (error) {
      logger.error('SchedulerSlice', error as Error, { context: 'updateScheduleBlock', id });
      throw error;
    }
  },

  // Delete a schedule block
  deleteScheduleBlock: async (id): Promise<void> => {
    try {
      await apiDeleteScheduleBlock(id);
      set((state) => ({
        scheduleBlocks: state.scheduleBlocks.filter((b) => b.id !== id),
      }));
      logger.info('SchedulerSlice', 'Schedule block deleted', { id });
    } catch (error) {
      logger.error('SchedulerSlice', error as Error, { context: 'deleteScheduleBlock', id });
      throw error;
    }
  },

  // Find free time slots
  findFreeTime: async (date, durationMinutes): Promise<Array<{ start: string; end: string }>> => {
    try {
      const slots = await findFreeTimeSlots(date, durationMinutes);
      logger.info('SchedulerSlice', 'Free time slots found', { date, count: slots.length });
      return slots;
    } catch (error) {
      logger.error('SchedulerSlice', error as Error, { context: 'findFreeTime', date, durationMinutes });
      throw error;
    }
  },

  // Get schedule block by ID
  getScheduleBlockById: (id) => get().scheduleBlocks.find((b) => b.id === id),
});
