/**
 * Habit Commands - Reversible habit operations
 */

import type { Command } from '../contexts/UndoRedoContext';
import type { HabitData, HabitEntryData } from '../services/types';
import {
  createHabit,
  updateHabit,
  deleteHabit,
  createHabitEntry,
  deleteHabitEntry,
} from '../api/habitsAPI';
import { logger } from '../services/logger';

/**
 * Create Habit Command
 */
export class CreateHabitCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private habitData: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>;
  private createdHabitId: string | null = null;

  constructor(habitData: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>) {
    this.id = `create-habit-${Date.now()}`;
    this.description = `Create habit: ${habitData.name}`;
    this.timestamp = Date.now();
    this.habitData = habitData;
  }

  async execute(): Promise<void> {
    logger.debug('[CreateHabitCommand] Executing', { name: this.habitData.name });
    const created = await createHabit(this.habitData);
    this.createdHabitId = created.id as string;
  }

  async undo(): Promise<void> {
    if (!this.createdHabitId) {
      throw new Error('Cannot undo: habit was not created');
    }
    logger.debug('[CreateHabitCommand] Undoing', { habitId: this.createdHabitId });
    await deleteHabit(this.createdHabitId);
  }
}

/**
 * Update Habit Command
 */
export class UpdateHabitCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private habitId: string;
  private updates: Partial<HabitData>;
  private previousState: Partial<HabitData> | null = null;

  constructor(habitId: string, updates: Partial<HabitData>, currentHabit: HabitData) {
    this.id = `update-habit-${habitId}-${Date.now()}`;
    this.description = `Update habit: ${currentHabit.name}`;
    this.timestamp = Date.now();
    this.habitId = habitId;
    this.updates = updates;

    // Store previous values
    this.previousState = {};
    Object.keys(updates).forEach(key => {
      this.previousState![key as keyof HabitData] = currentHabit[key as keyof HabitData] as any;
    });
  }

  async execute(): Promise<void> {
    logger.debug('[UpdateHabitCommand] Executing', { habitId: this.habitId });
    await updateHabit(this.habitId, this.updates);
  }

  async undo(): Promise<void> {
    if (!this.previousState) {
      throw new Error('Cannot undo: previous state not stored');
    }
    logger.debug('[UpdateHabitCommand] Undoing', { habitId: this.habitId });
    await updateHabit(this.habitId, this.previousState);
  }
}

/**
 * Delete Habit Command
 */
export class DeleteHabitCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private habit: HabitData;

  constructor(habit: HabitData) {
    this.id = `delete-habit-${habit.id}-${Date.now()}`;
    this.description = `Delete habit: ${habit.name}`;
    this.timestamp = Date.now();
    this.habit = { ...habit };
  }

  async execute(): Promise<void> {
    logger.debug('[DeleteHabitCommand] Executing', { habitId: this.habit.id });
    await deleteHabit(this.habit.id as string);
  }

  async undo(): Promise<void> {
    logger.debug('[DeleteHabitCommand] Undoing', { habitId: this.habit.id });
    const { id, created_at, updated_at, ...habitData } = this.habit;
    await createHabit(habitData);
  }
}

/**
 * Log Habit Entry Command (complete habit)
 */
export class LogHabitEntryCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private entryData: Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>;
  private createdEntryId: string | null = null;
  private habitName: string;

  constructor(entryData: Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>, habitName: string) {
    this.id = `log-habit-${entryData.habit_id}-${Date.now()}`;
    this.description = `Complete habit: ${habitName}`;
    this.timestamp = Date.now();
    this.entryData = entryData;
    this.habitName = habitName;
  }

  async execute(): Promise<void> {
    logger.debug('[LogHabitEntryCommand] Executing', { habitId: this.entryData.habit_id });
    const created = await createHabitEntry(this.entryData);
    this.createdEntryId = created.id as string;
  }

  async undo(): Promise<void> {
    if (!this.createdEntryId) {
      throw new Error('Cannot undo: entry was not created');
    }
    logger.debug('[LogHabitEntryCommand] Undoing', { entryId: this.createdEntryId });
    await deleteHabitEntry(this.createdEntryId, this.entryData.habit_id);
  }
}
