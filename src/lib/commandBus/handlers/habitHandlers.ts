/**
 * Habit Command Handlers
 * 
 * Handles all habit-related commands through the command bus.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format } from 'date-fns';
import type {
  CommandResult,
  CreateHabitCommand,
  LogHabitCommand,
  UpdateHabitCommand,
  DeleteHabitCommand,
} from '../types';

/**
 * Handle CREATE_HABIT command
 */
export async function handleCreateHabit(command: CreateHabitCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: payload.name,
      description: payload.description,
      frequency: payload.frequency || 'daily',
      target_days: payload.targetDays,
      reminder_time: payload.reminderTime,
      category: payload.category,
      is_active: true,
      current_streak: 0,
      longest_streak: 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('HabitHandlers', 'Failed to create habit', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: `Habit "${payload.name}" created`,
  };
}

/**
 * Handle LOG_HABIT command
 */
export async function handleLogHabit(command: LogHabitCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const logDate = payload.date || format(new Date(), 'yyyy-MM-dd');

  // Check if already logged today
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', payload.habitId)
    .eq('user_id', user.id)
    .eq('log_date', logDate)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Habit already logged for this date' };
  }

  // Log the habit
  const { data, error } = await supabase
    .from('habit_logs')
    .insert({
      habit_id: payload.habitId,
      user_id: user.id,
      log_date: logDate,
      notes: payload.notes,
    })
    .select()
    .single();

  if (error) {
    logger.error('HabitHandlers', 'Failed to log habit', { error });
    return { success: false, error: error.message };
  }

  // Update streak (simplified - full logic would check consecutive days)
  await supabase.rpc('increment_habit_streak', { habit_id: payload.habitId });

  return {
    success: true,
    data,
    message: 'Habit logged',
  };
}

/**
 * Handle UPDATE_HABIT command
 */
export async function handleUpdateHabit(command: UpdateHabitCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Map camelCase to snake_case
  const updates: Record<string, unknown> = {};
  if (payload.updates.name !== undefined) updates.name = payload.updates.name;
  if (payload.updates.description !== undefined) updates.description = payload.updates.description;
  if (payload.updates.frequency !== undefined) updates.frequency = payload.updates.frequency;
  if (payload.updates.targetDays !== undefined) updates.target_days = payload.updates.targetDays;
  if (payload.updates.reminderTime !== undefined) updates.reminder_time = payload.updates.reminderTime;
  if (payload.updates.category !== undefined) updates.category = payload.updates.category;
  if (payload.updates.isActive !== undefined) updates.is_active = payload.updates.isActive;

  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', payload.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('HabitHandlers', 'Failed to update habit', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: 'Habit updated',
  };
}

/**
 * Handle DELETE_HABIT command
 */
export async function handleDeleteHabit(command: DeleteHabitCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', payload.id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('HabitHandlers', 'Failed to delete habit', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Habit deleted',
  };
}

/**
 * All habit handlers mapped by command type
 */
export const habitHandlers = {
  CREATE_HABIT: handleCreateHabit,
  LOG_HABIT: handleLogHabit,
  UPDATE_HABIT: handleUpdateHabit,
  DELETE_HABIT: handleDeleteHabit,
};

