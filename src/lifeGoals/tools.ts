/**
 * Life Goals AI Tools
 * AI tools for long-term life goal management
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getLifeGoals,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
} from '@/api/lifeGoalsAPI';
import type { LifeGoal } from '@/services/types';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createLifeGoalDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_life_goal',
    description:
      'Create a long-term life goal (5-10+ years). Requires title and category. Optional: description, target_age, target_year, priority, status.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Life goal title - required' },
        category: {
          type: 'string',
          enum: ['career', 'financial', 'family', 'experiences', 'legacy', 'health', 'personal-growth'],
          description: 'Life goal category - required',
        },
        description: { type: 'string', description: 'Detailed description - optional' },
        target_age: { type: 'number', description: 'Target age to achieve this goal - optional' },
        target_year: { type: 'number', description: 'Target year to achieve this goal - optional' },
        priority: {
          type: 'string',
          enum: ['must-have', 'important', 'nice-to-have'],
          description: 'Priority level - optional, defaults to important',
        },
      },
      required: ['title', 'category'],
    },
  },
};

const getLifeGoalsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_life_goals',
    description: 'Get all life goals. Optional filters: status, category, priority.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['dreaming', 'planning', 'in-progress', 'achieved'],
          description: 'Filter by status - optional',
        },
        category: { type: 'string', description: 'Filter by category - optional' },
        priority: { type: 'string', description: 'Filter by priority - optional' },
      },
    },
  },
};

const updateLifeGoalDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_life_goal',
    description: 'Update a life goal. Requires goal_id. Can update: title, description, status, priority, target_age, target_year.',
    parameters: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Life goal ID - required' },
        title: { type: 'string', description: 'New title - optional' },
        description: { type: 'string', description: 'New description - optional' },
        status: { type: 'string', description: 'New status - optional' },
        priority: { type: 'string', description: 'New priority - optional' },
        target_age: { type: 'number', description: 'New target age - optional' },
        target_year: { type: 'number', description: 'New target year - optional' },
      },
      required: ['goal_id'],
    },
  },
};

const deleteLifeGoalDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'delete_life_goal',
    description: 'Delete a life goal. Requires goal_id.',
    parameters: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'Life goal ID to delete - required' },
      },
      required: ['goal_id'],
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeCreateLifeGoal(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const goal = await createLifeGoal({
      title: args.title as string,
      category: args.category as LifeGoal['category'],
      description: args.description as string | undefined,
      target_age: args.target_age as number | undefined,
      target_year: args.target_year as number | undefined,
      priority: (args.priority as LifeGoal['priority']) || 'important',
      status: 'dreaming',
      related_goal_ids: [],
      milestones: [],
    });

    logger.info('LifeGoalsTools', 'Life goal created', { id: goal.id, title: goal.title });
    return {
      success: true,
      message: `Life goal created: ${goal.title}`,
      data: goal,
    };
  } catch (error) {
    logger.error('LifeGoalsTools', 'Operation failed', { error, context: 'executeCreateLifeGoal' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetLifeGoals(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const goals = await getLifeGoals({
      status: args.status as LifeGoal['status'] | undefined,
      category: args.category as LifeGoal['category'] | undefined,
      priority: args.priority as LifeGoal['priority'] | undefined,
    });

    return {
      success: true,
      message: `Found ${goals.length} life goals`,
      data: goals,
      count: goals.length,
    };
  } catch (error) {
    logger.error('LifeGoalsTools', 'Operation failed', { error, context: 'executeGetLifeGoals' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeUpdateLifeGoal(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const updates: Partial<LifeGoal> = {};
    if (args.title) updates.title = args.title as string;
    if (args.description) updates.description = args.description as string;
    if (args.status) updates.status = args.status as LifeGoal['status'];
    if (args.priority) updates.priority = args.priority as LifeGoal['priority'];
    if (args.target_age) updates.target_age = args.target_age as number;
    if (args.target_year) updates.target_year = args.target_year as number;

    const updated = await updateLifeGoal(args.goal_id as string, updates);

    logger.info('LifeGoalsTools', 'Life goal updated', { id: updated.id });
    return {
      success: true,
      message: 'Life goal updated successfully',
      data: updated,
    };
  } catch (error) {
    logger.error('LifeGoalsTools', 'Operation failed', { error, context: 'executeUpdateLifeGoal' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeDeleteLifeGoal(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    await deleteLifeGoal(args.goal_id as string);

    logger.info('LifeGoalsTools', 'Life goal deleted', { id: args.goal_id });
    return {
      success: true,
      message: 'Life goal deleted successfully',
    };
  } catch (error) {
    logger.error('LifeGoalsTools', 'Operation failed', { error, context: 'executeDeleteLifeGoal' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const lifeGoalsTools: Tool[] = [
  { definition: createLifeGoalDefinition, execute: executeCreateLifeGoal },
  { definition: getLifeGoalsDefinition, execute: executeGetLifeGoals },
  { definition: updateLifeGoalDefinition, execute: executeUpdateLifeGoal },
  { definition: deleteLifeGoalDefinition, execute: executeDeleteLifeGoal },
];
