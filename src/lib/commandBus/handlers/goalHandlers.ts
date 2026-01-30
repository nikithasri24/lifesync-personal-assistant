/**
 * Goal Command Handlers
 *
 * Handles all goal-related commands through the command bus.
 * Uses the Life Goals API layer for data access.
 */

import {
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
} from '@/goals/api/lifeGoalsAPI';
import type {
  UpdateLifeGoalInput,
  GoalCategory,
  GoalStatus,
} from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import type {
  CommandResult,
  CreateGoalCommand,
  UpdateGoalCommand,
  DeleteGoalCommand,
} from '../types';

/**
 * Map command status to LifeGoal status
 */
function mapToLifeGoalStatus(status: string): GoalStatus {
  const statusMap: Record<string, GoalStatus> = {
    'active': 'in-progress',
    'completed': 'completed',
    'paused': 'on-hold',
    'abandoned': 'abandoned',
    'archived': 'abandoned',
    'on_hold': 'on-hold',
  };
  return statusMap[status] || (status as GoalStatus);
}

/**
 * Handle CREATE_GOAL command
 */
export async function handleCreateGoal(command: CreateGoalCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Map category to valid GoalCategory
    const validCategories: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
    const mappedCategory: GoalCategory = validCategories.includes(payload.category as GoalCategory)
      ? (payload.category as GoalCategory)
      : 'personal';

    const data = await createLifeGoal({
      title: payload.title,
      description: payload.description,
      category: mappedCategory,
      targetDate: payload.targetDate,
      priority: 'medium',
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
    const updates: UpdateLifeGoalInput = {};
    if (payload.updates.title !== undefined) updates.title = payload.updates.title;
    if (payload.updates.description !== undefined) updates.description = payload.updates.description;
    if (payload.updates.category !== undefined) {
      const validCategories: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
      updates.category = validCategories.includes(payload.updates.category as GoalCategory)
        ? (payload.updates.category as GoalCategory)
        : undefined;
    }
    if (payload.updates.targetDate !== undefined) updates.targetDate = payload.updates.targetDate;
    if (payload.updates.progress !== undefined) updates.progress = payload.updates.progress;
    if (payload.updates.status !== undefined) {
      updates.status = mapToLifeGoalStatus(payload.updates.status);
    }

    const data = await updateLifeGoal(payload.id, updates);

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
    await deleteLifeGoal(payload.id);

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

