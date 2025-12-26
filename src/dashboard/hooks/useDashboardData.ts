import { useMemo } from 'react';
import { format, isToday, addDays } from 'date-fns';
import { CheckSquare, Target, FileText, TrendingUp } from 'lucide-react';
import type { Task } from '../../lib/supabase';
import type { Habit, Note, JournalEntry } from '../../types';

interface HabitEntry {
  habit_id: string;
  date: string;
  value?: number;
}

interface HabitWithProgress extends Habit {
  todayCompletions: number;
  targetCount: number;
  isComplete: boolean;
}

interface StatCard {
  title: string;
  value: number | string;
  icon: typeof CheckSquare;
  color: string;
  onClick: () => void;
}

interface DashboardData {
  todayTodos: Task[];
  upcomingTodos: Task[];
  todayHabits: HabitWithProgress[];
  recentNotes: Note[];
  thisWeekJournalEntries: JournalEntry[];
  completedTodosThisWeek: Task[];
  statsCards: StatCard[];
}

/**
 * Custom hook to compute all dashboard data transformations
 */
export function useDashboardData(
  tasks: Task[],
  habits: Habit[],
  habitEntries: HabitEntry[],
  notes: Note[],
  journalEntries: JournalEntry[],
  navigate: (path: string) => void
): DashboardData {
  const todayTodos = useMemo(
    () =>
      tasks.filter(
        (task: Task): boolean =>
          task.status !== 'done' &&
          !task.deleted &&
          !!task.due_date &&
          isToday(new Date(task.due_date))
      ),
    [tasks]
  );

  const upcomingTodos = useMemo(
    () =>
      tasks.filter(
        (task: Task): boolean =>
          task.status !== 'done' &&
          !task.deleted &&
          !!task.due_date &&
          new Date(task.due_date) > new Date() &&
          new Date(task.due_date) <= addDays(new Date(), 7)
      ),
    [tasks]
  );

  const habitsWithProgress = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    return habits.map((habit: Habit) => {
      const todayCompletions = habitEntries.filter(
        (entry) => entry.habit_id === habit.id && entry.date === todayKey
      ).length;
      const targetCount = habit.targetCount ?? 1;
      const isComplete = todayCompletions >= targetCount;

      return {
        ...habit,
        todayCompletions,
        targetCount,
        isComplete,
      };
    });
  }, [habits, habitEntries]);

  const todayHabits = useMemo(
    () => habitsWithProgress.filter((h) => !h.isComplete).slice(0, 5),
    [habitsWithProgress]
  );

  const recentNotes = useMemo(
    () =>
      notes
        .sort(
          (a: Note, b: Note): number =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [notes]
  );

  const thisWeekJournalEntries = useMemo(
    () =>
      journalEntries.filter((entry: JournalEntry): boolean => {
        const entryDate = new Date(entry.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      }),
    [journalEntries]
  );

  const completedTodosThisWeek = useMemo(
    () =>
      tasks.filter((task: Task): boolean => {
        if (task.status !== 'done' || task.deleted) return false;
        const completedDate = task.completed_at
          ? new Date(task.completed_at)
          : task.created_at
          ? new Date(task.created_at)
          : null;
        if (!completedDate) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedDate >= weekAgo;
      }),
    [tasks]
  );

  const statsCards: StatCard[] = useMemo(
    () => [
      {
        title: "Today's Tasks",
        value: todayTodos.length,
        icon: CheckSquare,
        color: 'bg-blue-500',
        onClick: (): void => navigate('/scheduler'),
      },
      {
        title: 'Pending Habits',
        value: todayHabits.length,
        icon: Target,
        color: 'bg-green-500',
        onClick: (): void => navigate('/habits'),
      },
      {
        title: 'Total Notes',
        value: notes.length,
        icon: FileText,
        color: 'bg-purple-500',
        onClick: (): void => navigate('/notes'),
      },
      {
        title: "Week's Progress",
        value: `${completedTodosThisWeek.length} tasks`,
        icon: TrendingUp,
        color: 'bg-orange-500',
        onClick: (): void => navigate('/scheduler'),
      },
    ],
    [todayTodos, todayHabits, notes, completedTodosThisWeek, navigate]
  );

  return {
    todayTodos,
    upcomingTodos,
    todayHabits,
    recentNotes,
    thisWeekJournalEntries,
    completedTodosThisWeek,
    statsCards,
  };
}
