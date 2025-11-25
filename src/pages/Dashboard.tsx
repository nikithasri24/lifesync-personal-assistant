/* eslint-disable max-lines */
import {
  CheckSquare,
  Target,
  FileText,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { format, isToday, isSameDay, addDays } from 'date-fns';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useState, useEffect } from 'react';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import SeventyFiveHardWidget from '../components/SeventyFiveHardWidget';
import { useTasks, useUpdateTask } from '../hooks/useTasksQuery';
import { useHabits, useCreateHabitEntry, useHabitEntries } from '../hooks/useHabitsQuery';
import { useNotes } from '../hooks/useNotesQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import { logger } from '../services/logger';
import type { Task } from '../lib/supabase';
import type { Habit, Note, JournalEntry } from '../types';

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

interface ToggleTaskMutation {
  mutateAsync: (args: { taskId: string; currentStatus: string }) => Promise<void>;
}

interface CompleteHabitMutation {
  mutateAsync: (habitId: string) => Promise<void>;
}

export default function Dashboard(): JSX.Element {
  const { setActiveView } = useAppStore();

  // React Query hooks for all data sources
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const tasksQuery = useTasks();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const habitsQuery = useHabits({ isActive: true }); // Only show active habits like the Habits page
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const habitEntriesQuery = useHabitEntries(); // Load habit entries to show completion status
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const notesQuery = useNotes();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const journalQuery = useJournalEntries();

  const tasks: Task[] = (tasksQuery as TasksQueryResult).data ?? [];
  const tasksLoading: boolean = (tasksQuery as TasksQueryResult).isLoading ?? false;
  const habits: Habit[] = (habitsQuery as HabitsQueryResult).data ?? [];
  const habitEntries = (habitEntriesQuery as { data: Array<{ habit_id: string; date: string; value?: number }> }).data ?? [];
  const notes: Note[] = (notesQuery as NotesQueryResult).data ?? [];
  const journalEntries: JournalEntry[] = (journalQuery as JournalQueryResult).data ?? [];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const updateTaskMutation = useUpdateTask();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const createHabitEntryMutation = useCreateHabitEntry();

  const [isLoading, setIsLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const completeTask = async (taskId: string): Promise<void> => {
    try {
      setCompletingTask(taskId);
      const task = tasks.find((t: Task) => t.id === taskId);
      if (!task) return;
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await updateTaskMutation.mutateAsync({ id: taskId, updates: { status: newStatus } });
    } catch (error) {
      logger.error('Failed to complete task:', { error });
    } finally {
      setCompletingTask(null);
    }
  };

  const completeHabitSafely = async (habitId: string): Promise<void> => {
    try {
      logger.debug('[Dashboard] Complete button clicked', { habitId });
      const today = format(new Date(), 'yyyy-MM-dd');
      await createHabitEntryMutation.mutateAsync({
        habit_id: habitId,
        date: today,
        value: 1,
      });
      showToast('Habit completed!', 'success');
    } catch (error) {
      logger.error('[Dashboard] Failed to complete habit', { error });
      showToast('Unable to record that habit completion. Please try again.', 'error');
    }
  };

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Note: 75 Hard todo cleanup/sync is already handled by App.tsx → loadSFHChallenge() → ensureSFHTodosForToday()
  // No need to call it again here to avoid race condition and duplicate task creation

  // Helper to identify 75 Hard tasks (both old 'sfh' tag and new '75hard' tag)
  const isSFH = (t: Task): boolean => {
    const tags = Array.isArray(t.tags) ? t.tags : [];
    return tags.includes('sfh') ?? tags.includes('75hard');
  };

  const todayTodosAll = tasks.filter((task: Task): boolean =>
    task.status !== 'done' && !task.deleted &&
    !!task.due_date &&
    isToday(new Date(task.due_date))
  );
  // Exclude 75 Hard from Dashboard metrics and list to focus on actual tasks
  const todayTodos = todayTodosAll.filter((t: Task): boolean => !isSFH(t));

  const upcomingTodos = tasks.filter((task: Task): boolean =>
    task.status !== 'done' && !task.deleted &&
    !!task.due_date &&
    new Date(task.due_date) > new Date() &&
    new Date(task.due_date) <= addDays(new Date(), 7)
  ).filter((t: Task): boolean => !isSFH(t));

  // Filter habits to show only incomplete ones for today (sync with Habits page logic)
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayHabits = habits
    .filter((habit: Habit) => {
      // Count today's completions for this habit
      const todayCompletions = habitEntries.filter(
        entry => entry.habit_id === habit.id && entry.date === todayKey
      ).length;
      const targetCount = habit.targetValue ?? 1;
      // Only show habits that haven't reached their target yet
      return todayCompletions < targetCount;
    })
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

  // Dashboard completion stats - exclude 75 Hard tasks since they're managed separately
  const completedTodosThisWeek = tasks.filter((task: Task): boolean => {
    if (task.status !== 'done' || task.deleted) return false;
    if (isSFH(task)) return false; // Exclude 75 Hard tasks from completion stats
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
      onClick: (): void => setActiveView('todos')
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
      onClick: (): void => setActiveView('todos')
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
      {/* Welcome Section - Enhanced Mobile */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 font-display text-black dark:text-white">Welcome back!</h1>
          <p className="text-base sm:text-lg text-black/80 dark:text-white/90">
            Here's what's happening with your life today.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white opacity-10 rounded-full transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8"></div>
        <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white opacity-5 rounded-full transform -translate-x-2 sm:-translate-x-4 translate-y-2 sm:translate-y-4"></div>
      </div>

      {/* Stats Grid - Enhanced Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className="group card hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in active:scale-95"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-secondary mb-1 truncate">{card.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary font-display">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0`}>
                <card.icon className="text-white" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 75 Hard Challenge Widget */}
      <SeventyFiveHardWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Tasks */}
        <div className="card animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary font-display">Today's Tasks</h3>
            <button
              onClick={() => setActiveView('todos')}
              className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {todayTodos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-muted">No tasks for today!</p>
              </div>
            ) : (
              todayTodos.slice(0, 5).map((task: Task, index: number) => (
                <div
                  key={task.id}
                  className="group flex items-center space-x-4 p-4 bg-tertiary rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={(): void => { void completeTask(task.id); }}
                    disabled={completingTask === task.id}
                    className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200 ${
                      completingTask === task.id
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                        : 'border-muted hover:border-accent hover:bg-accent hover:text-white'
                    }`}
                    title="Mark as complete"
                  >
                    {completingTask === task.id ? (
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckSquare size={14} />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-secondary mt-1">
                        Due: {format(new Date(task.due_date), 'MMM dd')}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'urgent' ? 'bg-error-light text-error' :
                    task.priority === 'high' ? 'bg-warning-light text-warning' :
                    task.priority === 'medium' ? 'bg-warning-light text-warning' :
                    'bg-tertiary text-secondary'
                  }`}>
                    {task.priority ?? 'low'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Habits */}
        <div className="card animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary font-display">Today's Habits</h3>
            <button
              onClick={() => setActiveView('habits')}
              className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {todayHabits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-muted">All habits completed!</p>
              </div>
            ) : (
              todayHabits.slice(0, 5).map((habit: Habit, index: number) => (
                  <div
                    key={habit.id}
                    className="group flex items-center justify-between p-4 bg-tertiary rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-primary">{habit.name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                            Streak: {habit.streak || 0}
                          </span>
                        </div>
                        <p className="text-xs text-secondary mt-1">
                          {habit.description || 'Track your progress'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(): void => { void completeHabitSafely(habit.id); }}
                      className="btn-primary text-xs px-4 py-2 hover:shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      Complete
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="card animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary font-display">Recent Notes</h3>
            <button
              onClick={() => setActiveView('notes')}
              className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recentNotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-muted">No notes yet. Start writing!</p>
              </div>
            ) : (
              recentNotes.map((note: Note, index: number) => (
                <div
                  key={note.id}
                  className="group p-4 bg-tertiary rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <h4 className="text-sm font-medium text-primary mb-2 group-hover:text-accent transition-colors duration-200">
                    {note.title}
                  </h4>
                  <p className="text-xs text-secondary mb-3">
                    {format(new Date(note.updatedAt), 'MMM dd, yyyy')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-accent-soft text-accent rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="card animate-scale-in">
          <h3 className="text-xl font-semibold text-primary font-display mb-6">This Week</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent rounded-lg">
                  <CheckSquare size={18} className="text-white" />
                </div>
                <span className="font-medium text-black">Tasks Completed</span>
              </div>
              <span className="text-2xl font-bold text-black font-display">{completedTodosThisWeek.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent rounded-lg">
                  <BookOpen size={18} className="text-white" />
                </div>
                <span className="font-medium text-black">Journal Entries</span>
              </div>
              <span className="text-2xl font-bold text-black font-display">{thisWeekJournalEntries.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Target size={18} className="text-white" />
                </div>
                <span className="font-medium text-black">Total Habits</span>
              </div>
              <span className="text-2xl font-bold text-black font-display">{habits.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      {upcomingTodos.length > 0 && (
        <div className="card animate-fade-in">
          <h3 className="text-xl font-semibold text-primary font-display mb-6">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {upcomingTodos.slice(0, 3).map((task: Task, index: number) => (
              <div
                key={task.id}
                className="group flex items-center justify-between p-4 bg-warning-light border border-warning rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(): void => { void completeTask(task.id); }}
                    disabled={completingTask === task.id}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                      completingTask === task.id
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                        : 'border-warning hover:bg-warning hover:text-white'
                    }`}
                    title="Mark as complete"
                  >
                    {completingTask === task.id ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckSquare size={16} />
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-warning transition-colors duration-200">
                      {task.title}
                    </p>
                    <p className="text-xs text-secondary mt-1">
                      Due: {task.due_date && format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-2 rounded-full text-xs font-medium ${
                  task.priority === 'urgent' ? 'bg-error text-white' :
                  task.priority === 'high' ? 'bg-warning text-white' :
                  'bg-warning text-white'
                }`}>
                  {task.priority ?? 'low'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
