/**
 * Focus AI Tools
 *
 * AI tools for focus session management (Pomodoro, deep work, stats)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getFocusSessions,
  createFocusSession,
  updateFocusSession,
} from '@/api/focusAPI';
import { logger } from '@/services/logger';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const startFocusSessionDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'start_focus_session',
    description:
      'Start a new focus session. Optional: type ("pomodoro", "deep-work", "custom"), duration_minutes (number, defaults to 25 for pomodoro, 90 for deep-work), task_id (string UUID), notes (string).',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['pomodoro', 'deep-work', 'custom'],
          description:
            'Type of focus session - optional, defaults to "pomodoro"',
        },
        duration_minutes: {
          type: 'number',
          description:
            'Duration in minutes - optional, defaults to 25 for pomodoro, 90 for deep-work, 60 for custom',
        },
        task_id: {
          type: 'string',
          description: 'UUID of the task to focus on - optional',
        },
        notes: {
          type: 'string',
          description: 'Notes about what you plan to work on - optional',
        },
        mood_before: {
          type: 'string',
          description: 'Mood before starting session - optional',
        },
      },
    },
  },
};

const completeFocusSessionDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'complete_focus_session',
    description:
      'Complete an active focus session. Requires session_id (string UUID). Optional: productivity_score (1-10), mood_after (string), notes (string).',
    parameters: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'UUID of the focus session to complete - required',
        },
        productivity_score: {
          type: 'number',
          description:
            'Rate your productivity from 1 (low) to 10 (high) - optional',
        },
        mood_after: {
          type: 'string',
          description: 'How you feel after the session - optional',
        },
        notes: {
          type: 'string',
          description: 'Notes about the session - optional',
        },
        breaks_taken: {
          type: 'number',
          description: 'Number of breaks taken during the session - optional',
        },
        distractions: {
          type: 'number',
          description: 'Number of distractions encountered - optional',
        },
      },
      required: ['session_id'],
    },
  },
};

const getFocusStatsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_focus_stats',
    description:
      'Get focus session statistics. Optional: days (number) for how many days back to include (defaults to 7).',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description:
            'Number of days to include in stats - optional, defaults to 7',
        },
      },
    },
  },
};

const getFocusHistoryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_focus_history',
    description:
      'Get recent focus session history. Optional: limit (number) for max sessions to return (defaults to 10), status ("in-progress", "completed", "abandoned") to filter by status.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description:
            'Maximum number of sessions to return - optional, defaults to 10',
        },
        status: {
          type: 'string',
          enum: ['in-progress', 'completed', 'abandoned'],
          description: 'Filter by session status - optional',
        },
      },
    },
  },
};

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Start a new focus session
 */
async function executeStartFocusSession(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const type = (args.type as 'pomodoro' | 'deep-work' | 'custom') ?? 'pomodoro';
    const taskId = args.task_id as string | undefined;
    const notes = args.notes as string | undefined;
    const moodBefore = args.mood_before as string | undefined;

    // Set default duration based on type
    let durationMinutes = args.duration_minutes as number | undefined;
    if (!durationMinutes) {
      durationMinutes = type === 'pomodoro' ? 25 : type === 'deep-work' ? 90 : 60;
    }

    logger.info('FocusTools', 'Starting focus session', {
      type,
      durationMinutes,
      taskId,
    });

    const session = await createFocusSession({
      type,
      duration_minutes: durationMinutes,
      task_id: taskId ?? null,
      started_at: new Date().toISOString(),
      status: 'in-progress',
      notes: notes ?? null,
      mood_before: moodBefore ?? null,
    });

    logger.info('FocusTools', 'Focus session started', {
      sessionId: session.id,
      type: session.type,
      duration: session.duration_minutes,
    });

    return {
      success: true,
      session_id: session.id,
      message: `Started ${session.type} session for ${session.duration_minutes} minutes`,
      session: {
        id: session.id,
        type: session.type,
        duration_minutes: session.duration_minutes,
        started_at: session.started_at,
        task_id: session.task_id,
      },
    };
  } catch (error) {
    logger.error('FocusTools', 'Operation failed', { error,
      operation: 'start_focus_session',
      args,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start focus session',
    };
  }
}

/**
 * Complete a focus session
 */
async function executeCompleteFocusSession(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const sessionId = args.session_id as string;
    const productivityScore = args.productivity_score as number | undefined;
    const moodAfter = args.mood_after as string | undefined;
    const notes = args.notes as string | undefined;
    const breaksTaken = args.breaks_taken as number | undefined;
    const distractions = args.distractions as number | undefined;

    // Validate
    if (!sessionId || sessionId.trim().length === 0) {
      return {
        success: false,
        error: 'Session ID is required',
      };
    }

    // Validate productivity score if provided
    if (productivityScore !== undefined && (productivityScore < 1 || productivityScore > 10)) {
      return {
        success: false,
        error: 'Productivity score must be between 1 and 10',
      };
    }

    logger.info('FocusTools', 'Completing focus session', {
      sessionId,
      productivityScore,
      moodAfter,
    });

    // Get the session to calculate actual duration
    const sessions = await getFocusSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return {
        success: false,
        error: `Focus session with ID "${sessionId}" not found`,
      };
    }

    // Calculate actual duration in seconds
    const startTime = new Date(session.started_at).getTime();
    const endTime = Date.now();
    const actualDurationSeconds = Math.floor((endTime - startTime) / 1000);

    const updated = await updateFocusSession(sessionId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_duration_seconds: actualDurationSeconds,
      productivity_score: productivityScore ?? null,
      mood_after: moodAfter ?? null,
      notes: notes ?? session.notes,
      breaks_taken: breaksTaken ?? session.breaks_taken,
      distractions: distractions ?? session.distractions,
    });

    logger.info('FocusTools', 'Focus session completed', {
      sessionId: updated.id,
      actualDurationMinutes: Math.round(actualDurationSeconds / 60),
      productivityScore: updated.productivity_score,
    });

    const actualMinutes = Math.round(actualDurationSeconds / 60);

    return {
      success: true,
      message: `Completed ${session.type} session (${actualMinutes} minutes)${productivityScore ? `, productivity: ${productivityScore}/10` : ''}`,
      session: {
        id: updated.id,
        type: updated.type,
        duration_minutes: updated.duration_minutes,
        actual_duration_minutes: actualMinutes,
        productivity_score: updated.productivity_score,
        mood_after: updated.mood_after,
      },
    };
  } catch (error) {
    logger.error('FocusTools', 'Operation failed', { error,
      operation: 'complete_focus_session',
      args,
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to complete focus session',
    };
  }
}

/**
 * Get focus statistics
 */
async function executeGetFocusStats(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const days = (args.days as number) ?? 7;

    logger.info('FocusTools', 'Getting focus stats', { days });

    const sessions = await getFocusSessions();

    // Filter by date range
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const filteredSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.started_at);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const completedSessions = filteredSessions.filter((s) => s.status === 'completed');
    const abandonedSessions = filteredSessions.filter((s) => s.status === 'abandoned');
    const inProgressSessions = filteredSessions.filter((s) => s.status === 'in-progress');

    // Calculate total focus time (use actual duration if available, otherwise planned)
    const totalFocusMinutes = completedSessions.reduce((total, s) => {
      const minutes = s.actual_duration_seconds
        ? s.actual_duration_seconds / 60
        : s.duration_minutes;
      return total + minutes;
    }, 0);

    const averageMinutes =
      completedSessions.length > 0 ? totalFocusMinutes / completedSessions.length : 0;

    // Calculate average productivity score
    const sessionsWithScore = completedSessions.filter((s) => s.productivity_score !== null);
    const averageProductivity =
      sessionsWithScore.length > 0
        ? sessionsWithScore.reduce((sum, s) => sum + (s.productivity_score ?? 0), 0) /
          sessionsWithScore.length
        : null;

    // Count by type
    const pomodoroCount = completedSessions.filter((s) => s.type === 'pomodoro').length;
    const deepWorkCount = completedSessions.filter((s) => s.type === 'deep-work').length;
    const customCount = completedSessions.filter((s) => s.type === 'custom').length;

    logger.info('FocusTools', 'Focus stats calculated', {
      totalSessions: filteredSessions.length,
      completedSessions: completedSessions.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
    });

    return {
      success: true,
      stats: {
        total_sessions: filteredSessions.length,
        completed_sessions: completedSessions.length,
        abandoned_sessions: abandonedSessions.length,
        in_progress_sessions: inProgressSessions.length,
        total_focus_minutes: Math.round(totalFocusMinutes),
        average_session_minutes: Math.round(averageMinutes),
        average_productivity: averageProductivity
          ? Math.round(averageProductivity * 10) / 10
          : null,
        sessions_by_type: {
          pomodoro: pomodoroCount,
          deep_work: deepWorkCount,
          custom: customCount,
        },
      },
      message: `In the last ${days} days: ${completedSessions.length} sessions completed, ${Math.round(totalFocusMinutes)} minutes of focused work`,
    };
  } catch (error) {
    logger.error('FocusTools', 'Operation failed', { error,
      operation: 'get_focus_stats',
      args,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get focus stats',
    };
  }
}

/**
 * Get focus history
 */
async function executeGetFocusHistory(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 10;
    const status = args.status as 'in-progress' | 'completed' | 'abandoned' | undefined;

    logger.info('FocusTools', 'Getting focus history', { limit, status });

    const sessions = await getFocusSessions();

    // Filter by status if provided
    const filteredSessions = status
      ? sessions.filter((s) => s.status === status)
      : sessions;

    // Limit results
    const limitedSessions = filteredSessions.slice(0, limit);

    logger.info('FocusTools', 'Focus history retrieved', {
      count: limitedSessions.length,
    });

    return {
      success: true,
      sessions: limitedSessions.map((s) => ({
        id: s.id,
        type: s.type,
        duration_minutes: s.duration_minutes,
        actual_duration_minutes: s.actual_duration_seconds
          ? Math.round(s.actual_duration_seconds / 60)
          : null,
        started_at: s.started_at,
        completed_at: s.completed_at,
        status: s.status,
        productivity_score: s.productivity_score,
        task_id: s.task_id,
        notes: s.notes,
      })),
      count: limitedSessions.length,
      message: `Showing ${limitedSessions.length} recent focus session${limitedSessions.length !== 1 ? 's' : ''}`,
    };
  } catch (error) {
    logger.error('FocusTools', 'Operation failed', { error,
      operation: 'get_focus_history',
      args,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get focus history',
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const focusTools: Tool[] = [
  {
    definition: startFocusSessionDefinition,
    execute: executeStartFocusSession,
  },
  {
    definition: completeFocusSessionDefinition,
    execute: executeCompleteFocusSession,
  },
  {
    definition: getFocusStatsDefinition,
    execute: executeGetFocusStats,
  },
  {
    definition: getFocusHistoryDefinition,
    execute: executeGetFocusHistory,
  },
];
