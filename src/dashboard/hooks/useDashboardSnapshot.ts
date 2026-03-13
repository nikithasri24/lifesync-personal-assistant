/**
 * useDashboardSnapshot
 * Aggregates cross-module monthly snapshot data for the Command Center:
 *   - Net worth delta (finance)
 *   - Goals on track (goals)
 *   - Habit completion rate with week-over-week trend (habits)
 *   - Budget overruns with cross-module insight (finance → shopping)
 *
 * Each section degrades gracefully — finance data missing just hides that card.
 */

import { useMemo } from 'react';
import { format, subMonths, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { useNetWorthQuery } from '@/finance/hooks/useNetWorthQuery';
import { useBudgetsQuery } from '@/finance/hooks/useBudgetsQuery';
import { useCategoriesQuery } from '@/finance/hooks/useCategoriesQuery';
import { useTransactionsQuery } from '@/finance/hooks/useTransactionsQuery';
import { useLifeGoalsQuery } from '@/goals/hooks/useLifeGoalsQuery';
import { useHabits } from '@/hooks/useHabitsQuery';
import { useHabitEntries } from '@/hooks/useHabitsQuery';

// ── Types ──────────────────────────────────────────────────────────────────

export interface NetWorthSnapshot {
  currentNetWorth: number;
  delta: number;        // absolute change from previous month
  deltaPercent: number; // % change
  month: string;        // current month label e.g. "Mar 2026"
}

export interface GoalsSnapshot {
  total: number;
  onTrack: number;    // active goals with progress >= 40%
  completed: number;
}

export interface HabitsSnapshot {
  completionRateThisWeek: number;   // 0-100
  completionRatePrevWeek: number;   // 0-100
  trend: 'up' | 'down' | 'stable'; // compared to last week
  totalHabits: number;
}

export interface BudgetOverrun {
  categoryName: string;
  spent: number;
  limit: number;
  overage: number;        // spent - limit
  isGrocery: boolean;     // drives cross-module meal suggestion
}

export interface DashboardSnapshot {
  netWorth: NetWorthSnapshot | null;   // null if finance data unavailable
  goals: GoalsSnapshot | null;
  habits: HabitsSnapshot | null;
  budgetOverruns: BudgetOverrun[];     // empty if no overruns
  isLoading: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const GROCERY_KEYWORDS = ['grocer', 'food', 'supermarket', 'whole food', 'costco', 'trader', 'aldi', 'kroger', 'safeway'];

function isGroceryCategory(name: string): boolean {
  const lower = name.toLowerCase();
  return GROCERY_KEYWORDS.some(k => lower.includes(k));
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useDashboardSnapshot(): DashboardSnapshot {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const prevMonth = format(subMonths(now, 1), 'yyyy-MM');

  // Date windows for habit completion
  const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Current month ISO window for transactions
  const monthFromISO = `${currentMonth}-01T00:00:00.000Z`;
  const monthToISO = format(now, "yyyy-MM-dd'T'23:59:59.999'Z'");

  // ── Finance data ──
  const netWorthQuery = useNetWorthQuery();
  const budgetsQuery = useBudgetsQuery(currentMonth);
  const categoriesQuery = useCategoriesQuery();
  const transactionsQuery = useTransactionsQuery(
    { fromISO: monthFromISO, toISO: monthToISO, type: 'debit' },
    { enabled: budgetsQuery.data != null && budgetsQuery.data.length > 0 }
  );

  // ── Goals ──
  const goalsQuery = useLifeGoalsQuery();

  // ── Habits ──
  const habitsQuery = useHabits({ isActive: true });
  const thisWeekEntriesQuery = useHabitEntries({ startDate: thisWeekStart, endDate: thisWeekEnd });
  const prevWeekEntriesQuery = useHabitEntries({ startDate: prevWeekStart, endDate: prevWeekEnd });

  // ── Derived: net worth ──
  const netWorth = useMemo((): NetWorthSnapshot | null => {
    const points = netWorthQuery.data;
    if (!points || points.length < 2) return null;

    const sorted = [...points].sort((a, b) => b.month.localeCompare(a.month));
    const current = sorted[0];
    const previous = sorted[1];
    if (!current || !previous) return null;

    const currentNW = current.assets - current.liabilities;
    const previousNW = previous.assets - previous.liabilities;
    const delta = currentNW - previousNW;
    const deltaPercent = previousNW !== 0 ? (delta / Math.abs(previousNW)) * 100 : 0;

    return {
      currentNetWorth: currentNW,
      delta,
      deltaPercent,
      month: format(new Date(`${current.month}-01`), 'MMM yyyy'),
    };
  }, [netWorthQuery.data]);

  // ── Derived: goals ──
  const goals = useMemo((): GoalsSnapshot | null => {
    const data = goalsQuery.data;
    if (!data) return null;

    const completed = data.filter(g => g.status === 'completed').length;
    const active = data.filter(g => g.status !== 'completed' && g.status !== 'abandoned');
    const onTrack = active.filter(g => g.progress >= 40).length;

    return { total: data.length, onTrack, completed };
  }, [goalsQuery.data]);

  // ── Derived: habits ──
  const habits = useMemo((): HabitsSnapshot | null => {
    const habitList = habitsQuery.data;
    const thisEntries = thisWeekEntriesQuery.data;
    const prevEntries = prevWeekEntriesQuery.data;
    if (!habitList || !thisEntries || !prevEntries) return null;
    if (habitList.length === 0) return null;

    const weekDays = 7;
    const maxPossible = habitList.length * weekDays;

    const thisRate = maxPossible > 0 ? Math.round((thisEntries.length / maxPossible) * 100) : 0;
    const prevRate = maxPossible > 0 ? Math.round((prevEntries.length / maxPossible) * 100) : 0;
    const diff = thisRate - prevRate;
    const trend: 'up' | 'down' | 'stable' = diff >= 3 ? 'up' : diff <= -3 ? 'down' : 'stable';

    return {
      completionRateThisWeek: thisRate,
      completionRatePrevWeek: prevRate,
      trend,
      totalHabits: habitList.length,
    };
  }, [habitsQuery.data, thisWeekEntriesQuery.data, prevWeekEntriesQuery.data]);

  // ── Derived: budget overruns ──
  const budgetOverruns = useMemo((): BudgetOverrun[] => {
    const budgets = budgetsQuery.data;
    const categories = categoriesQuery.data;
    const transactions = transactionsQuery.data;
    if (!budgets || !categories || !transactions) return [];

    const catMap = new Map(categories.map(c => [c.id, c]));

    // Sum debits by categoryId for current month
    const spendByCategory = new Map<string, number>();
    for (const txn of transactions) {
      if (!txn.categoryId) continue;
      spendByCategory.set(txn.categoryId, (spendByCategory.get(txn.categoryId) ?? 0) + txn.amount);
    }

    const overruns: BudgetOverrun[] = [];
    for (const budget of budgets) {
      const spent = spendByCategory.get(budget.categoryId) ?? 0;
      if (spent <= budget.limit) continue;

      const cat = catMap.get(budget.categoryId);
      const categoryName = cat?.name ?? 'Unknown';
      overruns.push({
        categoryName,
        spent,
        limit: budget.limit,
        overage: spent - budget.limit,
        isGrocery: isGroceryCategory(categoryName),
      });
    }

    // Sort by largest overage first
    return overruns.sort((a, b) => b.overage - a.overage);
  }, [budgetsQuery.data, categoriesQuery.data, transactionsQuery.data]);

  const isLoading =
    netWorthQuery.isLoading ||
    goalsQuery.isLoading ||
    habitsQuery.isLoading ||
    thisWeekEntriesQuery.isLoading;

  return { netWorth, goals, habits, budgetOverruns, isLoading };
}
