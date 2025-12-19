import type { ReactElement } from 'react';
import { useComposedStore } from '../stores/useComposedStore';
import { format } from 'date-fns';
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
import { DashboardLoadingState } from '../dashboard/components/DashboardLoadingState';
import { WelcomeBanner } from '../dashboard/components/WelcomeBanner';
import { StatsGrid } from '../dashboard/components/StatsGrid';
import { TodayTasksSection } from '../dashboard/components/TodayTasksSection';
import { TodayHabitsSection } from '../dashboard/components/TodayHabitsSection';
import { RecentNotesSection } from '../dashboard/components/RecentNotesSection';
import { WeeklyOverview } from '../dashboard/components/WeeklyOverview';
import { UpcomingDeadlines } from '../dashboard/components/UpcomingDeadlines';
import { GamificationWidget } from '../components/gamification';
import { MorningBriefing } from '../components/briefing';
import { SmartScheduler } from '../components/scheduling';

// Hooks
import { useDashboardData } from '../dashboard/hooks/useDashboardData';

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

  // Use dashboard data hook for all data transformations
  const dashboardData = useDashboardData(
    tasks,
    habits,
    habitEntries,
    notes,
    journalEntries,
    setActiveView
  );

  const {
    todayTodos,
    upcomingTodos,
    todayHabits,
    recentNotes,
    thisWeekJournalEntries,
    completedTodosThisWeek,
    statsCards,
  } = dashboardData;

  if (isLoading || tasksLoading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Toast toast={toast} onDismiss={dismissToast} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <WelcomeBanner />
        <GamificationWidget variant="compact" />
      </div>

      {/* Morning Briefing & Smart Scheduler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <MorningBriefing
          className="xl:col-span-1"
          onCompleteTask={completeTask}
          onCompleteHabit={completeHabitSafely}
        />
        <div className="xl:col-span-2 space-y-6">
          <StatsGrid cards={statsCards} />
          <SmartScheduler className="hidden xl:block" />
        </div>
      </div>

      {/* Smart Scheduler - visible on mobile/tablet below briefing */}
      <SmartScheduler className="xl:hidden" />

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
