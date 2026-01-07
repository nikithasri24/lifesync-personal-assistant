/**
 * Prediction Service
 * Generates proactive predictions and suggestions based on user data
 *
 * ARCHITECTURE: Uses cache accessor for data access (benefits from React Query cache)
 */

import { cacheAccessor } from '@/lib/cacheAccessor';
import { getBills } from '@/api/billsAPI';
import { getImportantDates } from '@/api/importantDatesAPI';
import { logger } from '@/services/logger';
import { format, addDays, startOfWeek, endOfWeek, differenceInDays, parseISO } from 'date-fns';

export type PredictionType = 
  | 'busy_period'
  | 'streak_at_risk'
  | 'budget_warning'
  | 'goal_deadline'
  | 'bill_due'
  | 'birthday_upcoming'
  | 'low_energy_predicted'
  | 'routine_reminder';

export type PredictionPriority = 'high' | 'medium' | 'low';

export interface Prediction {
  id: string;
  type: PredictionType;
  priority: PredictionPriority;
  title: string;
  message: string;
  suggestedAction?: string;
  actionType?: 'create_task' | 'block_time' | 'send_reminder' | 'view_details';
  actionPayload?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
}

export interface PredictionContext {
  userId: string;
  today: Date;
  lookAheadDays: number;
}

class PredictionService {
  /**
   * Generate all predictions for a user
   */
  async generatePredictions(userId: string, lookAheadDays = 7): Promise<Prediction[]> {
    const context: PredictionContext = {
      userId,
      today: new Date(),
      lookAheadDays,
    };

    logger.info('PredictionService', 'Generating predictions', { userId, lookAheadDays });

    const predictions: Prediction[] = [];

    // Run all prediction generators in parallel
    const [
      busyPeriods,
      streakRisks,
      goalDeadlines,
      billsDue,
      birthdaysUpcoming,
    ] = await Promise.all([
      this.predictBusyPeriods(context),
      this.predictStreakRisks(context),
      this.predictGoalDeadlines(context),
      this.predictBillsDue(context),
      this.predictBirthdaysUpcoming(context),
    ]);

    predictions.push(...busyPeriods, ...streakRisks, ...goalDeadlines, ...billsDue, ...birthdaysUpcoming);

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    predictions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return predictions;
  }

  /**
   * Predict busy periods based on calendar and tasks
   */
  private async predictBusyPeriods(ctx: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const endDate = addDays(ctx.today, ctx.lookAheadDays);

    // Use cache accessor (benefits from React Query cache)
    const events = await cacheAccessor.getCalendarEvents({
      startDate: format(ctx.today, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });

    const tasks = await cacheAccessor.getTasks({ deleted: false, archived: false });
    const tasksInRange = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return (t.status === 'todo' || t.status === 'in_progress') && dueDate >= ctx.today && dueDate <= endDate;
    });

    // Count items per day
    const dayLoad: Record<string, number> = {};

    events.forEach(e => {
      if (!e.start_time) return;
      const day = format(parseISO(e.start_time), 'yyyy-MM-dd');
      dayLoad[day] = (dayLoad[day] || 0) + 1;
    });

    tasksInRange.forEach(t => {
      if (t.due_date) {
        dayLoad[t.due_date] = (dayLoad[t.due_date] || 0) + 1;
      }
    });

    // Find busy days (5+ items)
    const busyDays = Object.entries(dayLoad)
      .filter(([, count]) => count >= 5)
      .map(([day]) => day);

    if (busyDays.length > 0) {
      predictions.push({
        id: `busy-${Date.now()}`,
        type: 'busy_period',
        priority: 'medium',
        title: 'Busy period ahead',
        message: `You have ${busyDays.length} busy day(s) coming up with 5+ items each`,
        suggestedAction: 'Block some self-care time?',
        actionType: 'block_time',
        createdAt: new Date().toISOString(),
      });
    }

    return predictions;
  }

  /**
   * Predict habit streaks at risk
   */
  private async predictStreakRisks(ctx: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const today = format(ctx.today, 'yyyy-MM-dd');

    // Use cache accessor (benefits from React Query cache)
    const habits = await cacheAccessor.getHabits();
    const activeHabits = habits.filter(h => h.is_active);
    const habitsWithStreaks = activeHabits.filter(h => (h.streak_count ?? 0) > 0);

    const todayEntries = await cacheAccessor.getHabitEntriesForDate(today);
    const completedIds = new Set(todayEntries.map(e => e.habit_id));

    habitsWithStreaks.forEach(habit => {
      if (!completedIds.has(habit.id!) && (habit.streak_count ?? 0) >= 7) {
        const streak = habit.streak_count ?? 0;
        predictions.push({
          id: `streak-${habit.id}`,
          type: 'streak_at_risk',
          priority: streak >= 30 ? 'high' : 'medium',
          title: `${habit.name} streak at risk!`,
          message: `Your ${streak}-day streak will break if not completed today`,
          suggestedAction: 'Complete now',
          actionType: 'view_details',
          actionPayload: { habitId: habit.id },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return predictions;
  }

  /**
   * Predict goal deadlines approaching
   */
  private async predictGoalDeadlines(ctx: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const endDate = addDays(ctx.today, ctx.lookAheadDays);

    // Use cache accessor (benefits from React Query cache)
    const goals = await cacheAccessor.getGoals();
    const activeGoals = goals.filter(g => g.status === 'in-progress');
    const goalsInRange = activeGoals.filter(g => {
      if (!g.targetDate) return false;
      const targetDate = g.targetDate;
      return targetDate >= ctx.today && targetDate <= endDate;
    });

    goalsInRange.forEach(goal => {
      const daysUntil = differenceInDays(goal.targetDate, ctx.today);
      const progress = goal.progress ?? 0;

      if (daysUntil <= 3 && progress < 80) {
        predictions.push({
          id: `goal-${goal.id}`,
          type: 'goal_deadline',
          priority: 'high',
          title: `Goal deadline in ${daysUntil} day(s)`,
          message: `"${goal.title}" is ${progress}% complete with ${daysUntil} day(s) left`,
          suggestedAction: 'Focus on this goal',
          actionType: 'view_details',
          actionPayload: { goalId: goal.id },
          createdAt: new Date().toISOString(),
        });
      } else if (daysUntil <= 7 && progress < 50) {
        predictions.push({
          id: `goal-${goal.id}`,
          type: 'goal_deadline',
          priority: 'medium',
          title: `Goal deadline approaching`,
          message: `"${goal.title}" is only ${progress}% complete with ${daysUntil} day(s) left`,
          suggestedAction: 'Review progress',
          actionType: 'view_details',
          actionPayload: { goalId: goal.id },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return predictions;
  }

  /**
   * Predict bills due soon
   */
  private async predictBillsDue(ctx: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const endDate = addDays(ctx.today, ctx.lookAheadDays);

    // Use API layer instead of direct Supabase
    const bills = await getBills();
    const activeBills = bills.filter(b => b.is_active);
    const billsInRange = activeBills.filter(b => {
      if (!b.due_date || b.is_auto_pay) return false;
      const dueDate = new Date(b.due_date);
      return dueDate >= ctx.today && dueDate <= endDate;
    });

    billsInRange.forEach(bill => {
      const daysUntil = differenceInDays(parseISO(bill.due_date!), ctx.today);

      predictions.push({
        id: `bill-${bill.id}`,
        type: 'bill_due',
        priority: daysUntil <= 2 ? 'high' : 'medium',
        title: `${bill.name} due in ${daysUntil} day(s)`,
        message: `$${(bill.amount ?? 0).toFixed(2)} due on ${bill.due_date}`,
        suggestedAction: 'Mark as paid',
        actionType: 'view_details',
        actionPayload: { billId: bill.id },
        createdAt: new Date().toISOString(),
      });
    });

    return predictions;
  }

  /**
   * Predict upcoming birthdays/anniversaries
   */
  private async predictBirthdaysUpcoming(ctx: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // Use API layer instead of direct Supabase
    const dates = await getImportantDates();
    const activeDates = dates.filter(d => d.is_active);

    const thisYear = ctx.today.getFullYear();

    activeDates.forEach(date => {
      let nextOccurrence = new Date(thisYear, date.month - 1, date.day);
      if (nextOccurrence < ctx.today) {
        nextOccurrence = new Date(thisYear + 1, date.month - 1, date.day);
      }

      const daysUntil = differenceInDays(nextOccurrence, ctx.today);

      if (daysUntil <= ctx.lookAheadDays && daysUntil >= 0) {
        const age = date.year ? thisYear - date.year + (nextOccurrence.getFullYear() > thisYear ? 1 : 0) : null;
        const ageStr = age ? ` (turning ${age})` : '';

        predictions.push({
          id: `date-${date.id}`,
          type: 'birthday_upcoming',
          priority: daysUntil <= 3 ? 'high' : 'medium',
          title: `${date.person_name}'s ${date.date_type}${ageStr}`,
          message: daysUntil === 0 ? 'Today!' : `In ${daysUntil} day(s)`,
          suggestedAction: 'Plan celebration',
          actionType: 'view_details',
          actionPayload: { dateId: date.id },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return predictions;
  }

  /**
   * Get smart suggestions based on predictions and patterns
   */
  async getSmartSuggestions(userId: string): Promise<string[]> {
    const predictions = await this.generatePredictions(userId, 7);
    const suggestions: string[] = [];

    // Convert predictions to suggestions
    const highPriority = predictions.filter(p => p.priority === 'high');
    if (highPriority.length > 0) {
      suggestions.push(`You have ${highPriority.length} urgent item(s) to address`);
    }

    const streakRisks = predictions.filter(p => p.type === 'streak_at_risk');
    if (streakRisks.length > 0) {
      suggestions.push(`${streakRisks.length} habit streak(s) at risk today`);
    }

    const busyPeriods = predictions.filter(p => p.type === 'busy_period');
    if (busyPeriods.length > 0) {
      suggestions.push('Consider blocking self-care time this week');
    }

    const billsDue = predictions.filter(p => p.type === 'bill_due');
    if (billsDue.length > 0) {
      const total = billsDue.reduce((sum, p) => {
        const amount = (p.actionPayload as Record<string, unknown>)?.amount as number || 0;
        return sum + amount;
      }, 0);
      suggestions.push(`${billsDue.length} bill(s) due soon`);
    }

    return suggestions;
  }
}

export const predictionService = new PredictionService();

