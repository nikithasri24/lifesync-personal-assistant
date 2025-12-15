import type { ReactElement } from 'react';
import {
  CheckSquare,
  Target,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useComposedStore } from '../stores/useComposedStore';
import { format, isToday, addDays } from 'date-fns';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useState, useEffect } from 'react';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useTasks, useUpdateTask } from '../hooks/useTasksQuery';
import { useHabits, useCreateHabitEntry, useHabitEntries } from '../hooks/useHabitsQuery';
import { useNotes } from '../hooks/useNotesQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import { logger } from '../services/logger';
import type { Task } from '../lib/supabase';
import type { Habit, Note, JournalEntry } from '../types';

// Layout components
import { WelcomeBanner } from '../dashboard/components/WelcomeBanner';
import { StatsGrid } from '../dashboard/components/StatsGrid';
import { TodayTasksSection } from '../dashboard/components/TodayTasksSection';
import { TodayHabitsSection } from '../dashboard/components/TodayHabitsSection';
import { RecentNotesSection } from '../dashboard/components/RecentNotesSection';
import { WeeklyOverview } from '../dashboard/components/WeeklyOverview';
import { UpcomingDeadlines } from '../dashboard/components/UpcomingDeadlines';

interface TasksQueryResult {
  data: Task[];
  isLoading: boolean;
}

interface HabitsQueryResult {
  data: Habit[];
}

interface NotesQueryResult {
  data: Note[];
}

interface JournalQueryResult {
  data: JournalEntry[];
}

export default function Dashboard(): ReactElement {
  const { setActiveView } = useComposedStore();

  // React Query hooks for all data sources
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const tasksQuery = useTasks();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const habitsQuery = useHabits({ isActive: true });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const habitEntriesQuery = useHabitEntries();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const notesQuery = useNotes();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const journalQuery = useJournalEntries();

  const tasks: Task[] = (tasksQuery as TasksQueryResult).data ?? [];
  const tasksLoading: boolean = (tasksQuery as TasksQueryResult).isLoading ?? false;
  const habits: Habit[] = (habitsQuery as unknown as HabitsQueryResult).data ?? [];
  const habitEntries = (habitEntriesQuery as { data: Array<{ habit_id: string; date: string; value?: number }> }).data ?? [];
  const notes: Note[] = (notesQuery as NotesQueryResult).data ?? [];
  const journalEntries: JournalEntry[] = (journalQuery as JournalQueryResult).data ?? [];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const updateTaskMutation = useUpdateTask();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const createHabitEntryMutation = useCreateHabitEntry();

  const [isLoading, setIsLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const { toast, showToast, showError, dismissToast } = useToast();

  const completeTask = async (taskId: string): Promise<void> => {
    try {
      setCompletingTask(taskId);
      const task = tasks.find((t: Task) => t.id === taskId);
      if (!task) return;
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await updateTaskMutation.mutateAsync({ id: taskId, updates: { status: newStatus } });
    } catch (error) {
      logger.error('Dashboard', 'Failed to complete task:', { error });
      showError(error, () => void completeTask(taskId));
    } finally {
      setCompletingTask(null);
    }
  };

  const completeHabitSafely = async (habitId: string): Promise<void> => {
    try {
      setCompletingHabit(habitId);
      logger.debug('Dashboard', '[Dashboard] Complete button clicked', { habitId });
      const today = format(new Date(), 'yyyy-MM-dd');
      await createHabitEntryMutation.mutateAsync({
        habit_id: habitId,
        date: today,
        value: 1,
      });

      // Add to completed set for animation
      setCompletedHabits(prev => new Set(prev).add(habitId));

      // Show success message
      showToast('Habit completed! 🎉', 'success');

      // Remove from completed set after animation
      setTimeout(() => {
        setCompletedHabits(prev => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      }, 2000);
    } catch (error) {
      logger.error('Dashboard', '[Dashboard] Failed to complete habit', { error });
      showError(error, () => void completeHabitSafely(habitId));
    } finally {
      setCompletingHabit(null);
    }
  };

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const todayTodos = tasks.filter((task: Task): boolean =>
    task.status !== 'done' && !task.deleted &&
    !!task.due_date &&
    isToday(new Date(task.due_date))
  );

  const upcomingTodos = tasks.filter((task: Task): boolean =>
    task.status !== 'done' && !task.deleted &&
    !!task.due_date &&
    new Date(task.due_date) > new Date() &&
    new Date(task.due_date) <= addDays(new Date(), 7)
  );

  // Calculate habit progress for today
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const habitsWithProgress = habits.map((habit: Habit) => {
    const todayCompletions = habitEntries.filter(
      entry => entry.habit_id === habit.id && entry.date === todayKey
    ).length;
    const targetCount = habit.targetCount ?? 1;
    const isComplete = todayCompletions >= targetCount;

    return {
      ...habit,
      todayCompletions,
      targetCount,
      isComplete
    };
  });

  // Show incomplete habits first, then limit to 5
  const todayHabits = habitsWithProgress
    .filter(h => !h.isComplete)
    .slice(0, 5);

  const recentNotes = notes
    .sort((a: Note, b: Note): number => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const thisWeekJournalEntries = journalEntries.filter((entry: JournalEntry): boolean => {
    const entryDate = new Date(entry.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  const completedTodosThisWeek = tasks.filter((task: Task): boolean => {
    if (task.status !== 'done' || task.deleted) return false;
    const completedDate = task.completed_at ? new Date(task.completed_at) : (task.created_at ? new Date(task.created_at) : null);
    if (!completedDate) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate >= weekAgo;
  });

  const statsCards: Array<{
    title: string;
    value: number | string;
    icon: typeof CheckSquare;
    color: string;
    onClick: () => void;
  }> = [
    {
      title: 'Today\'s Tasks',
      value: todayTodos.length,
      icon: CheckSquare,
      color: 'bg-blue-500',
      onClick: (): void => setActiveView('scheduler')
    },
    {
      title: 'Pending Habits',
      value: todayHabits.length,
      icon: Target,
      color: 'bg-green-500',
      onClick: (): void => setActiveView('habits')
    },
    {
      title: 'Total Notes',
      value: notes.length,
      icon: FileText,
      color: 'bg-purple-500',
      onClick: (): void => setActiveView('notes')
    },
    {
      title: 'Week\'s Progress',
      value: `${completedTodosThisWeek.length} tasks`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      onClick: (): void => setActiveView('scheduler')
    }
  ];

  if (isLoading || tasksLoading) {
    return (
      <div className="space-y-8">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SkeletonCard className="h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Toast toast={toast} onDismiss={dismissToast} />

      <WelcomeBanner />

      <StatsGrid cards={statsCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TodayTasksSection
          tasks={todayTodos}
          onViewAll={() => setActiveView('scheduler')}
          onComplete={completeTask}
          completingTask={completingTask}
        />

        <TodayHabitsSection
          habits={todayHabits}
          hasAnyHabits={habits.length > 0}
          onViewAll={() => setActiveView('habits')}
          onComplete={completeHabitSafely}
          completingHabit={completingHabit}
          completedHabits={completedHabits}
        />

        <RecentNotesSection
          notes={recentNotes}
          onViewAll={() => setActiveView('notes')}
        />

        <WeeklyOverview
          completedTasks={completedTodosThisWeek.length}
          journalEntries={thisWeekJournalEntries.length}
          totalHabits={habits.length}
        />
      </div>

      <UpcomingDeadlines
        tasks={upcomingTodos}
        onComplete={completeTask}
        completingTask={completingTask}
      />
    </div>
  );
}
