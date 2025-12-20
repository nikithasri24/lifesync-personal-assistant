/**
 * Habit Command Handlers
 *
 * Handles all habit-related commands through the command bus.
 * Uses the API layer for data access.
 */

import * as habitsAPI from '@/api/habitsAPI';
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

  try {
    // Map command frequency to HabitData frequency
    // Command supports: 'daily' | 'weekly' | 'custom'
    // HabitData supports: 'daily' | 'weekly' | 'monthly'
    // Map 'custom' to 'daily' as default
    const frequencyMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
      daily: 'daily',
      weekly: 'weekly',
      custom: 'daily', // custom maps to daily
    };
    const frequency = frequencyMap[payload.frequency] || 'daily';

    const data = await habitsAPI.createHabit({
      name: payload.name,
      description: payload.description,
      frequency,
      reminder_time: payload.reminderTime,
      category: payload.category,
      is_active: true,
      streak_count: 0,
      best_streak: 0,
    });

    return {
      success: true,
      data,
      message: `Habit "${payload.name}" created`,
    };
  } catch (error) {
    logger.error('HabitHandlers', 'Failed to create habit', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle LOG_HABIT command
 */
export async function handleLogHabit(command: LogHabitCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const logDate = payload.date || format(new Date(), 'yyyy-MM-dd');

    // Use createHabitEntry which handles duplicate checking via upsert
    // HabitEntryData uses 'value' field (1 = completed) instead of 'completed' boolean
    const data = await habitsAPI.createHabitEntry({
      habit_id: payload.habitId,
      date: logDate,
      value: 1, // 1 indicates completed
      notes: payload.notes,
    });

    return {
      success: true,
      data,
      message: 'Habit logged',
    };
  } catch (error) {
    logger.error('HabitHandlers', 'Failed to log habit', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle UPDATE_HABIT command
 */
export async function handleUpdateHabit(command: UpdateHabitCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Map camelCase to snake_case for API layer
    const updates: Record<string, unknown> = {};
    if (payload.updates.name !== undefined) updates.name = payload.updates.name;
    if (payload.updates.description !== undefined) updates.description = payload.updates.description;
    if (payload.updates.frequency !== undefined) updates.frequency = payload.updates.frequency;
    if (payload.updates.targetDays !== undefined) updates.target_days = payload.updates.targetDays;
    if (payload.updates.reminderTime !== undefined) updates.reminder_time = payload.updates.reminderTime;
    if (payload.updates.category !== undefined) updates.category = payload.updates.category;
    if (payload.updates.isActive !== undefined) updates.is_active = payload.updates.isActive;

    const data = await habitsAPI.updateHabit(payload.id, updates);

    return {
      success: true,
      data,
      message: 'Habit updated',
    };
  } catch (error) {
    logger.error('HabitHandlers', 'Failed to update habit', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle DELETE_HABIT command
 */
export async function handleDeleteHabit(command: DeleteHabitCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    await habitsAPI.deleteHabit(payload.id);

    return {
      success: true,
      message: 'Habit deleted',
    };
  } catch (error) {
    logger.error('HabitHandlers', 'Failed to delete habit', { error });
    return { success: false, error: (error as Error).message };
  }
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

