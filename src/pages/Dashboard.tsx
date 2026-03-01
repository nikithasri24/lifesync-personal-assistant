/**
 * Dashboard Page - Aggregated home screen
 * Matches dashboard-design-spec.html with centered 900px layout
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUpdateTask } from '@/hooks/useTasksQuery';
import { useHabits, useCreateHabitEntry, useHabitEntries } from '@/hooks/useHabitsQuery';
import { useNotes, useCreateNote } from '@/hooks/useNotesQuery';
import { useJournalEntries, useCreateJournalEntry } from '@/hooks/useJournalQuery';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';
import { useModalState } from '@/hooks/useModalState';
import { DashboardHeaderV2 } from '@/dashboard/components/v2/DashboardHeaderV2';
import { QuickActionsV2 } from '@/dashboard/components/v2/QuickActionsV2';
import { BriefingCardV2 } from '@/dashboard/components/v2/BriefingCardV2';
import { TodayTasksSectionV2, TodayHabitsSectionV2, RecentNotesSectionV2 } from '@/dashboard/components/v2';
import { QuickAddModalV2 } from '@/dashboard/components/v2/QuickAddModalV2';
import { NoteFormModalV2 } from '@/notes/components/v2/NoteFormModalV2';
import { JournalEntryModalV2 } from '@/journal/components/v2/JournalEntryModalV2';
import { useTaskModals } from '@/todos/hooks/useTaskModals';
import type { Task, Habit, Note, JournalEntry } from '@/types';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

function DashboardContent() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Date caps: only load data relevant to what the dashboard actually shows
  const today = new Date().toISOString().split('T')[0];
  const weekStart = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];
  })();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  // Data fetching — scoped to what the dashboard needs
  const tasksQuery = useTasks();
  const habitsQuery = useHabits({ isActive: true });
  // Habit entries: only this week (dashboard shows weekly progress)
  const habitEntriesQuery = useHabitEntries({ startDate: weekStart, endDate: today });
  const notesQuery = useNotes();
  // Journal entries: only last 30 days (dashboard shows recent entries)
  const journalQuery = useJournalEntries({ startDate: thirtyDaysAgo, endDate: new Date() });

  const tasks: Task[] = (tasksQuery as { data: Task[] }).data ?? [];
  const habits: Habit[] = (habitsQuery as unknown as { data: Habit[] }).data ?? [];
  const habitEntries = habitEntriesQuery.data ?? [];
  const notes: Note[] = (notesQuery as { data: Note[] }).data ?? [];
  const journalEntries: JournalEntry[] = (journalQuery as { data: JournalEntry[] }).data ?? [];

  const isLoading = tasksQuery.isLoading || habitsQuery.isLoading || habitEntriesQuery.isLoading || notesQuery.isLoading || journalQuery.isLoading;

  // Task modals
  const modals = useTaskModals();

  // Additional modals for note and journal
  const quickModals = useModalState({
    showNote: false,
    showJournal: false,
  });

  // Mutations
  const updateTaskMutation = useUpdateTask();
  const createHabitEntryMutation = useCreateHabitEntry();
  const createNoteMutation = useCreateNote();
  const createJournalMutation = useCreateJournalEntry();

  // Completion tracking
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());

  // Filter today's tasks
  const todayTasks = tasks.filter(t =>
    t.due_date && t.due_date.startsWith(today) && t.status !== 'done'
  ).slice(0, 5);

  // Filter today's habits - only show incomplete habits
  const todayHabits = useMemo(() => {
    return habits
      .map((habit) => {
        const habitEntriesForHabit = habitEntries.filter(entry => entry.habit_id === habit.id);
        const targetCount = habit.target_value ?? 1;
        const todayCompletions = habitEntriesForHabit.filter(
          entry => entry.date === today
        ).length;
        const isComplete = todayCompletions >= targetCount;

        return {
          id: habit.id,
          name: habit.name,
          description: habit.description,
          color: habit.color || '#10B981',
          streak: habit.streak_count,
          todayCompletions,
          targetCount,
          isComplete,
        };
      })
      .filter(habit => !habit.isComplete) // Only show incomplete habits
      .slice(0, 5);
  }, [habits, habitEntries, today]);

  // Get raw incomplete habits for briefing (just Habit type)
  const incompleteHabitsForBriefing = useMemo(() => {
    const incompleteIds = new Set(todayHabits.map(h => h.id));
    return habits.filter(h => incompleteIds.has(h.id!));
  }, [habits, todayHabits]);

  // Recent notes
  const recentNotes = notes.slice(0, 2);

  // Stats
  const stats = {
    tasks: todayTasks.length, // Count only today's tasks
    habits: todayHabits.length, // Count only incomplete habits for today
    notes: notes.length,
    journal: journalEntries.length,
  };

  // Task completion handler
  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompletingTask(taskId);
      await updateTaskMutation.mutateAsync({
        id: taskId,
        updates: { status: 'done' },
      });
      showToast('Task completed! ✅', 'success');
    } catch (error) {
      showToast('Failed to complete task', 'error');
    } finally {
      setCompletingTask(null);
    }
  };

  // Habit completion handler
  const handleCompleteHabit = async (habitId: string) => {
    try {
      setCompletingHabit(habitId);
      const today = new Date().toISOString().split('T')[0];
      await createHabitEntryMutation.mutateAsync({
        habit_id: habitId,
        date: today,
        value: 1,
      });
      // Track completed habits for animation
      setCompletedHabits(prev => new Set(prev).add(habitId));
      showToast('Habit completed! 🎉', 'success');
    } catch (error) {
      showToast('Failed to complete habit', 'error');
    } finally {
      setCompletingHabit(null);
    }
  };

  // Note creation handler
  const handleCreateNote = async (data: {
    title: string;
    content: string;
    tags: string[];
    noteType: string;
  }) => {
    try {
      await createNoteMutation.mutateAsync({
        title: data.title,
        content: data.content,
        tags: data.tags,
        noteType: data.noteType as 'text' | 'list' | 'meeting' | 'idea',
      });
      quickModals.close('showNote');
      showToast('Note created! 📝', 'success');
    } catch (error) {
      showToast('Failed to create note', 'error');
    }
  };

  // Journal entry creation handler
  const handleCreateJournal = async (data: {
    title: string;
    content: string;
  }) => {
    try {
      await createJournalMutation.mutateAsync({
        title: data.title,
        content: data.content,
      });
      quickModals.close('showJournal');
      showToast('Journal entry created! 📔', 'success');
    } catch (error) {
      showToast('Failed to create journal entry', 'error');
    }
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Centered container following CLAUDE.md pattern */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '1.5rem',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)'
      }}>
        {/* Header with terracotta gradient */}
        <DashboardHeaderV2 />

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 animate-pulse"
                  style={{ backgroundColor: colors.bg.white }}
                >
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            {/* Content Skeleton */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl p-5 animate-pulse"
                style={{ backgroundColor: colors.bg.white }}
              >
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Stats Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div
                className="rounded-xl p-4 border-l-4"
                style={{
                  backgroundColor: colors.bg.white,
                  borderLeftColor: '#3B82F6',
                }}
              >
                <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.tasks}
                </div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Tasks Today
                </div>
              </div>
              <div
                className="rounded-xl p-4 border-l-4"
                style={{
                  backgroundColor: colors.bg.white,
                  borderLeftColor: '#10B981',
                }}
              >
                <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.habits}
                </div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Habits
                </div>
              </div>
              <div
                className="rounded-xl p-4 border-l-4"
                style={{
                  backgroundColor: colors.bg.white,
                  borderLeftColor: '#8B5CF6',
                }}
              >
                <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.notes}
                </div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Notes
                </div>
              </div>
              <div
                className="rounded-xl p-4 border-l-4"
                style={{
                  backgroundColor: colors.bg.white,
                  borderLeftColor: '#F59E0B',
                }}
              >
                <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.journal}
                </div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Journal Entries
                </div>
              </div>
            </div>

            {/* Morning Briefing */}
            <BriefingCardV2 tasks={todayTasks} habits={incompleteHabitsForBriefing} />

            {/* Quick Actions */}
            <QuickActionsV2
              onAddTask={modals.openQuickAdd}
              onAddNote={() => quickModals.open('showNote')}
              onAddJournal={() => quickModals.open('showJournal')}
              onStartFocus={() => navigate('/focus')}
            />

            {/* Today's Tasks */}
            <TodayTasksSectionV2
              tasks={todayTasks}
              onViewAll={() => navigate('/todos')}
              onAddTask={modals.openQuickAdd}
              onComplete={handleCompleteTask}
              completingTask={completingTask}
            />

            {/* Today's Habits */}
            <TodayHabitsSectionV2
              habits={todayHabits}
              hasAnyHabits={habits.length > 0}
              onViewAll={() => navigate('/habits')}
              onComplete={handleCompleteHabit}
              completingHabit={completingHabit}
              completedHabits={completedHabits}
            />

            {/* Recent Notes */}
            <RecentNotesSectionV2
              notes={recentNotes}
              onViewAll={() => navigate('/notes')}
            />
          </>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModalV2
        isOpen={modals.showQuickAdd}
        onClose={modals.closeQuickAdd}
        value={modals.quickAddText}
        onChange={modals.setQuickAddText}
      />

      {/* Note Creation Modal */}
      <NoteFormModalV2
        isOpen={quickModals.state.showNote}
        onClose={() => quickModals.close('showNote')}
        onSubmit={handleCreateNote}
        isPending={createNoteMutation.isPending}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModalV2
        isOpen={quickModals.state.showJournal}
        onClose={() => quickModals.close('showJournal')}
        onSubmit={handleCreateJournal}
        isPending={createJournalMutation.isPending}
      />
    </div>
  );
}

// Wrap with error boundary for graceful error handling
export default function Dashboard() {
  return (
    <FeatureErrorBoundary feature="Dashboard">
      <DashboardContent />
    </FeatureErrorBoundary>
  );
}
