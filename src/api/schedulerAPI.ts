/**
 * Scheduler API
 * CRUD operations for schedule blocks and task scheduling
 */

import { supabase } from '../lib/supabase';
import type { ScheduleBlock } from '../services/types';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// =====================================================
// SCHEDULE BLOCKS CRUD OPERATIONS
// =====================================================

/**
 * Get schedule blocks for a date range
 * @param filters - Optional filters for date range and block type
 * @returns Promise<ScheduleBlock[]> - Array of schedule blocks matching the filters
 * @throws Error if user not authenticated
 */
export async function getScheduleBlocks(filters?: {
  startDate?: string;
  endDate?: string;
  type?: ScheduleBlock['type'];
}): Promise<ScheduleBlock[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Apply filters
      if (filters) {
        if (filters.startDate) {
          query = query.gte('date', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('date', filters.endDate);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ScheduleBlock[];
    },
    { domain: 'SchedulerAPI', operation: 'getScheduleBlocks', data: { filters } }
  );
}

/**
 * Get schedule blocks for a specific date
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise<ScheduleBlock[]> - Array of schedule blocks for the date
 * @throws Error if user not authenticated
 */
export async function getScheduleBlocksForDate(date: string): Promise<ScheduleBlock[]> {
  return getScheduleBlocks({ startDate: date, endDate: date });
}

/**
 * Create a new schedule block
 * @param block - Schedule block data
 * @returns Promise<ScheduleBlock> - The created schedule block
 * @throws Error if creation fails or user not authenticated
 */
export async function createScheduleBlock(
  block: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ScheduleBlock> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('schedule_blocks')
        .insert({ ...block, user_id: user.id })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Schedule Block');
      logger.info('SchedulerAPI', 'Schedule block created', { id: data.id, date: data.date });
      return data as ScheduleBlock;
    },
    { domain: 'SchedulerAPI', operation: 'createScheduleBlock', data: { date: block.date } }
  );
}

/**
 * Update an existing schedule block
 * @param id - Schedule block ID to update
 * @param updates - Partial schedule block data to update
 * @returns Promise<ScheduleBlock> - The updated schedule block
 * @throws Error if block not found or user not authenticated
 */
export async function updateScheduleBlock(
  id: string,
  updates: Partial<ScheduleBlock>
): Promise<ScheduleBlock> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('schedule_blocks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Schedule Block', id);
      logger.info('SchedulerAPI', 'Schedule block updated', { id });
      return data as ScheduleBlock;
    },
    { domain: 'SchedulerAPI', operation: 'updateScheduleBlock', data: { id } }
  );
}

/**
 * Delete a schedule block
 * @param id - Schedule block ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteScheduleBlock(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('SchedulerAPI', 'Schedule block deleted', { id });
    },
    { domain: 'SchedulerAPI', operation: 'deleteScheduleBlock', data: { id } }
  );
}

/**
 * Find free time slots in a given date range
 *
 * @deprecated Use scheduleEngine.findFreeSlots() from src/services/scheduler instead.
 * This function only considers schedule_blocks. The ScheduleEngine considers ALL sources:
 * calendar_events, schedule_blocks, and scheduled tasks.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param duration - Minimum duration required in minutes
 * @returns Promise<Array<{ start: string; end: string }>> - Array of free time slots
 * @throws Error if user not authenticated
 */
export async function findFreeTimeSlots(
  date: string,
  duration: number // minutes
): Promise<Array<{ start: string; end: string }>> {
  const blocks = await getScheduleBlocksForDate(date);

  // Define work hours (9 AM to 6 PM by default)
  const workStart = '09:00';
  const workEnd = '18:00';

  const freeSlots: Array<{ start: string; end: string }> = [];

  // Simple algorithm: find gaps between blocks
  // This is a basic implementation - can be enhanced
  if (blocks.length === 0) {
    freeSlots.push({ start: workStart, end: workEnd });
    return freeSlots;
  }

  // Sort blocks by start time
  const sortedBlocks = blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Check gap before first block
  if (sortedBlocks[0].start_time > workStart) {
    const gap = calculateMinutes(workStart, sortedBlocks[0].start_time);
    if (gap >= duration) {
      freeSlots.push({ start: workStart, end: sortedBlocks[0].start_time });
    }
  }

  // Check gaps between blocks
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const currentEnd = sortedBlocks[i].end_time;
    const nextStart = sortedBlocks[i + 1].start_time;
    const gap = calculateMinutes(currentEnd, nextStart);

    if (gap >= duration) {
      freeSlots.push({ start: currentEnd, end: nextStart });
    }
  }

  // Check gap after last block
  const lastBlock = sortedBlocks[sortedBlocks.length - 1];
  if (lastBlock.end_time < workEnd) {
    const gap = calculateMinutes(lastBlock.end_time, workEnd);
    if (gap >= duration) {
      freeSlots.push({ start: lastBlock.end_time, end: workEnd });
    }
  }

  return freeSlots;
}

// Helper function to calculate minutes between two times
function calculateMinutes(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}
