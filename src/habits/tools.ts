/**
 * Habits AI Tools
 *
 * AI tools for habit tracking (create, log, get streaks, update)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createHabit, getHabits, updateHabit, createHabitEntry, getHabitEntriesForHabit } from '@/api/habitsAPI';
import { logger } from '@/services/logger';
import { startOfDay, differenceInDays, parseISO } from 'date-fns';
import type { HabitData } from '@/services/types';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createHabitDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_habit',
    description: 'Create a new habit to track. Requires name (string). Optional: description, category, frequency ("daily", "weekly", or "monthly"), target_value (number), unit (string like "minutes", "pages", "reps").',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Habit name (e.g., "Morning Exercise", "Read Books") - required'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the habit - optional'
        },
        category: {
          type: 'string',
          description: 'Category like "health", "productivity", "learning" - optional'
        },
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'How often to track: daily, weekly, or monthly - optional, defaults to daily'
        },
        target_value: {
          type: 'number',
          description: 'Target value (e.g., 30 for 30 minutes) - optional'
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g., "minutes", "pages", "reps") - optional'
        }
      },
      required: ['name']
    }
  }
};

const getHabitsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_habits',
    description: 'Get all user habits. Returns list of habits with their current streaks and progress. Optional: category (string) to filter by category, isActive (boolean) to show only active habits.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category - optional'
        },
        isActive: {
          type: 'boolean',
          description: 'Show only active habits if true - optional'
        }
      }
    }
  }
};

const logHabitDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'log_habit',
    description: 'Log habit completion for today. Requires habit_name (string, case-insensitive). Optional: value (number) for habits with targets, notes (string).',
    parameters: {
      type: 'object',
      properties: {
        habit_name: {
          type: 'string',
          description: 'Name of the habit to log (case-insensitive) - required'
        },
        value: {
          type: 'number',
          description: 'Value achieved (e.g., 30 for 30 minutes) - optional, defaults to 1'
        },
        notes: {
          type: 'string',
          description: 'Optional notes about this habit completion'
        }
      },
      required: ['habit_name']
    }
  }
};

const getHabitStreakDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_habit_streak',
    description: 'Get current streak for a specific habit. Shows how many consecutive days/periods the habit has been completed. Requires habit_name (string, case-insensitive).',
    parameters: {
      type: 'object',
      properties: {
        habit_name: {
          type: 'string',
          description: 'Name of the habit to check (case-insensitive) - required'
        }
      },
      required: ['habit_name']
    }
  }
};

const updateHabitDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_habit',
    description: 'Update habit details. Requires habit_name (string). Optional: new_name, description, target_value, is_active (boolean).',
    parameters: {
      type: 'object',
      properties: {
        habit_name: {
          type: 'string',
          description: 'Current name of the habit to update (case-insensitive) - required'
        },
        new_name: {
          type: 'string',
          description: 'New name for the habit - optional'
        },
        description: {
          type: 'string',
          description: 'Updated description - optional'
        },
        target_value: {
          type: 'number',
          description: 'Updated target value - optional'
        },
        is_active: {
          type: 'boolean',
          description: 'Set habit as active (true) or inactive (false) - optional'
        }
      },
      required: ['habit_name']
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Find habit by name (case-insensitive)
 */
async function findHabitByName(habitName: string): Promise<HabitData | null> {
  const habits = await getHabits();
  const habit = habits.find(h =>
    h.name.toLowerCase() === habitName.toLowerCase()
  );
  return habit ?? null;
}

/**
 * Calculate current streak from habit entries
 */
function calculateStreak(entries: Array<{ date: string }>, frequency: 'daily' | 'weekly' | 'monthly' = 'daily'): number {
  if (entries.length === 0) return 0;

  // Sort entries by date descending
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const today = startOfDay(new Date());
  let streak = 0;
  let currentDate = today;

  // Check if there's an entry for today or yesterday (streak can continue)
  const latestEntry = parseISO(sortedEntries[0].date);
  const daysDiff = differenceInDays(today, latestEntry);

  // If last entry is more than 1 day ago, streak is broken
  if (daysDiff > 1) return 0;

  // Calculate streak
  for (const entry of sortedEntries) {
    const entryDate = startOfDay(parseISO(entry.date));
    const diff = differenceInDays(currentDate, entryDate);

    if (diff === 0 || diff === 1) {
      streak++;
      currentDate = entryDate;
    } else {
      break;
    }
  }

  return streak;
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Create a new habit
 */
async function executeCreateHabit(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const name = args.name as string;
    const description = args.description as string | undefined;
    const category = args.category as string | undefined;
    const frequency = (args.frequency as 'daily' | 'weekly' | 'monthly') ?? 'daily';
    const targetValue = args.target_value as number | undefined;
    const unit = args.unit as string | undefined;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Habit name is required'
      };
    }

    // Check if habit with same name already exists
    const existing = await findHabitByName(name);
    if (existing) {
      return {
        success: false,
        error: `A habit named "${name}" already exists`
      };
    }

    logger.info('HabitTools', 'Creating habit', {
      name,
      frequency,
      targetValue,
      unit
    });

    const habit = await createHabit({
      name: name.trim(),
      description,
      category,
      frequency,
      target_value: targetValue,
      unit,
      is_active: true,
      streak_count: 0,
      best_streak: 0,
      current_progress: 0
    });

    logger.info('HabitTools', 'Habit created successfully', {
      habitId: habit.id,
      name: habit.name
    });

    return {
      success: true,
      habit_id: habit.id,
      message: `Habit "${habit.name}" created successfully`,
      habit: {
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        target_value: habit.target_value,
        unit: habit.unit
      }
    };
  } catch (error) {
    logger.error('HabitTools', error as Error, {
      operation: 'create_habit',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create habit'
    };
  }
}

/**
 * Get all habits
 */
async function executeGetHabits(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    const isActive = args.isActive as boolean | undefined;

    logger.info('HabitTools', 'Getting habits', { category, isActive });

    const habits = await getHabits({
      category,
      isActive
    });

    logger.info('HabitTools', 'Habits retrieved', {
      count: habits.length
    });

    return {
      success: true,
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        target_value: h.target_value,
        unit: h.unit,
        streak_count: h.streak_count,
        best_streak: h.best_streak,
        current_progress: h.current_progress,
        is_active: h.is_active
      })),
      count: habits.length,
      message: `You have ${habits.length} habit${habits.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('HabitTools', error as Error, {
      operation: 'get_habits',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get habits'
    };
  }
}

/**
 * Log habit completion
 */
async function executeLogHabit(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const habitName = args.habit_name as string;
    const value = (args.value as number) ?? 1;
    const notes = args.notes as string | undefined;

    // Validate
    if (!habitName || habitName.trim().length === 0) {
      return {
        success: false,
        error: 'Habit name is required'
      };
    }

    // Find habit
    const habit = await findHabitByName(habitName);
    if (!habit || !habit.id) {
      return {
        success: false,
        error: `Habit "${habitName}" not found. Create it first with create_habit.`
      };
    }

    logger.info('HabitTools', 'Logging habit', {
      habitId: habit.id,
      habitName: habit.name,
      value,
      notes
    });

    // Log completion for today
    const today = startOfDay(new Date()).toISOString().split('T')[0];

    const entry = await createHabitEntry({
      habit_id: habit.id,
      date: today,
      value,
      notes
    });

    // Get updated streak
    const entries = await getHabitEntriesForHabit(habit.id);
    const currentStreak = calculateStreak(entries, habit.frequency);

    logger.info('HabitTools', 'Habit logged successfully', {
      habitId: habit.id,
      entryId: entry.id,
      streak: currentStreak
    });

    return {
      success: true,
      message: `Logged "${habit.name}" for today${value > 1 ? ` (${value} ${habit.unit ?? 'times'})` : ''}`,
      habit: {
        id: habit.id,
        name: habit.name
      },
      entry: {
        id: entry.id,
        date: entry.date,
        value: entry.value
      },
      streak: currentStreak,
      streak_message: currentStreak > 0 ? `${currentStreak} day streak! 🔥` : 'Streak started!'
    };
  } catch (error) {
    logger.error('HabitTools', error as Error, {
      operation: 'log_habit',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log habit'
    };
  }
}

/**
 * Get habit streak
 */
async function executeGetHabitStreak(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const habitName = args.habit_name as string;

    // Validate
    if (!habitName || habitName.trim().length === 0) {
      return {
        success: false,
        error: 'Habit name is required'
      };
    }

    // Find habit
    const habit = await findHabitByName(habitName);
    if (!habit || !habit.id) {
      return {
        success: false,
        error: `Habit "${habitName}" not found`
      };
    }

    logger.info('HabitTools', 'Getting habit streak', {
      habitId: habit.id,
      habitName: habit.name
    });

    // Get entries and calculate streak
    const entries = await getHabitEntriesForHabit(habit.id);
    const currentStreak = calculateStreak(entries, habit.frequency);

    logger.info('HabitTools', 'Habit streak retrieved', {
      habitId: habit.id,
      streak: currentStreak,
      bestStreak: habit.best_streak
    });

    return {
      success: true,
      habit: {
        id: habit.id,
        name: habit.name
      },
      current_streak: currentStreak,
      best_streak: habit.best_streak ?? 0,
      total_completions: entries.length,
      message: currentStreak > 0
        ? `Your "${habit.name}" streak is ${currentStreak} days! 🔥`
        : `No current streak for "${habit.name}". Start one today!`
    };
  } catch (error) {
    logger.error('HabitTools', error as Error, {
      operation: 'get_habit_streak',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get habit streak'
    };
  }
}

/**
 * Update habit
 */
async function executeUpdateHabit(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const habitName = args.habit_name as string;
    const newName = args.new_name as string | undefined;
    const description = args.description as string | undefined;
    const targetValue = args.target_value as number | undefined;
    const isActive = args.is_active as boolean | undefined;

    // Validate
    if (!habitName || habitName.trim().length === 0) {
      return {
        success: false,
        error: 'Habit name is required'
      };
    }

    // Find habit
    const habit = await findHabitByName(habitName);
    if (!habit || !habit.id) {
      return {
        success: false,
        error: `Habit "${habitName}" not found`
      };
    }

    logger.info('HabitTools', 'Updating habit', {
      habitId: habit.id,
      habitName: habit.name,
      updates: { newName, description, targetValue, isActive }
    });

    // Build updates object
    const updates: Partial<HabitData> = {};
    if (newName) updates.name = newName.trim();
    if (description !== undefined) updates.description = description;
    if (targetValue !== undefined) updates.target_value = targetValue;
    if (isActive !== undefined) updates.is_active = isActive;

    const updatedHabit = await updateHabit(habit.id, updates);

    logger.info('HabitTools', 'Habit updated successfully', {
      habitId: updatedHabit.id,
      habitName: updatedHabit.name
    });

    return {
      success: true,
      message: `Habit "${habit.name}" updated successfully`,
      habit: {
        id: updatedHabit.id,
        name: updatedHabit.name,
        description: updatedHabit.description,
        target_value: updatedHabit.target_value,
        is_active: updatedHabit.is_active
      }
    };
  } catch (error) {
    logger.error('HabitTools', error as Error, {
      operation: 'update_habit',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update habit'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const habitTools: Tool[] = [
  {
    definition: createHabitDefinition,
    execute: executeCreateHabit
  },
  {
    definition: getHabitsDefinition,
    execute: executeGetHabits
  },
  {
    definition: logHabitDefinition,
    execute: executeLogHabit
  },
  {
    definition: getHabitStreakDefinition,
    execute: executeGetHabitStreak
  },
  {
    definition: updateHabitDefinition,
    execute: executeUpdateHabit
  }
];
