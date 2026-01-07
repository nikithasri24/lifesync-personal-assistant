/**
 * Journal AI Tools
 *
 * AI tools for journaling and mood tracking
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createJournalEntry, getJournalEntries, getMoodStats } from '@/api/journalAPI';
import { logger } from '@/services/logger';
import type { JournalMood } from '@/types';
import { startOfWeek, startOfMonth } from 'date-fns';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createJournalEntryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_journal_entry',
    description: 'Create a new journal entry. Requires content (string) and mood (string). Optional: title (string), tags (array of strings), gratitude (string).',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Journal entry content - required'
        },
        mood: {
          type: 'string',
          enum: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
          description: 'Current mood - required'
        },
        title: {
          type: 'string',
          description: 'Entry title - optional'
        },
        tags: {
          type: 'array',
          items: { type: 'string', description: 'Tag name' },
          description: 'Tags for categorizing the entry (e.g., ["work", "health"]) - optional'
        },
        gratitude: {
          type: 'string',
          description: 'What you\'re grateful for today - optional'
        }
      },
      required: ['content', 'mood']
    }
  }
};

const getJournalEntriesDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_journal_entries',
    description: 'Get journal entries. Optional: search_query (string), mood_filter (string), tags (array of strings), timeframe (string: "week", "month", "all").',
    parameters: {
      type: 'object',
      properties: {
        search_query: {
          type: 'string',
          description: 'Search in title and content - optional'
        },
        mood_filter: {
          type: 'string',
          enum: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
          description: 'Filter by mood - optional'
        },
        tags: {
          type: 'array',
          items: { type: 'string', description: 'Tag name' },
          description: 'Filter by tags - optional'
        },
        timeframe: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period to fetch: "week", "month", or "all" - optional, defaults to "all"'
        }
      }
    }
  }
};

const getMoodAnalysisDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_mood_analysis',
    description: 'Get mood statistics and analysis. Optional: timeframe (string: "week", "month", "all" - defaults to "month").',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['week', 'month', 'all'],
          description: 'Time period for analysis - optional, defaults to "month"'
        }
      }
    }
  }
};

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Create a journal entry
 */
async function executeCreateJournalEntry(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const content = args.content as string;
    const mood = args.mood as JournalMood;
    const title = args.title as string | undefined;
    const tags = args.tags as string[] | undefined;
    const gratitude = args.gratitude as string | undefined;

    // Validate
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Journal entry content is required'
      };
    }

    if (!['excellent', 'good', 'neutral', 'bad', 'terrible'].includes(mood)) {
      return {
        success: false,
        error: 'Mood must be one of: excellent, good, neutral, bad, terrible'
      };
    }

    logger.info('JournalTools', 'Creating journal entry', {
      mood,
      hasTitle: !!title,
      hasGratitude: !!gratitude,
      tagsCount: tags?.length ?? 0
    });

    const entry = await createJournalEntry({
      content: content.trim(),
      mood,
      title: title?.trim(),
      tags: tags ?? [],
      gratitude: gratitude?.trim()
    });

    logger.info('JournalTools', 'Journal entry created successfully', {
      entryId: entry.id,
      mood: entry.mood
    });

    return {
      success: true,
      message: `Journal entry created with ${mood} mood${gratitude ? '. Great job expressing gratitude!' : ''}`,
      entry: {
        id: entry.id,
        title: entry.title,
        mood: entry.mood,
        tags: entry.tags,
        created_at: entry.createdAt?.toISOString()
      }
    };
  } catch (error) {
    logger.error('JournalTools', 'Operation failed', { error,
      operation: 'create_journal_entry',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create journal entry'
    };
  }
}

/**
 * Get journal entries
 */
async function executeGetJournalEntries(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const searchQuery = args.search_query as string | undefined;
    const moodFilter = args.mood_filter as JournalMood | undefined;
    const tags = args.tags as string[] | undefined;
    const timeframe = (args.timeframe as 'week' | 'month' | 'all') ?? 'all';

    logger.info('JournalTools', 'Getting journal entries', {
      searchQuery,
      moodFilter,
      tags,
      timeframe
    });

    // Calculate date range based on timeframe
    let startDate: Date | undefined;
    const now = new Date();

    if (timeframe === 'week') {
      startDate = startOfWeek(now);
    } else if (timeframe === 'month') {
      startDate = startOfMonth(now);
    }

    // Fetch entries with filters
    const entries = await getJournalEntries({
      searchQuery,
      moods: moodFilter ? [moodFilter] : undefined,
      tags,
      startDate,
      endDate: now
    });

    logger.info('JournalTools', 'Journal entries retrieved', {
      count: entries.length,
      timeframe
    });

    return {
      success: true,
      entries: entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        content: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
        mood: entry.mood,
        tags: entry.tags,
        gratitude: entry.gratitude,
        created_at: entry.createdAt?.toISOString()
      })),
      count: entries.length,
      timeframe,
      message: `You have ${entries.length} journal entr${entries.length !== 1 ? 'ies' : 'y'} ${timeframe !== 'all' ? `this ${timeframe}` : ''}`
    };
  } catch (error) {
    logger.error('JournalTools', 'Operation failed', { error,
      operation: 'get_journal_entries',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get journal entries'
    };
  }
}

/**
 * Get mood analysis
 */
async function executeGetMoodAnalysis(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const timeframe = (args.timeframe as 'week' | 'month' | 'all') ?? 'month';

    logger.info('JournalTools', 'Getting mood analysis', { timeframe });

    // Calculate date range
    let startDate: Date | undefined;
    const now = new Date();

    if (timeframe === 'week') {
      startDate = startOfWeek(now);
    } else if (timeframe === 'month') {
      startDate = startOfMonth(now);
    }

    // Get mood statistics
    const stats = await getMoodStats(startDate, now);

    // Calculate total and percentages
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const percentages: Record<JournalMood, number> = {
      excellent: total > 0 ? Math.round((stats.excellent / total) * 100) : 0,
      good: total > 0 ? Math.round((stats.good / total) * 100) : 0,
      neutral: total > 0 ? Math.round((stats.neutral / total) * 100) : 0,
      bad: total > 0 ? Math.round((stats.bad / total) * 100) : 0,
      terrible: total > 0 ? Math.round((stats.terrible / total) * 100) : 0
    };

    // Find dominant mood
    const dominantMood = (Object.entries(stats) as [JournalMood, number][])
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Calculate positive vs negative
    const positiveCount = stats.excellent + stats.good;
    const negativeCount = stats.bad + stats.terrible;
    const positivePercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 0;

    logger.info('JournalTools', 'Mood analysis retrieved', {
      timeframe,
      total,
      dominantMood
    });

    let message = `Over the past ${timeframe === 'all' ? 'period' : timeframe}, `;
    if (total === 0) {
      message += "you haven't logged any journal entries. Start journaling to track your mood!";
    } else {
      message += `${positivePercentage}% of your moods were positive. `;
      if (dominantMood) {
        message += `Your most common mood was "${dominantMood}".`;
      }
    }

    return {
      success: true,
      timeframe,
      total_entries: total,
      mood_counts: stats,
      mood_percentages: percentages,
      dominant_mood: dominantMood,
      positive_percentage: positivePercentage,
      message
    };
  } catch (error) {
    logger.error('JournalTools', 'Operation failed', { error,
      operation: 'get_mood_analysis',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mood analysis'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const journalTools: Tool[] = [
  {
    definition: createJournalEntryDefinition,
    execute: executeCreateJournalEntry
  },
  {
    definition: getJournalEntriesDefinition,
    execute: executeGetJournalEntries
  },
  {
    definition: getMoodAnalysisDefinition,
    execute: executeGetMoodAnalysis
  }
];
