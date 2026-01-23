/**
 * Life Coach Service
 * Provides personalized coaching insights, weekly check-ins, and motivational support
 *
 * ARCHITECTURE: Uses cache accessor for data access (benefits from React Query cache)
 */

import { cacheAccessor } from '@/lib/cacheAccessor';
import { logger } from '@/services/logger';
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import type { JournalEntry, Goal } from '@/types';
import type { TaskData, HabitData, HabitEntryData, FocusSessionData } from '@/services/types';

export interface CoachingInsight {
  category: 'productivity' | 'habits' | 'wellness' | 'goals' | 'balance';
  type: 'win' | 'improvement' | 'advice' | 'encouragement';
  title: string;
  message: string;
  metric?: { label: string; value: string | number; trend?: 'up' | 'down' | 'stable' };
}

export interface WeeklyCheckIn {
  weekStart: string;
  weekEnd: string;
  
  // Scores (0-100)
  productivityScore: number;
  habitScore: number;
  wellnessScore: number;
  balanceScore: number;
  overallScore: number;
  
  // Wins
  wins: string[];
  
  // Areas to improve
  improvements: string[];
  
  // Personalized advice
  advice: CoachingInsight[];
  
  // Goals progress
  goalProgress: { goalTitle: string; progress: number; change: number }[];
  
  // Encouragement
  encouragement: string;
}

export interface CoachingResponse {
  message: string;
  insights: CoachingInsight[];
  suggestedActions: string[];
}

class LifeCoachService {
  /**
   * Generate weekly check-in report
   */
  async generateWeeklyCheckIn(userId: string): Promise<WeeklyCheckIn> {
    const today = new Date();
    const weekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

    logger.info('LifeCoachService', 'Generating weekly check-in', { userId });

    // Fetch all data in parallel
    const [tasks, habits, goals, focusSessions, journals] = await Promise.all([
      this.getTasksData(userId, weekStart, weekEnd),
      this.getHabitsData(userId, weekStart, weekEnd),
      this.getGoalsData(userId),
      this.getFocusData(userId, weekStart, weekEnd),
      this.getJournalData(userId, weekStart, weekEnd),
    ]);

    // Calculate scores
    const productivityScore = this.calculateProductivityScore(tasks, focusSessions);
    const habitScore = this.calculateHabitScore(habits);
    const wellnessScore = this.calculateWellnessScore(journals);
    const balanceScore = this.calculateBalanceScore(productivityScore, habitScore, wellnessScore);
    const overallScore = Math.round((productivityScore + habitScore + wellnessScore + balanceScore) / 4);

    // Generate wins
    const wins = this.identifyWins(tasks, habits, goals, focusSessions);

    // Generate improvements
    const improvements = this.identifyImprovements(tasks, habits, focusSessions);

    // Generate advice
    const advice = this.generateAdvice(productivityScore, habitScore, wellnessScore, balanceScore);

    // Generate encouragement
    const encouragement = this.generateEncouragement(overallScore, wins.length);

    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      productivityScore,
      habitScore,
      wellnessScore,
      balanceScore,
      overallScore,
      wins,
      improvements,
      advice,
      goalProgress: goals.map(g => ({
        goalTitle: g.title,
        progress: g.progress,
        change: 0, // Would need historical data
      })),
      encouragement,
    };
  }

  private async getTasksData(_userId: string, start: Date, end: Date) {
    // Use cache accessor (benefits from React Query cache)
    const tasks = await cacheAccessor.getTasks({ deleted: false, archived: false });

    // Filter by date range
    return tasks.filter(t => {
      const createdAt = new Date(t.created_at!);
      return createdAt >= start && createdAt <= end;
    });
  }

  private async getHabitsData(_userId: string, start: Date, end: Date) {
    // Use cache accessor (benefits from React Query cache)
    const habits = await cacheAccessor.getHabits({ isActive: true });
    const entries = await cacheAccessor.getHabitEntries({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });

    return { habits, entries };
  }

  private async getGoalsData(_userId: string) {
    // Use cache accessor (benefits from React Query cache)
    const allGoals = await cacheAccessor.getGoals();
    return allGoals.filter(g => g.status === 'in-progress');
  }

  private async getFocusData(_userId: string, start: Date, end: Date) {
    // Use cache accessor (benefits from React Query cache)
    return await cacheAccessor.getFocusSessions({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  }

  private async getJournalData(_userId: string, start: Date, end: Date) {
    // Use cache accessor (benefits from React Query cache)
    return await cacheAccessor.getJournalEntries({ startDate: start, endDate: end });
  }

  private calculateProductivityScore(
    tasks: TaskData[],
    focusSessions: FocusSessionData[]
  ): number {
    const completed = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    const taskScore = total > 0 ? (completed / total) * 100 : 50;

    const focusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const focusScore = Math.min(100, (focusMinutes / 300) * 100); // 5 hours = 100%

    return Math.round((taskScore * 0.6 + focusScore * 0.4));
  }

  private calculateHabitScore(data: { habits: HabitData[]; entries: HabitEntryData[] }): number {
    const { habits, entries } = data;
    if (habits.length === 0) return 50;

    const daysInWeek = 7;
    const maxEntries = habits.length * daysInWeek;
    const actualEntries = entries.length;

    return Math.round((actualEntries / maxEntries) * 100);
  }

  private calculateWellnessScore(journals: JournalEntry[]): number {
    if (journals.length === 0) return 50;

    // Calculate wellness based on journaling frequency and content length
    // More entries with substantial content indicates better engagement
    const recentJournals = journals.filter(j => {
      const entryDate = new Date(j.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    // Base score on frequency (0-50 points)
    const frequencyScore = Math.min(50, recentJournals.length * 10);

    // Content engagement score (0-50 points) based on average content length
    const avgContentLength = recentJournals.length > 0
      ? recentJournals.reduce((sum, j) => sum + (j.content?.length || 0), 0) / recentJournals.length
      : 0;
    const contentScore = Math.min(50, avgContentLength / 10);

    return Math.round(frequencyScore + contentScore);
  }

  private calculateBalanceScore(productivity: number, habits: number, wellness: number): number {
    // Balance is about not having extremes
    const scores = [productivity, habits, wellness];
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = better balance
    return Math.round(Math.max(0, 100 - stdDev));
  }

  private identifyWins(
    tasks: TaskData[],
    habits: { habits: HabitData[]; entries: HabitEntryData[] },
    goals: Goal[],
    focusSessions: FocusSessionData[]
  ): string[] {
    const wins: string[] = [];

    const completed = tasks.filter(t => t.status === 'done').length;
    if (completed >= 10) wins.push(`Completed ${completed} tasks this week!`);

    const longStreaks = habits.habits.filter(h => (h.streak_count || 0) >= 7);
    longStreaks.forEach(h => wins.push(`${h.name}: ${h.streak_count}-day streak!`));

    const highProgress = goals.filter(g => g.progress >= 80);
    highProgress.forEach(g => wins.push(`"${g.title}" is ${g.progress}% complete!`));

    const focusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    if (focusMinutes >= 300) wins.push(`${Math.round(focusMinutes / 60)} hours of focused work!`);

    return wins.slice(0, 5);
  }

  private identifyImprovements(
    tasks: TaskData[],
    habits: { habits: HabitData[]; entries: HabitEntryData[] },
    focusSessions: FocusSessionData[]
  ): string[] {
    const improvements: string[] = [];

    const pending = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
    if (pending > 10) improvements.push(`${pending} tasks still pending - consider prioritizing`);

    const focusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    if (focusMinutes < 60) improvements.push('Try scheduling more focus time');

    // Find habits with low completion
    const habitCompletions: Record<string, number> = {};
    habits.entries.forEach(e => {
      habitCompletions[e.habit_id] = (habitCompletions[e.habit_id] || 0) + 1;
    });

    habits.habits.forEach(h => {
      const completions = habitCompletions[h.id || ''] || 0;
      if (completions < 3) {
        improvements.push(`${h.name} needs more consistency`);
      }
    });

    return improvements.slice(0, 3);
  }

  private generateAdvice(
    productivity: number,
    habits: number,
    wellness: number,
    balance: number
  ): CoachingInsight[] {
    const advice: CoachingInsight[] = [];

    if (productivity < 50) {
      advice.push({
        category: 'productivity',
        type: 'advice',
        title: 'Boost Your Productivity',
        message: 'Try breaking tasks into smaller chunks and using time-blocking',
        metric: { label: 'Productivity Score', value: productivity, trend: 'down' },
      });
    }

    if (habits < 50) {
      advice.push({
        category: 'habits',
        type: 'advice',
        title: 'Build Habit Momentum',
        message: 'Start with just one habit and make it non-negotiable',
        metric: { label: 'Habit Score', value: habits, trend: 'down' },
      });
    }

    if (wellness < 50) {
      advice.push({
        category: 'wellness',
        type: 'advice',
        title: 'Prioritize Self-Care',
        message: 'Schedule time for activities that recharge you',
        metric: { label: 'Wellness Score', value: wellness, trend: 'down' },
      });
    }

    if (balance < 60) {
      advice.push({
        category: 'balance',
        type: 'advice',
        title: 'Find Your Balance',
        message: 'Your scores are uneven - focus on your weakest area',
        metric: { label: 'Balance Score', value: balance, trend: 'stable' },
      });
    }

    return advice;
  }

  private generateEncouragement(overallScore: number, winsCount: number): string {
    if (overallScore >= 80) {
      return "Outstanding week! You're crushing it. Keep this momentum going!";
    } else if (overallScore >= 60) {
      return "Solid week! You're making good progress. A few tweaks and you'll be unstoppable.";
    } else if (winsCount > 0) {
      return `You had ${winsCount} win(s) this week - that's something to celebrate! Build on that.`;
    } else {
      return "Every week is a fresh start. Focus on one small improvement and build from there.";
    }
  }

  /**
   * Get coaching response for a specific question
   */
  async getCoachingResponse(userId: string, question: string): Promise<CoachingResponse> {
    const checkIn = await this.generateWeeklyCheckIn(userId);

    // Generate contextual response based on question and data
    const insights: CoachingInsight[] = [];
    const suggestedActions: string[] = [];

    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('productivity') || lowerQuestion.includes('productive')) {
      insights.push({
        category: 'productivity',
        type: checkIn.productivityScore >= 70 ? 'win' : 'improvement',
        title: 'Your Productivity',
        message: `Your productivity score is ${checkIn.productivityScore}%`,
        metric: { label: 'Score', value: checkIn.productivityScore },
      });
      suggestedActions.push('Review your task list and prioritize top 3');
    }

    if (lowerQuestion.includes('habit') || lowerQuestion.includes('routine')) {
      insights.push({
        category: 'habits',
        type: checkIn.habitScore >= 70 ? 'win' : 'improvement',
        title: 'Your Habits',
        message: `Your habit consistency is ${checkIn.habitScore}%`,
        metric: { label: 'Score', value: checkIn.habitScore },
      });
      suggestedActions.push('Focus on your most important habit today');
    }

    if (lowerQuestion.includes('balance') || lowerQuestion.includes('stress')) {
      insights.push({
        category: 'balance',
        type: checkIn.balanceScore >= 70 ? 'win' : 'improvement',
        title: 'Work-Life Balance',
        message: `Your balance score is ${checkIn.balanceScore}%`,
        metric: { label: 'Score', value: checkIn.balanceScore },
      });
      suggestedActions.push('Schedule some self-care time this week');
    }

    // Default response
    if (insights.length === 0) {
      insights.push(...checkIn.advice.slice(0, 2));
      suggestedActions.push(...checkIn.wins.slice(0, 2).map(w => `Celebrate: ${w}`));
    }

    return {
      message: checkIn.encouragement,
      insights,
      suggestedActions,
    };
  }
}

export const lifeCoachService = new LifeCoachService();

