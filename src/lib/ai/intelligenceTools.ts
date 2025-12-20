/**
 * AI Intelligence Tools
 * 
 * Smart tools for morning briefings, weekly reports, pattern insights, and life coaching
 */

import type { Tool, ToolDefinition, ToolResult } from './toolRegistry';
import { contextAggregator } from '@/services/ai/ContextAggregator';
import { logger } from '@/services/logger';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const getMorningBriefingDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_morning_briefing',
    description: 'Get a personalized morning briefing with today\'s schedule, priorities, habit streaks at risk, and AI-generated suggestions. Call this when user asks "good morning", "what\'s my day look like", "morning briefing", or starts a new day.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

const getWeeklyReportDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_weekly_report',
    description: 'Get a comprehensive weekly productivity and wellness report with metrics, patterns, and recommendations. Call when user asks for "weekly report", "how did I do this week", "weekly summary".',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

const getPatternInsightsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_pattern_insights',
    description: 'Analyze user patterns and provide actionable insights. Call when user asks "what patterns do you see", "how can I improve", "give me insights".',
    parameters: {
      type: 'object',
      properties: {
        focus_area: {
          type: 'string',
          enum: ['productivity', 'habits', 'wellness', 'all'],
          description: 'Area to focus insights on. Defaults to "all".'
        }
      },
      required: []
    }
  }
};

const getSmartSuggestionsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_smart_suggestions',
    description: 'Get AI-powered suggestions based on current context, time of day, and user patterns. Call when user asks "what should I do", "any suggestions", "help me prioritize".',
    parameters: {
      type: 'object',
      properties: {
        max_suggestions: {
          type: 'number',
          description: 'Maximum number of suggestions to return. Defaults to 5.'
        }
      },
      required: []
    }
  }
};

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

async function executeGetMorningBriefing(
  _args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const context = await contextAggregator.getAggregatedContext(userId);
    const { today, patterns, upcomingEvents } = context;
    const now = new Date();
    const hour = now.getHours();

    // Determine greeting based on time
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';

    // Build briefing
    const briefing = {
      greeting,
      date: format(now, 'EEEE, MMMM d, yyyy'),
      
      // Today's overview
      schedule: {
        events_count: today.events.length,
        events: today.events.slice(0, 5).map(e => ({
          title: e.title,
          time: format(new Date(e.start_time), 'h:mm a'),
          location: e.location
        }))
      },
      
      // Tasks
      tasks: {
        total: today.tasks.total,
        completed: today.tasks.completed,
        overdue: today.tasks.overdue,
        high_priority: today.tasks.highPriority.slice(0, 3).map(t => t.title)
      },
      
      // Habits
      habits: {
        due: today.habits.due,
        completed: today.habits.completed,
        streaks_at_risk: today.habits.streaksAtRisk.map(h => ({
          name: h.name,
          streak: h.current_streak
        }))
      },
      
      // Focus goal based on patterns
      suggested_focus_minutes: Math.max(30, Math.round(patterns.avgFocusMinutes * 1.1)),
      
      // Suggestions based on context
      suggestions: [] as string[]
    };

    // Generate contextual suggestions
    if (today.tasks.overdue > 0) {
      briefing.suggestions.push(`You have ${today.tasks.overdue} overdue task(s) - consider tackling these first`);
    }
    
    if (today.habits.streaksAtRisk.length > 0) {
      briefing.suggestions.push(`Don't break your ${today.habits.streaksAtRisk[0].name} streak (${today.habits.streaksAtRisk[0].current_streak} days)`);
    }
    
    if (today.events.length > 3) {
      briefing.suggestions.push('Busy day ahead - block some focus time between meetings');
    }
    
    if (patterns.habitCompletionRate < 70) {
      briefing.suggestions.push('Try completing habits earlier in the day for better consistency');
    }

    logger.info('IntelligenceTools', 'Morning briefing generated', { userId });

    return {
      success: true,
      briefing,
      message: `${greeting}! Here's your briefing for ${briefing.date}`
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'morning_briefing' });
    return {
      success: false,
      error: 'Failed to generate morning briefing'
    };
  }
}

async function executeGetWeeklyReport(
  _args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const context = await contextAggregator.getAggregatedContext(userId);
    const { patterns } = context;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const report = {
      period: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,

      productivity: {
        avg_tasks_per_day: patterns.avgTasksPerDay,
        avg_focus_minutes: patterns.avgFocusMinutes,
        most_productive_hour: patterns.mostProductiveHour,
        most_productive_day: patterns.mostProductiveDay
      },

      habits: {
        completion_rate: patterns.habitCompletionRate,
        best_streak: patterns.bestHabitStreak
      },

      wellness: {
        avg_mood: patterns.avgMood,
        avg_energy: patterns.avgEnergy
      },

      // Performance insights
      insights: [] as string[],

      // Recommendations for next week
      recommendations: [] as string[]
    };

    // Generate insights
    if (patterns.avgTasksPerDay > 5) {
      report.insights.push(`High productivity week! Averaging ${patterns.avgTasksPerDay} tasks/day`);
    } else if (patterns.avgTasksPerDay < 2) {
      report.insights.push('Lower task completion this week - consider breaking tasks into smaller pieces');
    }

    if (patterns.habitCompletionRate >= 80) {
      report.insights.push(`Excellent habit consistency at ${patterns.habitCompletionRate}%! 🌟`);
    } else if (patterns.habitCompletionRate < 50) {
      report.insights.push(`Habit completion at ${patterns.habitCompletionRate}% - room for improvement`);
    }

    if (patterns.avgFocusMinutes >= 60) {
      report.insights.push(`Great focus sessions averaging ${patterns.avgFocusMinutes} minutes/day`);
    }

    // Generate recommendations
    if (patterns.avgFocusMinutes < 30) {
      report.recommendations.push('Try scheduling 2-3 dedicated focus blocks next week');
    }

    if (patterns.habitCompletionRate < 70) {
      report.recommendations.push('Set morning reminders for habits to build consistency');
    }

    if (patterns.avgMood && patterns.avgMood < 3) {
      report.recommendations.push('Consider adding mood-boosting activities like walks or meditation');
    }

    report.recommendations.push('Review your goals and adjust priorities for next week');

    logger.info('IntelligenceTools', 'Weekly report generated', { userId });

    return {
      success: true,
      report,
      message: `Here's your weekly report for ${report.period}`
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'weekly_report' });
    return {
      success: false,
      error: 'Failed to generate weekly report'
    };
  }
}

async function executeGetPatternInsights(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const focusArea = (args.focus_area as string) || 'all';
    const context = await contextAggregator.getAggregatedContext(userId);
    const { today, patterns } = context;

    const insights: Array<{ area: string; observation: string; suggestion: string }> = [];

    // Productivity insights
    if (focusArea === 'all' || focusArea === 'productivity') {
      if (patterns.avgTasksPerDay > 0) {
        insights.push({
          area: 'productivity',
          observation: `You complete an average of ${patterns.avgTasksPerDay} tasks per day`,
          suggestion: patterns.avgTasksPerDay < 3
            ? 'Try breaking large tasks into smaller subtasks to increase completion rate'
            : 'Great pace! Consider batch-processing similar tasks'
        });
      }

      if (patterns.avgFocusMinutes > 0) {
        insights.push({
          area: 'productivity',
          observation: `You focus for an average of ${patterns.avgFocusMinutes} minutes daily`,
          suggestion: patterns.avgFocusMinutes < 45
            ? 'Try the Pomodoro technique: 25 min focus + 5 min break'
            : 'Excellent focus! Consider deep work blocks of 90 minutes'
        });
      }
    }

    // Habit insights
    if (focusArea === 'all' || focusArea === 'habits') {
      insights.push({
        area: 'habits',
        observation: `Your habit completion rate is ${patterns.habitCompletionRate}%`,
        suggestion: patterns.habitCompletionRate < 70
          ? 'Stack new habits with existing routines (habit stacking)'
          : 'Strong consistency! Ready to add a new challenging habit?'
      });

      if (today.habits.streaksAtRisk.length > 0) {
        insights.push({
          area: 'habits',
          observation: `${today.habits.streaksAtRisk.length} habit streak(s) at risk today`,
          suggestion: `Prioritize: ${today.habits.streaksAtRisk.map(h => h.name).join(', ')}`
        });
      }
    }

    // Wellness insights
    if (focusArea === 'all' || focusArea === 'wellness') {
      if (patterns.avgMood !== null) {
        insights.push({
          area: 'wellness',
          observation: `Your average mood is ${patterns.avgMood?.toFixed(1)}/5`,
          suggestion: patterns.avgMood && patterns.avgMood < 3.5
            ? 'Consider journaling or mindfulness exercises to boost mood'
            : 'Great emotional balance! Keep up your self-care routines'
        });
      }

      if (!today.wellness.journalEntryToday) {
        insights.push({
          area: 'wellness',
          observation: 'No journal entry today',
          suggestion: 'Even a brief reflection can improve self-awareness and reduce stress'
        });
      }
    }

    return {
      success: true,
      focus_area: focusArea,
      insights,
      message: `Found ${insights.length} insight(s) for ${focusArea}`
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'pattern_insights' });
    return {
      success: false,
      error: 'Failed to analyze patterns'
    };
  }
}

async function executeGetSmartSuggestions(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const maxSuggestions = (args.max_suggestions as number) || 5;
    const context = await contextAggregator.getAggregatedContext(userId);
    const { today, patterns } = context;
    const now = new Date();
    const hour = now.getHours();

    const suggestions: Array<{ priority: number; action: string; reason: string }> = [];

    // Time-based suggestions
    if (hour < 12) {
      // Morning suggestions
      if (today.habits.streaksAtRisk.length > 0) {
        suggestions.push({
          priority: 1,
          action: `Complete your ${today.habits.streaksAtRisk[0].name} habit`,
          reason: `Protect your ${today.habits.streaksAtRisk[0].current_streak}-day streak!`
        });
      }

      if (today.tasks.highPriority.length > 0) {
        suggestions.push({
          priority: 2,
          action: `Tackle "${today.tasks.highPriority[0].title}"`,
          reason: 'High priority task - best to do when energy is fresh'
        });
      }
    } else if (hour < 17) {
      // Afternoon suggestions
      if (today.focus.sessionsToday < 2) {
        suggestions.push({
          priority: 2,
          action: 'Start a 25-minute focus session',
          reason: 'Boost your afternoon productivity'
        });
      }
    } else {
      // Evening suggestions
      if (!today.wellness.journalEntryToday) {
        suggestions.push({
          priority: 3,
          action: 'Write a quick journal entry',
          reason: 'Reflect on your day before it ends'
        });
      }

      const incompleteHabits = today.habits.due - today.habits.completed;
      if (incompleteHabits > 0) {
        suggestions.push({
          priority: 2,
          action: `Complete ${incompleteHabits} remaining habit(s)`,
          reason: 'Last chance before the day ends!'
        });
      }
    }

    // Context-based suggestions
    if (today.tasks.overdue > 0) {
      suggestions.push({
        priority: 1,
        action: `Address ${today.tasks.overdue} overdue task(s)`,
        reason: 'Clearing overdue items reduces stress'
      });
    }

    if (today.events.length === 0 && patterns.avgFocusMinutes > 0) {
      suggestions.push({
        priority: 3,
        action: 'Schedule a deep work session',
        reason: 'Clear calendar = perfect for focused work'
      });
    }

    // Sort by priority and limit
    suggestions.sort((a, b) => a.priority - b.priority);
    const topSuggestions = suggestions.slice(0, maxSuggestions);

    return {
      success: true,
      suggestions: topSuggestions,
      count: topSuggestions.length,
      message: `Here are ${topSuggestions.length} suggestions based on your current context`
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'smart_suggestions' });
    return {
      success: false,
      error: 'Failed to generate suggestions'
    };
  }
}

// =====================================================
// QUICK CAPTURE TOOL
// =====================================================

const quickCaptureDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'quick_capture',
    description: 'Capture a thought, idea, reminder, or note to the inbox for later processing. Use for "remind me to...", "note to self...", "I need to remember...", "add to my inbox...", or any quick capture request.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to capture (required)'
        },
        source: {
          type: 'string',
          enum: ['voice', 'manual'],
          description: 'Source of the capture. Default: voice'
        }
      },
      required: ['content']
    }
  }
};

async function executeQuickCapture(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const content = args.content as string;
    const source = (args.source as string) || 'voice';

    // Import dynamically to avoid circular dependencies
    const { createInboxItem } = await import('@/services/inbox');

    const item = await createInboxItem({
      content,
      source: source as 'voice' | 'manual',
    });

    logger.info('IntelligenceTools', 'Quick capture via AI', {
      itemId: item.id,
      suggestedType: item.suggested_type,
    });

    return {
      success: true,
      data: {
        message: `Captured to inbox: "${content}"`,
        itemId: item.id,
        suggestedType: item.suggested_type,
        suggestedPriority: item.suggested_priority,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeQuickCapture' });
    return {
      success: false,
      error: `Failed to capture: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const intelligenceTools: Tool[] = [
  {
    definition: getMorningBriefingDefinition,
    execute: executeGetMorningBriefing
  },
  {
    definition: getWeeklyReportDefinition,
    execute: executeGetWeeklyReport
  },
  {
    definition: getPatternInsightsDefinition,
    execute: executeGetPatternInsights
  },
  {
    definition: getSmartSuggestionsDefinition,
    execute: executeGetSmartSuggestions
  },
  {
    definition: quickCaptureDefinition,
    execute: executeQuickCapture
  }
];

