/**
 * Goals & Dreams AI Tools
 *
 * AI tools for goal and dream management (create, get, update progress, manage dreams)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getUserLifeGoals,
  createLifeGoal,
  updateLifeGoal,
  getUserLifeDreams,
  createLifeDream,
} from '@/goals/api/lifeGoalsAPI';
import type { LifeGoal, LifeDream, GoalCategory, GoalPriority, GoalStatus, DreamCategory } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createGoalDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_goal',
    description: 'Create a new life goal with optional financial target and deadline. Requires title (string) and category (string). Optional: description, target_date (ISO format YYYY-MM-DD), target_amount (number), priority (low/medium/high).',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Goal title (e.g., "Save for Japan trip", "Run a marathon") - required'
        },
        category: {
          type: 'string',
          enum: ['personal', 'health', 'career', 'financial', 'fitness', 'travel'],
          description: 'Goal category - required'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the goal - optional'
        },
        target_amount: {
          type: 'number',
          description: 'Financial target amount if this is a savings goal (e.g., 5000 for $5000) - optional'
        },
        target_date: {
          type: 'string',
          description: 'Target completion date in ISO format (YYYY-MM-DD) - optional'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority level - optional, defaults to medium'
        }
      },
      required: ['title', 'category']
    }
  }
};

const getGoalsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_goals',
    description: 'Get all user goals. Returns list of goals with their current progress. Optional: status (string like "active", "completed"), category (string), priority (string).',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived', 'on_hold'],
          description: 'Filter by status - optional'
        },
        category: {
          type: 'string',
          description: 'Filter by category - optional'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Filter by priority - optional'
        }
      }
    }
  }
};

const updateGoalProgressDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_goal_progress',
    description: 'Update progress on a goal. Requires goal_title (string, case-insensitive) and progress (number 0-100). Optional: status (string).',
    parameters: {
      type: 'object',
      properties: {
        goal_title: {
          type: 'string',
          description: 'Title of the goal to update (case-insensitive) - required'
        },
        progress: {
          type: 'number',
          description: 'Progress percentage (0-100) - required'
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived', 'on_hold'],
          description: 'Update goal status - optional'
        }
      },
      required: ['goal_title', 'progress']
    }
  }
};

const createDreamDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_dream',
    description: 'Create a new dream or aspiration (bigger than goals, more aspirational). Requires title (string). Optional: description, category (string like "travel", "experiences"), notes.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Dream title (e.g., "Visit all 7 continents", "Write a novel") - required'
        },
        description: {
          type: 'string',
          description: 'Detailed description - optional'
        },
        category: {
          type: 'string',
          description: 'Category like "travel", "experiences", "achievements" - optional'
        },
        notes: {
          type: 'string',
          description: 'Additional notes or ideas - optional'
        }
      },
      required: ['title']
    }
  }
};

const getDreamsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_dreams',
    description: 'Get all user dreams. Returns list of dreams with their details. No parameters required.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Map old goal status to new LifeGoal status
 */
function mapToLifeGoalStatus(status: string): GoalStatus {
  const statusMap: Record<string, GoalStatus> = {
    'active': 'in-progress',
    'completed': 'completed',
    'archived': 'abandoned',
    'on_hold': 'on-hold',
    'paused': 'on-hold',
    'failed': 'abandoned',
  };
  return statusMap[status] || (status as GoalStatus);
}

/**
 * Find goal by title (case-insensitive)
 */
async function findGoalByTitle(goalTitle: string): Promise<LifeGoal | null> {
  const goals = await getUserLifeGoals();
  const goal = goals.find(g =>
    g.title.toLowerCase() === goalTitle.toLowerCase()
  );
  return goal ?? null;
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Create a new goal
 */
async function executeCreateGoal(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const title = args.title as string;
    const category = args.category as string;
    const description = args.description as string | undefined;
    const targetAmount = args.target_amount as number | undefined;
    const targetDate = args.target_date as string | undefined;
    const priority = (args.priority as 'low' | 'medium' | 'high') ?? 'medium';

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'Goal title is required'
      };
    }

    if (!category || category.trim().length === 0) {
      return {
        success: false,
        error: 'Category is required'
      };
    }

    // Check if goal with same title already exists
    const existing = await findGoalByTitle(title);
    if (existing) {
      return {
        success: false,
        error: `A goal titled "${title}" already exists`
      };
    }

    logger.info('GoalTools', 'Creating goal', {
      title,
      category,
      targetAmount,
      targetDate,
      priority
    });

    // Build description with target amount if provided
    let finalDescription = description ?? '';
    if (targetAmount) {
      finalDescription = finalDescription
        ? `${finalDescription}\n\nTarget Amount: $${targetAmount}`
        : `Target Amount: $${targetAmount}`;
    }

    // Map category to valid GoalCategory
    const validCategories: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
    const mappedCategory: GoalCategory = validCategories.includes(category as GoalCategory)
      ? (category as GoalCategory)
      : 'personal';

    const goal = await createLifeGoal({
      title: title.trim(),
      description: finalDescription,
      category: mappedCategory,
      targetDate: targetDate,
      priority: priority as GoalPriority,
      targetValue: targetAmount,
      unit: targetAmount ? 'dollars' : undefined,
    });

    logger.info('GoalTools', 'Goal created successfully', {
      goalId: goal.id,
      title: goal.title
    });

    return {
      success: true,
      goal_id: goal.id,
      message: `Goal "${goal.title}" created successfully`,
      goal: {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        priority: goal.priority,
        target_date: goal.targetDate
      },
      next_steps: targetAmount
        ? `I'll help you create a savings plan for $${targetAmount}`
        : 'What milestones should we set for this goal?'
    };
  } catch (error) {
    logger.error('GoalTools', 'Operation failed', { error,
      operation: 'create_goal',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create goal'
    };
  }
}

/**
 * Get all goals
 */
async function executeGetGoals(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const status = args.status as string | undefined;
    const category = args.category as string | undefined;
    const priority = args.priority as string | undefined;

    logger.info('GoalTools', 'Getting goals', { status, category, priority });

    let goals = await getUserLifeGoals();

    // Apply filters client-side (lifeGoalsAPI doesn't support filters directly)
    if (status) {
      // Map old status values to new ones
      const statusMap: Record<string, GoalStatus> = {
        'active': 'in-progress',
        'completed': 'completed',
        'archived': 'abandoned',
        'on_hold': 'on-hold'
      };
      const mappedStatus = statusMap[status] || status;
      goals = goals.filter(g => g.status === mappedStatus);
    }
    if (category) {
      goals = goals.filter(g => g.category === category);
    }
    if (priority) {
      goals = goals.filter(g => g.priority === priority);
    }

    logger.info('GoalTools', 'Goals retrieved', {
      count: goals.length
    });

    return {
      success: true,
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        priority: g.priority,
        status: g.status,
        progress: g.progress,
        target_date: g.targetDate,
        created_at: g.createdAt
      })),
      count: goals.length,
      message: `You have ${goals.length} goal${goals.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('GoalTools', 'Operation failed', { error,
      operation: 'get_goals',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get goals'
    };
  }
}

/**
 * Update goal progress
 */
async function executeUpdateGoalProgress(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const goalTitle = args.goal_title as string;
    const progress = args.progress as number;
    const status = args.status as 'active' | 'completed' | 'archived' | 'on_hold' | undefined;

    // Validate
    if (!goalTitle || goalTitle.trim().length === 0) {
      return {
        success: false,
        error: 'Goal title is required'
      };
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return {
        success: false,
        error: 'Progress must be a number between 0 and 100'
      };
    }

    // Find goal
    const goal = await findGoalByTitle(goalTitle);
    if (!goal) {
      return {
        success: false,
        error: `Goal "${goalTitle}" not found. Create it first with create_goal.`
      };
    }

    logger.info('GoalTools', 'Updating goal progress', {
      goalId: goal.id,
      goalTitle: goal.title,
      progress,
      status
    });

    // Auto-complete if progress reaches 100
    const finalStatus: GoalStatus = progress >= 100 ? 'completed' : (status ? mapToLifeGoalStatus(status) : goal.status);

    const updatedGoal = await updateLifeGoal(goal.id, {
      progress,
      status: finalStatus
    });

    logger.info('GoalTools', 'Goal progress updated successfully', {
      goalId: updatedGoal.id,
      progress: updatedGoal.progress,
      status: updatedGoal.status
    });

    return {
      success: true,
      message: progress >= 100
        ? `🎉 Congratulations! You've completed "${updatedGoal.title}"!`
        : `Updated "${updatedGoal.title}" to ${progress}% complete`,
      goal: {
        id: updatedGoal.id,
        title: updatedGoal.title,
        progress: updatedGoal.progress,
        status: updatedGoal.status
      }
    };
  } catch (error) {
    logger.error('GoalTools', 'Operation failed', { error,
      operation: 'update_goal_progress',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update goal progress'
    };
  }
}

/**
 * Create a new dream
 */
async function executeCreateDream(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const title = args.title as string;
    const description = args.description as string | undefined;
    const category = args.category as string | undefined;
    const notes = args.notes as string | undefined;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'Dream title is required'
      };
    }

    logger.info('GoalTools', 'Creating dream', {
      title,
      category
    });

    // Map category to valid DreamCategory
    const validCategories: DreamCategory[] = ['travel', 'experiences', 'possessions', 'achievements', 'relationships', 'lifestyle'];
    const mappedCategory: DreamCategory = validCategories.includes(category as DreamCategory)
      ? (category as DreamCategory)
      : 'experiences';

    const dream = await createLifeDream({
      title: title.trim(),
      description,
      category: mappedCategory,
      visionBoardNotes: notes,
    });

    logger.info('GoalTools', 'Dream created successfully', {
      dreamId: dream.id,
      title: dream.title
    });

    return {
      success: true,
      dream_id: dream.id,
      message: `Dream "${dream.title}" created successfully! 🌟`,
      dream: {
        id: dream.id,
        title: dream.title,
        category: dream.category,
        description: dream.description
      }
    };
  } catch (error) {
    logger.error('GoalTools', 'Operation failed', { error,
      operation: 'create_dream',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create dream'
    };
  }
}

/**
 * Get all dreams
 */
async function executeGetDreams(
  _args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    logger.info('GoalTools', 'Getting dreams');

    const dreams = await getUserLifeDreams();

    logger.info('GoalTools', 'Dreams retrieved', {
      count: dreams.length
    });

    return {
      success: true,
      dreams: dreams.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        category: d.category,
        notes: d.visionBoardNotes,
        created_at: d.createdAt,
        last_updated: d.updatedAt
      })),
      count: dreams.length,
      message: `You have ${dreams.length} dream${dreams.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('GoalTools', 'Operation failed', { error,
      operation: 'get_dreams'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dreams'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const goalTools: Tool[] = [
  {
    definition: createGoalDefinition,
    execute: executeCreateGoal
  },
  {
    definition: getGoalsDefinition,
    execute: executeGetGoals
  },
  {
    definition: updateGoalProgressDefinition,
    execute: executeUpdateGoalProgress
  },
  {
    definition: createDreamDefinition,
    execute: executeCreateDream
  },
  {
    definition: getDreamsDefinition,
    execute: executeGetDreams
  }
];
