/**
 * Scheduler API
 *
 * API layer for schedule blocks and scheduling functionality.
 * This is a stub file - full implementation pending.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

export interface ScheduleBlockInput {
  date: string;
  start_time: string;
  end_time: string;
  type: 'work' | 'break' | 'personal' | 'focus';
  title?: string;
  task_id?: string;
  color?: string;
  is_recurring?: boolean;
}

export interface ScheduleBlock extends ScheduleBlockInput {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new schedule block
 */
export async function createScheduleBlock(data: ScheduleBlockInput): Promise<ScheduleBlock> {
  logger.debug('SchedulerAPI', 'Creating schedule block', { data });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: result, error } = await supabase
    .from('schedule_blocks')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    logger.error('SchedulerAPI', 'Failed to create schedule block', { error });
    throw error;
  }

  return result;
}

/**
 * Update an existing schedule block
 */
export async function updateScheduleBlock(id: string, updates: Partial<ScheduleBlockInput>): Promise<ScheduleBlock> {
  logger.debug('SchedulerAPI', 'Updating schedule block', { id, updates });

  const { data, error } = await supabase
    .from('schedule_blocks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('SchedulerAPI', 'Failed to update schedule block', { error });
    throw error;
  }

  return data;
}

/**
 * Delete a schedule block
 */
export async function deleteScheduleBlock(id: string): Promise<void> {
  logger.debug('SchedulerAPI', 'Deleting schedule block', { id });

  const { error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('SchedulerAPI', 'Failed to delete schedule block', { error });
    throw error;
  }
}

/**
 * Get schedule blocks for a date range
 */
export async function getScheduleBlocks(startDate: string, endDate: string): Promise<ScheduleBlock[]> {
  logger.debug('SchedulerAPI', 'Fetching schedule blocks', { startDate, endDate });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('start_time', { ascending: true });

  if (error) {
    logger.error('SchedulerAPI', 'Failed to fetch schedule blocks', { error });
    throw error;
  }

  return data || [];
}
