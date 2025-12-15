/**
 * Analytics AI Tools
 * AI tools for getting productivity, finance, and wellbeing insights
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getProductivityAnalytics,
  getFinanceAnalytics,
  getWellbeingAnalytics,
  getWeeklyReport,
  getMonthlyReport,
} from '@/services/analytics';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const getProductivitySummaryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_productivity_summary',
    description:
      'Get productivity summary including tasks, habits, focus time, and journal entries. Optional: startDate and endDate (YYYY-MM-DD).',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format - optional' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format - optional' },
      },
    },
  },
};

const getFinanceSummaryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_finance_summary',
    description:
      'Get finance summary including spending, income, and budget compliance. Optional: startDate and endDate (YYYY-MM-DD).',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format - optional' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format - optional' },
      },
    },
  },
};

const getWellbeingInsightsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_wellbeing_insights',
    description:
      'Get wellbeing insights including mood trends and journal streaks. Optional: startDate and endDate (YYYY-MM-DD).',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format - optional' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format - optional' },
      },
    },
  },
};

const getWeeklyReportDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_weekly_report',
    description: 'Get comprehensive weekly report with productivity, finance, and wellbeing data for the past 7 days.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const getMonthlyReportDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_monthly_report',
    description: 'Get comprehensive monthly report with productivity, finance, and wellbeing data for the past 30 days.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeGetProductivitySummary(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const dateRange = getDateRange(args);
    const summary = await getProductivityAnalytics(dateRange);

    logger.info('AnalyticsTools', 'Productivity summary retrieved', { dateRange });
    return {
      success: true,
      message: `Productivity score: ${summary.productivityScore}/100`,
      data: summary,
    };
  } catch (error) {
    logger.error('AnalyticsTools', 'Operation failed', { error, context: 'executeGetProductivitySummary' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetFinanceSummary(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const dateRange = getDateRange(args);
    const summary = await getFinanceAnalytics(dateRange);

    logger.info('AnalyticsTools', 'Finance summary retrieved', { dateRange });
    return {
      success: true,
      message: `Spending: $${summary.totalSpending.toFixed(2)}, Income: $${summary.totalIncome.toFixed(2)}, Savings: $${summary.netSavings.toFixed(2)}`,
      data: summary,
    };
  } catch (error) {
    logger.error('AnalyticsTools', 'Operation failed', { error, context: 'executeGetFinanceSummary' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetWellbeingInsights(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const dateRange = getDateRange(args);
    const insights = await getWellbeingAnalytics(dateRange);

    logger.info('AnalyticsTools', 'Wellbeing insights retrieved', { dateRange });
    return {
      success: true,
      message: `Wellbeing score: ${insights.wellbeingScore}/100, Average mood: ${insights.averageMood}/5`,
      data: insights,
    };
  } catch (error) {
    logger.error('AnalyticsTools', 'Operation failed', { error, context: 'executeGetWellbeingInsights' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetWeeklyReport(_args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const report = await getWeeklyReport();

    logger.info('AnalyticsTools', 'Weekly report retrieved');
    return {
      success: true,
      message: 'Weekly report generated successfully',
      data: report,
    };
  } catch (error) {
    logger.error('AnalyticsTools', 'Operation failed', { error, context: 'executeGetWeeklyReport' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetMonthlyReport(_args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const report = await getMonthlyReport();

    logger.info('AnalyticsTools', 'Monthly report retrieved');
    return {
      success: true,
      message: 'Monthly report generated successfully',
      data: report,
    };
  } catch (error) {
    logger.error('AnalyticsTools', 'Operation failed', { error, context: 'executeGetMonthlyReport' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getDateRange(args: Record<string, unknown>): { startDate: string; endDate: string } {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    startDate: (args.startDate as string) || weekAgo.toISOString().split('T')[0],
    endDate: (args.endDate as string) || today.toISOString().split('T')[0],
  };
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const analyticsTools: Tool[] = [
  { definition: getProductivitySummaryDefinition, execute: executeGetProductivitySummary },
  { definition: getFinanceSummaryDefinition, execute: executeGetFinanceSummary },
  { definition: getWellbeingInsightsDefinition, execute: executeGetWellbeingInsights },
  { definition: getWeeklyReportDefinition, execute: executeGetWeeklyReport },
  { definition: getMonthlyReportDefinition, execute: executeGetMonthlyReport },
];
