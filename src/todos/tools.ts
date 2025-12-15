/**
 * Tasks AI Tools
 *
 * AI tools for task management (create, get, update, complete, overview)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createTask, getTasks } from '@/api/tasksAPI';
import { logger } from '@/services/logger';
import { startOfWeek, addDays, isSameDay } from 'date-fns';
import type { TaskData } from '@/services/types';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createTaskDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_task',
    description: 'Create a new task or todo item. Requires title, optional due_date (ISO format YYYY-MM-DD), priority (low/medium/high/urgent), and estimated_hours.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title (required)'
        },
        due_date: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DD). Optional.'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Task priority level. Defaults to medium if not specified.'
        },
        estimated_hours: {
          type: 'number',
          description: 'Estimated hours to complete the task. Optional.'
        }
      },
      required: ['title']
    }
  }
};

const getWeekOverviewDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_week_overview',
    description: 'Get an overview of tasks, events, and commitments for the current week. Returns counts of tasks due this week, overdue tasks, high priority tasks, and tasks due today.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Create a new task
 */
async function executeCreateTask(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const title = args.title as string;
    const dueDate = args.due_date as string | undefined;
    const priority = (args.priority as TaskData['priority']) ?? 'medium';
    const estimatedHours = args.estimated_hours as number | undefined;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return {
        success: false,
        error: 'Task title is required'
      };
    }

    logger.info('TaskTools', 'Creating task', {
      title,
      priority,
      dueDate,
      estimatedHours
    });

    const task = await createTask({
      title: title.trim(),
      due_date: dueDate,
      priority,
      status: 'todo',
      deleted: false,
      archived: false,
      starred: false
    });

    logger.info('TaskTools', 'Task created successfully', {
      taskId: task.id,
      title: task.title
    });

    return {
      success: true,
      task_id: task.id,
      message: `Task "${task.title}" created successfully`,
      task: {
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status
      }
    };
  } catch (error) {
    logger.error('TaskTools', 'Operation failed', { error,
      operation: 'create_task',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    };
  }
}

/**
 * Get week overview of tasks
 */
async function executeGetWeekOverview(
  _args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    logger.info('TaskTools', 'Getting week overview');

    const tasks = await getTasks();
    const today = new Date();
    const weekEnd = addDays(today, 7);

    // Tasks due this week
    const thisWeekTasks = tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) >= today &&
      new Date(t.due_date) <= weekEnd
    );

    // Overdue tasks
    const overdueTasks = tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) < today &&
      t.status !== 'done'
    );

    // High priority tasks
    const highPriorityTasks = tasks.filter(t =>
      (t.priority === 'high' || t.priority === 'urgent') &&
      t.status !== 'done'
    );

    // Tasks due today
    const todayTasks = tasks.filter(t =>
      t.due_date && isSameDay(new Date(t.due_date), today)
    );

    logger.info('TaskTools', 'Week overview retrieved', {
      thisWeek: thisWeekTasks.length,
      overdue: overdueTasks.length,
      highPriority: highPriorityTasks.length,
      today: todayTasks.length
    });

    return {
      success: true,
      tasks_this_week: thisWeekTasks.length,
      overdue_tasks: overdueTasks.length,
      high_priority: highPriorityTasks.length,
      tasks_today: todayTasks.length,
      message: `You have ${todayTasks.length} task(s) due today, ${thisWeekTasks.length} this week, and ${overdueTasks.length} overdue`,
      details: {
        today_tasks: todayTasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority
        })),
        overdue_tasks: overdueTasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          due_date: t.due_date,
          priority: t.priority
        }))
      }
    };
  } catch (error) {
    logger.error('TaskTools', 'Operation failed', { error,
      operation: 'get_week_overview'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get week overview'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const taskTools: Tool[] = [
  {
    definition: createTaskDefinition,
    execute: executeCreateTask
  },
  {
    definition: getWeekOverviewDefinition,
    execute: executeGetWeekOverview
  }
];
