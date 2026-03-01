import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, subDays, isToday, isSameDay, subMonths, subYears } from 'date-fns';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useTasks } from '../hooks/useTasksQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import type { HabitData, HabitEntryData, TaskData } from '../services/types';
import { PageLayoutV2 } from '../components/v2';
import { AnalyticsHeader } from '../analytics/components/AnalyticsHeader';
import { KeyMetricsGrid } from '../analytics/components/KeyMetricsGrid';
import { WeeklyProductivityChart } from '../analytics/components/WeeklyProductivityChart';
import { HabitStreaksSection } from '../analytics/components/HabitStreaksSection';
import { TaskInsightsSection } from '../analytics/components/TaskInsightsSection';
import { useThemeColors } from '../hooks/useThemeColors';

type Period = 'week' | 'month' | '3months' | 'year';

interface Todo extends TaskData {
  completed: boolean;
}

interface HabitWithEntries extends HabitData {
  entries: HabitEntryData[];
}

interface HabitStat extends HabitWithEntries {
  streak: number;
  totalCompletions: number;
  thisWeekCompletions: number;
}

interface DayProductivity {
  date: Date;
  todos: number;
  habits: number;
  journal: number;
  total: number;
}

export default function Analytics() {
  const colors = useThemeColors();
  const [period, setPeriod] = useState<Period>('month');

  // Derive date range from selected period
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (period === 'week') start.setDate(end.getDate() - 7);
    else if (period === 'month') return { startDate: subMonths(end, 1), endDate: end };
    else if (period === '3months') return { startDate: subMonths(end, 3), endDate: end };
    else if (period === 'year') return { startDate: subYears(end, 1), endDate: end };
    return { startDate: start, endDate: end };
  }, [period]);

  const { data: habits = [] } = useHabits();
  const { data: habitEntries = [] } = useHabitEntries({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });
  const { data: tasks = [] } = useTasks();
  const { data: journalEntries = [] } = useJournalEntries({ startDate, endDate }) as {
    data: Array<{ created_at?: string; id?: string }>;
  };

  // Combine habits with their period-filtered entries
  const habitsWithEntries: HabitWithEntries[] = habits.map((habit): HabitWithEntries => ({
    ...habit,
    entries: habitEntries.filter((entry): boolean => entry.habit_id === habit.id),
  }));

  // Map tasks to todos format for backward compatibility
  const todos: Todo[] = tasks.map((task): Todo => ({
    ...task,
    completed: task.status === 'done',
  }));

  // Calculate habit streaks
  const calculateStreak = (habit: HabitWithEntries): number => {
    const today = new Date();
    let streak = 0;
    let currentDate = today;

    while (true) {
      const dayEntries = habit.entries.filter((entry): boolean =>
        entry.date ? isSameDay(new Date(entry.date), currentDate) : false
      );

      const targetValue = habit.target_value ?? 1;
      if (dayEntries.length >= targetValue) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (isToday(currentDate)) {
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const habitStats: HabitStat[] = habitsWithEntries.map((habit): HabitStat => {
    const streak = calculateStreak(habit);
    const totalCompletions = habit.entries.length;
    const thisWeekCompletions = habit.entries.filter((entry): boolean => {
      if (!entry.date) return false;
      const date = new Date(entry.date);
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      return date >= weekStart && date <= weekEnd;
    }).length;

    return { ...habit, streak, totalCompletions, thisWeekCompletions };
  });

  // Weekly productivity chart always shows current week (date-scoped data now)
  const thisWeek = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });

  const weeklyProductivity: DayProductivity[] = thisWeek.map((day): DayProductivity => {
    const dayTodos = todos.filter((todo): boolean => {
      if (!todo.completed || !todo.updated_at) return false;
      return isSameDay(new Date(todo.updated_at), day);
    });

    const dayHabits = habitEntries.filter((entry): boolean => {
      if (!entry.date) return false;
      return isSameDay(new Date(entry.date), day);
    }).length;

    const dayJournal = journalEntries.filter((entry): boolean => {
      if (!entry.created_at) return false;
      return isSameDay(new Date(entry.created_at), day);
    }).length;

    return {
      date: day,
      todos: dayTodos.length,
      habits: dayHabits,
      journal: dayJournal,
      total: dayTodos.length + dayHabits + dayJournal,
    };
  });

  const totalProductivityScore = weeklyProductivity.reduce((sum: number, day): number => sum + day.total, 0);
  const avgDailyScore = Math.round(totalProductivityScore / 7);

  const defaultHabit: HabitStat = habitStats[0] ?? {
    id: '',
    name: 'None',
    color: '',
    icon: '',
    entries: [],
    streak: 0,
    totalCompletions: 0,
    thisWeekCompletions: 0,
  };
  const bestHabit = habitStats.reduce((best: HabitStat, current): HabitStat =>
    current.streak > best.streak ? current : best,
    defaultHabit
  );

  const completedTodos = todos.filter((todo): boolean => todo.completed).length;
  const todoCompletionRate = todos.length > 0 ? Math.round((completedTodos / todos.length) * 100) : 0;

  const overallHabitRate =
    habitsWithEntries.length > 0
      ? Math.round(
          (habitStats.reduce((sum: number, habit): number => sum + (habit.thisWeekCompletions / 7), 0) /
            habitsWithEntries.length) *
            100
        )
      : 0;

  const periodLabels: Record<Period, string> = {
    week: 'Week',
    month: 'Month',
    '3months': '3 Months',
    year: 'Year',
  };

  return (
    <PageLayoutV2 maxWidth="xl" spacing="normal">
      <AnalyticsHeader />

      {/* Period Selector */}
      <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
        {(['week', 'month', '3months', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              period === p ? 'bg-white shadow-sm' : ''
            }`}
            style={{ color: period === p ? '#C18B5E' : colors.text.secondary }}
            aria-label={`Show ${periodLabels[p]} analytics`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      <KeyMetricsGrid
        totalProductivityScore={totalProductivityScore}
        avgDailyScore={avgDailyScore}
        bestHabit={bestHabit}
        todoCompletionRate={todoCompletionRate}
        completedTodos={completedTodos}
        totalTodos={todos.length}
        overallHabitRate={overallHabitRate}
      />

      <WeeklyProductivityChart weeklyProductivity={weeklyProductivity} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitStreaksSection habitStats={habitStats} />
        <TaskInsightsSection
          completedTodos={completedTodos}
          todoCompletionRate={todoCompletionRate}
          todos={todos}
        />
      </div>
    </PageLayoutV2>
  );
}
