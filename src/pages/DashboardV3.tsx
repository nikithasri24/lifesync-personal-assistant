import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Moon } from 'lucide-react';
import { useComposedStore } from '../stores/useComposedStore';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useTasks, useUpdateTask } from '../hooks/useTasksQuery';
import { useHabits, useCreateHabitEntry, useHabitEntries } from '../hooks/useHabitsQuery';
import { useNotes } from '../hooks/useNotesQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import { logger } from '../services/logger';
import { useTheme } from '../contexts/ThemeContext';
import type { Task } from '../lib/supabase';
import type { Habit, Note, JournalEntry } from '../types';

// V2 Components
import {
  WelcomeBannerV2,
  DashboardLoadingStateV2,
  StatsGridV2,
  TodayTasksSectionV2,
  TodayHabitsSectionV2,
  RecentNotesSectionV2,
  WeeklyOverviewV2,
  UpcomingDeadlinesV2,
  GamificationWidgetV2,
  MorningBriefingV2,
  SmartSchedulerV2
} from '../dashboard/components/v2';

// All components migrated to V2!

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

/**
 * DashboardV3 - Production dashboard with V2 design system
 * 
 * Features:
 * - Soft & muted color palette
 * - Perfect light & dark mode support
 * - Responsive layout
 * - Time-based greeting
 * - All existing functionality maintained
 */
export default function DashboardV3(): ReactElement {
  const { setActiveView } = useComposedStore();
  const { theme, toggleTheme } = useTheme();

  // React Query hooks for all data sources
  const tasksQuery = useTasks();
  const habitsQuery = useHabits({ isActive: true });
  const habitEntriesQuery = useHabitEntries();
  const notesQuery = useNotes();
  const journalQuery = useJournalEntries();

  const tasks: Task[] = (tasksQuery as TasksQueryResult).data ?? [];
  const tasksLoading: boolean = (tasksQuery as TasksQueryResult).isLoading ?? false;
  const habits: Habit[] = (habitsQuery as unknown as HabitsQueryResult).data ?? [];
  const habitEntries = (habitEntriesQuery as { data: Array<{ habit_id: string; date: string; value?: number }> }).data ?? [];
  const notes: Note[] = (notesQuery as NotesQueryResult).data ?? [];
  const journalEntries: JournalEntry[] = (journalQuery as JournalQueryResult).data ?? [];

  const updateTaskMutation = useUpdateTask();
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
      logger.error('DashboardV3', 'Failed to complete task:', { error });
      showError(error, () => void completeTask(taskId));
    } finally {
      setCompletingTask(null);
    }
  };

  const completeHabitSafely = async (habitId: string): Promise<void> => {
    try {
      setCompletingHabit(habitId);
      logger.debug('DashboardV3', 'Complete button clicked', { habitId });
      const today = format(new Date(), 'yyyy-MM-dd');
      await createHabitEntryMutation.mutateAsync({
        habit_id: habitId,
        date: today,
        value: 1,
      });

      setCompletedHabits(prev => new Set(prev).add(habitId));
      showToast('Habit completed! 🎉', 'success');

      setTimeout(() => {
        setCompletedHabits(prev => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
      }, 2000);
    } catch (error) {
      logger.error('DashboardV3', 'Failed to complete habit', { error });
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
    return <DashboardLoadingStateV2 />;
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--color-primary-400)] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-[var(--color-primary-600)] group-hover:rotate-12 transition-transform" />
        ) : (
          <Sun className="w-5 h-5 text-[var(--color-accent-500)] group-hover:rotate-180 transition-transform" />
        )}
      </button>

      {/* Welcome Banner - V2 Design */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <WelcomeBannerV2 />
        <GamificationWidgetV2 variant="compact" />
      </div>

      {/* Stats Grid - V2 Design */}
      <StatsGridV2 />

      {/* Morning Briefing & Smart Scheduler - V2 Design */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <MorningBriefingV2
          className="xl:col-span-1"
          onCompleteTask={completeTask}
          onCompleteHabit={completeHabitSafely}
        />
        <div className="xl:col-span-2 space-y-6">
          <SmartSchedulerV2 className="hidden xl:block" />
        </div>
      </div>

      {/* Smart Scheduler - visible on mobile/tablet below briefing - V2 Design */}
      <SmartSchedulerV2 className="xl:hidden" />

      {/* Main Content Grid - V2 Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayTasksSectionV2
          tasks={todayTodos}
          onViewAll={() => setActiveView('scheduler')}
          onComplete={completeTask}
          completingTask={completingTask}
        />

        <TodayHabitsSectionV2
          habits={todayHabits}
          hasAnyHabits={habits.length > 0}
          onViewAll={() => setActiveView('habits')}
          onComplete={completeHabitSafely}
          completingHabit={completingHabit}
          completedHabits={completedHabits}
        />

        <RecentNotesSectionV2
          notes={recentNotes}
          onViewAll={() => setActiveView('notes')}
        />

        <WeeklyOverviewV2
          completedTasks={completedTodosThisWeek.length}
          journalEntries={thisWeekJournalEntries.length}
          totalHabits={habits.length}
        />
      </div>

      {/* Upcoming Deadlines - V2 Design */}
      <UpcomingDeadlinesV2
        tasks={upcomingTodos}
        onComplete={completeTask}
        completingTask={completingTask}
      />
    </div>
  );
}

