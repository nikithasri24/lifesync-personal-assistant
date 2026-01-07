/**
 * Goal Command Handlers
 * 
 * Handles all goal-related commands through the command bus.
 * Uses the API layer for data access.
 */

import * as goalsAPI from '@/api/goalsAPI';
import { logger } from '@/services/logger';
import type {
  CommandResult,
  CreateGoalCommand,
  UpdateGoalCommand,
  DeleteGoalCommand,
} from '../types';

/**
 * Handle CREATE_GOAL command
 */
export async function handleCreateGoal(command: CreateGoalCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const data = await goalsAPI.createGoal({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : undefined,
    });

    return {
      success: true,
      data,
      message: `Goal "${payload.title}" created`,
    };
  } catch (error) {
    logger.error('GoalHandlers', 'Failed to create goal', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle UPDATE_GOAL command
 */
export async function handleUpdateGoal(command: UpdateGoalCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const updates: goalsAPI.UpdateGoalInput = {};
    if (payload.updates.title !== undefined) updates.title = payload.updates.title;
    if (payload.updates.description !== undefined) updates.description = payload.updates.description;
    if (payload.updates.category !== undefined) updates.category = payload.updates.category;
    if (payload.updates.targetDate !== undefined) updates.targetDate = new Date(payload.updates.targetDate);
    if (payload.updates.progress !== undefined) updates.progress = payload.updates.progress;
    if (payload.updates.status !== undefined) {
      updates.status = payload.updates.status as 'active' | 'completed' | 'archived' | 'on_hold';
    }

    const data = await goalsAPI.updateGoal(payload.id, updates);

    return {
      success: true,
      data,
      message: 'Goal updated',
    };
  } catch (error) {
    logger.error('GoalHandlers', 'Failed to update goal', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle DELETE_GOAL command
 */
export async function handleDeleteGoal(command: DeleteGoalCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    await goalsAPI.deleteGoal(payload.id);

    return {
      success: true,
      message: 'Goal deleted',
    };
  } catch (error) {
    logger.error('GoalHandlers', 'Failed to delete goal', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * All goal handlers mapped by command type
 */
export const goalHandlers = {
  CREATE_GOAL: handleCreateGoal,
  UPDATE_GOAL: handleUpdateGoal,
  DELETE_GOAL: handleDeleteGoal,
};

