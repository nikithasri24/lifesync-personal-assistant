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
// PLAN MY WEEK TOOL
// =====================================================

const planMyWeekDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'plan_my_week',
    description: 'Get an overview of the upcoming week with events, tasks, goals, and planning suggestions. Use for "plan my week", "what does my week look like?", "help me plan next week".',
    parameters: {
      type: 'object',
      properties: {
        weekOffset: {
          type: 'number',
          description: 'Week offset from current week. 0 = this week, 1 = next week. Default: 0'
        }
      },
      required: []
    }
  }
};

async function executePlanMyWeek(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const weekOffset = (args.weekOffset as number) || 0;

    const { getWeeklyOverview, getPlanningsuggestions } = await import('@/services/planning');

    const overview = await getWeeklyOverview(weekOffset);
    const suggestions = await getPlanningsuggestions();

    logger.info('IntelligenceTools', 'Plan my week via AI', {
      weekOffset,
      eventCount: overview.eventCount,
      tasksDue: overview.tasksDue.length,
    });

    return {
      success: true,
      data: {
        weekStart: overview.weekStart,
        weekEnd: overview.weekEnd,
        summary: {
          events: overview.eventCount,
          tasksDue: overview.tasksDue.length,
          tasksOverdue: overview.tasksOverdue.length,
          unscheduledTasks: overview.unscheduledTasks.length,
          activeGoals: overview.activeGoals.length,
          billsDue: overview.billsDue.length,
          workload: overview.estimatedWorkload,
        },
        busyDays: overview.busyDays,
        warnings: overview.warnings,
        suggestions,
        topTasks: overview.tasksDue.slice(0, 5).map(t => ({
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
        })),
        goalCheckIns: overview.goalCheckIns,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executePlanMyWeek' });
    return {
      success: false,
      error: `Failed to plan week: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// UPCOMING BIRTHDAYS/ANNIVERSARIES TOOL
// =====================================================

const getUpcomingDatesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_upcoming_dates',
    description: 'Get upcoming birthdays, anniversaries, and other important dates. Use for "any birthdays coming up?", "whose birthday is this month?", "upcoming anniversaries".',
    parameters: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'number',
          description: 'Number of days to look ahead. Default: 30'
        }
      },
      required: []
    }
  }
};

async function executeGetUpcomingDates(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const daysAhead = (args.daysAhead as number) || 30;

    const { getUpcomingDates, getDatesSummary } = await import('@/services/dates');

    const upcoming = await getUpcomingDates(daysAhead);
    const summary = await getDatesSummary();

    logger.info('IntelligenceTools', 'Get upcoming dates via AI', {
      daysAhead,
      count: upcoming.length,
    });

    return {
      success: true,
      data: {
        upcoming: upcoming.map(d => ({
          personName: d.person_name,
          type: d.date_type,
          date: `${d.month}/${d.day}`,
          daysUntil: d.days_until,
          age: d.age,
          relationship: d.relationship,
          giftIdeas: d.gift_ideas,
        })),
        summary: {
          totalDates: summary.totalDates,
          upcomingThisWeek: summary.upcomingThisWeek.length,
          upcomingThisMonth: summary.upcomingThisMonth.length,
          byType: summary.byType,
        },
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeGetUpcomingDates' });
    return {
      success: false,
      error: `Failed to get upcoming dates: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// GET MY PATTERNS TOOL
// =====================================================

const getMyPatternsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_my_patterns',
    description: 'Analyze user behavior patterns over time. Use for "what are my productivity patterns?", "when am I most productive?", "what are my habits like?", "analyze my behavior".',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to analyze. Default: 30'
        },
        focus: {
          type: 'string',
          enum: ['all', 'productivity', 'habits', 'spending'],
          description: 'Which patterns to focus on. Default: all'
        }
      },
      required: []
    }
  }
};

async function executeGetMyPatterns(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const days = (args.days as number) || 30;
    const focus = (args.focus as string) || 'all';

    const { userPatternService } = await import('@/services/ai/UserPatternService');

    const analysis = await userPatternService.getFullAnalysis(userId, days);

    logger.info('IntelligenceTools', 'Get my patterns via AI', {
      days,
      focus,
      insightCount: analysis.insights.length,
    });

    // Filter based on focus
    let data: Record<string, unknown> = {
      insights: analysis.insights,
      analyzedDays: analysis.analyzedDays,
    };

    if (focus === 'all' || focus === 'productivity') {
      data.productivity = {
        peakHours: analysis.productivity.peakHours.slice(0, 3).map(h => ({
          hour: h.hour,
          percentage: h.percentage,
        })),
        peakDays: analysis.productivity.peakDays.slice(0, 3).map(d => ({
          day: d.day,
          percentage: d.percentage,
        })),
        averageTasksPerDay: analysis.productivity.averageTasksPerDay,
        taskCompletionRate: analysis.productivity.taskCompletionRate,
      };
    }

    if (focus === 'all' || focus === 'habits') {
      data.habits = analysis.habits.slice(0, 5).map(h => ({
        name: h.habitName,
        completionRate: h.completionRate,
        preferredDays: h.preferredDays,
      }));
    }

    if (focus === 'all' || focus === 'spending') {
      data.spending = {
        highSpendingDays: analysis.spending.highSpendingDays,
        weekdayAvg: analysis.spending.averageWeekdaySpending,
        weekendAvg: analysis.spending.averageWeekendSpending,
        topCategories: analysis.spending.topCategories.slice(0, 3),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeGetMyPatterns' });
    return {
      success: false,
      error: `Failed to analyze patterns: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// GET PREDICTIONS TOOL
// =====================================================

const getPredictionsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_predictions',
    description: 'Get proactive predictions and suggestions. Use for "what should I focus on?", "any warnings?", "what\'s coming up that I should know about?", "give me suggestions".',
    parameters: {
      type: 'object',
      properties: {
        daysAhead: {
          type: 'number',
          description: 'Number of days to look ahead. Default: 7'
        }
      },
      required: []
    }
  }
};

async function executeGetPredictions(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const daysAhead = (args.daysAhead as number) || 7;

    const { predictionService } = await import('@/services/ai/PredictionService');

    const predictions = await predictionService.generatePredictions(userId, daysAhead);
    const suggestions = await predictionService.getSmartSuggestions(userId);

    logger.info('IntelligenceTools', 'Get predictions via AI', {
      daysAhead,
      predictionCount: predictions.length,
    });

    return {
      success: true,
      data: {
        predictions: predictions.slice(0, 10).map(p => ({
          type: p.type,
          priority: p.priority,
          title: p.title,
          message: p.message,
          suggestedAction: p.suggestedAction,
        })),
        suggestions,
        summary: {
          total: predictions.length,
          highPriority: predictions.filter(p => p.priority === 'high').length,
          mediumPriority: predictions.filter(p => p.priority === 'medium').length,
        },
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeGetPredictions' });
    return {
      success: false,
      error: `Failed to get predictions: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// LIFE COACH TOOL
// =====================================================

const lifeCoachDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'life_coach',
    description: 'Get personalized coaching insights and weekly check-in. Use for "how am I doing?", "give me a weekly review", "coach me", "what should I improve?", "celebrate my wins".',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Specific coaching question. If not provided, returns weekly check-in.'
        },
        mode: {
          type: 'string',
          enum: ['check_in', 'coaching'],
          description: 'Mode: check_in for weekly summary, coaching for specific advice. Default: check_in'
        }
      },
      required: []
    }
  }
};

async function executeLifeCoach(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const question = args.question as string | undefined;
    const mode = (args.mode as string) || 'check_in';

    const { lifeCoachService } = await import('@/services/ai/LifeCoachService');

    if (mode === 'coaching' && question) {
      const response = await lifeCoachService.getCoachingResponse(userId, question);

      logger.info('IntelligenceTools', 'Life coach response via AI', { mode, question });

      return {
        success: true,
        data: {
          message: response.message,
          insights: response.insights,
          suggestedActions: response.suggestedActions,
        },
      };
    }

    // Default: weekly check-in
    const checkIn = await lifeCoachService.generateWeeklyCheckIn(userId);

    logger.info('IntelligenceTools', 'Weekly check-in via AI', {
      overallScore: checkIn.overallScore,
      winsCount: checkIn.wins.length,
    });

    return {
      success: true,
      data: {
        period: `${checkIn.weekStart} to ${checkIn.weekEnd}`,
        scores: {
          overall: checkIn.overallScore,
          productivity: checkIn.productivityScore,
          habits: checkIn.habitScore,
          wellness: checkIn.wellnessScore,
          balance: checkIn.balanceScore,
        },
        wins: checkIn.wins,
        improvements: checkIn.improvements,
        advice: checkIn.advice.map(a => ({
          category: a.category,
          title: a.title,
          message: a.message,
        })),
        encouragement: checkIn.encouragement,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeLifeCoach' });
    return {
      success: false,
      error: `Failed to get coaching: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// AUTO-CATEGORIZE TOOL
// =====================================================

const autoCategorizeDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'auto_categorize',
    description: 'Automatically categorize content (tasks, expenses, notes). Use when user adds items without explicit category.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to categorize'
        },
        type: {
          type: 'string',
          enum: ['task', 'expense', 'note', 'inbox_item'],
          description: 'Type of content to categorize'
        }
      },
      required: ['content', 'type']
    }
  }
};

async function executeAutoCategorize(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const content = args.content as string;
    const type = args.type as 'task' | 'expense' | 'note' | 'inbox_item';

    const { autoCategorizationService } = await import('@/services/ai/AutoCategorizationService');

    const result = autoCategorizationService.categorize(content, type);
    const priority = autoCategorizationService.suggestPriority(content);

    logger.info('IntelligenceTools', 'Auto-categorize via AI', {
      type,
      category: result.category,
      confidence: result.confidence,
    });

    return {
      success: true,
      data: {
        category: result.category,
        confidence: result.confidence,
        subcategory: result.subcategory,
        tags: result.tags,
        suggestedPriority: priority,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeAutoCategorize' });
    return {
      success: false,
      error: `Failed to categorize: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// SENTIMENT ANALYSIS TOOL
// =====================================================

const analyzeSentimentDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'analyze_sentiment',
    description: 'Analyze mood and sentiment from journal entries. Use for "how have I been feeling?", "what are my emotional patterns?", "analyze my mood".',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Optional specific text to analyze. If not provided, analyzes recent journal entries.'
        },
        days: {
          type: 'number',
          description: 'Number of days to analyze. Default: 30'
        }
      },
      required: []
    }
  }
};

async function executeAnalyzeSentiment(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const text = args.text as string | undefined;
    const days = (args.days as number) || 30;

    const { sentimentAnalysisService } = await import('@/services/ai/SentimentAnalysisService');

    if (text) {
      // Analyze specific text
      const result = sentimentAnalysisService.analyzeSentiment(text);

      logger.info('IntelligenceTools', 'Analyze sentiment (text) via AI', {
        sentiment: result.sentiment,
      });

      return {
        success: true,
        data: {
          sentiment: result.sentiment,
          score: result.score,
          emotions: result.emotions,
          keywords: result.keywords,
        },
      };
    }

    // Analyze journal entries
    const insights = await sentimentAnalysisService.getJournalInsights(userId, days);

    logger.info('IntelligenceTools', 'Analyze sentiment (journal) via AI', {
      trend: insights.sentimentTrend,
      avgSentiment: insights.averageSentiment,
    });

    return {
      success: true,
      data: {
        averageSentiment: insights.averageSentiment,
        trend: insights.sentimentTrend,
        dominantEmotions: insights.dominantEmotions,
        recommendations: insights.recommendations,
        moodTrends: insights.moodTrends.slice(-7), // Last 7 days
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeAnalyzeSentiment' });
    return {
      success: false,
      error: `Failed to analyze sentiment: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// RECALL MEMORY TOOL
// =====================================================

const recallMemoryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'recall_memory',
    description: 'Recall past conversations and context. Use for "what did I mention about...", "last time we talked about...", "remember when I said...".',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Topic or keyword to search for in past conversations'
        },
        mode: {
          type: 'string',
          enum: ['search', 'context'],
          description: 'Mode: search for specific topic, or context for recent conversation context. Default: search'
        }
      },
      required: []
    }
  }
};

async function executeRecallMemory(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const query = args.query as string | undefined;
    const mode = (args.mode as string) || 'search';

    const { contextualMemoryService } = await import('@/services/ai/ContextualMemoryService');

    if (mode === 'context' || !query) {
      // Get recent conversation context
      const context = await contextualMemoryService.getConversationContext(userId, 14);

      logger.info('IntelligenceTools', 'Recall memory (context) via AI', {
        topicCount: context.recentTopics.length,
      });

      return {
        success: true,
        data: {
          recentTopics: context.recentTopics,
          mentionedEntities: context.mentionedEntities.slice(0, 5),
          emotionalContext: context.emotionalContext,
          lastMentioned: context.lastMentioned,
        },
      };
    }

    // Search for specific topic
    const result = await contextualMemoryService.searchMemories(userId, query, 5);

    logger.info('IntelligenceTools', 'Recall memory (search) via AI', {
      query,
      resultCount: result.memories.length,
    });

    return {
      success: true,
      data: {
        memories: result.memories.map(m => ({
          date: m.date,
          topic: m.topic,
          summary: m.summary,
        })),
        relevantContext: result.relevantContext,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeRecallMemory' });
    return {
      success: false,
      error: `Failed to recall memory: ${(error as Error).message}`,
    };
  }
}

// =====================================================
// BILLS DUE TOOL
// =====================================================

const getBillsDueDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_bills_due',
    description: 'Get upcoming bills and their due dates. Use for "what bills are due this week?", "any bills coming up?", "how much do I owe this month?"',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['this_week', 'upcoming', 'all'],
          description: 'Timeframe for bills. Default: this_week'
        }
      },
      required: []
    }
  }
};

async function executeGetBillsDue(
  args: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  try {
    const timeframe = (args.timeframe as string) || 'this_week';

    // Import dynamically to avoid circular dependencies
    const { getBillsDueThisWeek, getUpcomingBills, getBills, getBillSummary } = await import('@/services/bills');

    let bills;
    if (timeframe === 'this_week') {
      bills = await getBillsDueThisWeek();
    } else if (timeframe === 'upcoming') {
      bills = await getUpcomingBills();
    } else {
      bills = await getBills(true);
    }

    const summary = await getBillSummary();

    logger.info('IntelligenceTools', 'Bills due query via AI', {
      timeframe,
      billCount: bills.length,
    });

    return {
      success: true,
      data: {
        bills: bills.map(b => ({
          name: b.name,
          amount: b.amount,
          dueDate: b.due_date,
          isAutoPay: b.is_auto_pay,
          category: b.category,
        })),
        summary: {
          totalMonthly: summary.totalMonthly,
          overdueCount: summary.overdueCount,
          subscriptionTotal: summary.subscriptionTotal,
        },
        message: bills.length === 0
          ? 'No bills due in this timeframe.'
          : `You have ${bills.length} bill(s) ${timeframe === 'this_week' ? 'due this week' : 'upcoming'}.`,
      },
    };
  } catch (error) {
    logger.error('IntelligenceTools', error as Error, { context: 'executeGetBillsDue' });
    return {
      success: false,
      error: `Failed to get bills: ${(error as Error).message}`,
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
  },
  {
    definition: getBillsDueDefinition,
    execute: executeGetBillsDue
  },
  {
    definition: planMyWeekDefinition,
    execute: executePlanMyWeek
  },
  {
    definition: getUpcomingDatesDefinition,
    execute: executeGetUpcomingDates
  },
  {
    definition: getMyPatternsDefinition,
    execute: executeGetMyPatterns
  },
  {
    definition: getPredictionsDefinition,
    execute: executeGetPredictions
  },
  {
    definition: lifeCoachDefinition,
    execute: executeLifeCoach
  },
  {
    definition: autoCategorizeDefinition,
    execute: executeAutoCategorize
  },
  {
    definition: analyzeSentimentDefinition,
    execute: executeAnalyzeSentiment
  },
  {
    definition: recallMemoryDefinition,
    execute: executeRecallMemory
  }
];

