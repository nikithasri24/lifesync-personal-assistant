/**
 * Dashboard Page - Aggregated home screen
 * Matches dashboard-design-spec.html with centered 900px layout
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasksQuery';
import { useHabits } from '@/hooks/useHabitsQuery';
import { useNotes } from '@/hooks/useNotesQuery';
import { useJournalEntries } from '@/hooks/useJournalQuery';
import { DashboardHeaderV2 } from '@/dashboard/components/v2/DashboardHeaderV2';
import { QuickActionsV2 } from '@/dashboard/components/v2/QuickActionsV2';
import { BriefingCardV2 } from '@/dashboard/components/v2/BriefingCardV2';
import { StatsGridV2, TodayTasksSectionV2, TodayHabitsSectionV2, RecentNotesSectionV2 } from '@/dashboard/components/v2';
import { useTaskModals } from '@/todos/hooks/useTaskModals';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { useToast } from '@/hooks/useToast';
import { parseQuickAdd } from '@/todos/services/taskHelpers';
import { QuickAddForm } from '@/todos/components';
import type { Task, Habit, Note, JournalEntry } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast, showError } = useToast();

  // Data fetching
  const tasksQuery = useTasks();
  const habitsQuery = useHabits({ isActive: true });
  const notesQuery = useNotes();
  const journalQuery = useJournalEntries();

  const tasks: Task[] = (tasksQuery as { data: Task[] }).data ?? [];
  const habits: Habit[] = (habitsQuery as unknown as { data: Habit[] }).data ?? [];
  const notes: Note[] = (notesQuery as { data: Note[] }).data ?? [];
  const journalEntries: JournalEntry[] = (journalQuery as { data: JournalEntry[] }).data ?? [];

  // Task modals
  const modals = useTaskModals();
  const createTaskMutation = useCreateTask();

  // Filter today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t =>
    t.due_date && t.due_date.startsWith(today) && t.status !== 'done'
  ).slice(0, 5);

  // Filter today's habits
  const todayHabits = habits.slice(0, 5);

  // Recent notes
  const recentNotes = notes.slice(0, 2);

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Centered container like Together/Assistant modules */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header with terracotta gradient */}
        <DashboardHeaderV2 />

        {/* Content area */}
        <div className="px-6 py-4 pb-32">
          {/* Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
              <div className="text-3xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-600 font-medium">Tasks Today</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#10B981' }}>
              <div className="text-3xl font-bold text-gray-900">{habits.length}</div>
              <div className="text-sm text-gray-600 font-medium">Habits</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
              <div className="text-3xl font-bold text-gray-900">{notes.length}</div>
              <div className="text-sm text-gray-600 font-medium">Notes</div>
            </div>
            <div className="bg-white rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
              <div className="text-3xl font-bold text-gray-900">{journalEntries.length}</div>
              <div className="text-sm text-gray-600 font-medium">Journal Entries</div>
            </div>
          </div>

          {/* Morning Briefing */}
          <BriefingCardV2 tasks={todayTasks} habits={todayHabits} />

          {/* Quick Actions */}
          <QuickActionsV2 onAddTask={modals.openQuickAdd} />

          {/* Today's Tasks */}
          <TodayTasksSectionV2
            tasks={todayTasks}
            onViewAll={() => navigate('/todos')}
            onAddTask={modals.openQuickAdd}
            onComplete={() => {}}
            completingTask={null}
          />

          {/* Today's Habits */}
          <TodayHabitsSectionV2
            habits={todayHabits}
            hasAnyHabits={habits.length > 0}
            onViewAll={() => navigate('/habits')}
            onComplete={() => {}}
            completingHabit={null}
            completedHabits={new Set()}
          />

          {/* Recent Notes */}
          <RecentNotesSectionV2
            notes={recentNotes}
            onViewAll={() => navigate('/notes')}
          />
        </div>

        {/* Quick Add Modal */}
        {modals.showQuickAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h3>
              <QuickAddForm
                value={modals.quickAddText}
                onChange={modals.setQuickAddText}
                onSubmit={() => {
                  if (!modals.quickAddText.trim()) return;

                  const parsed = parseQuickAdd(modals.quickAddText, []);

                  createTaskMutation.mutate(
                    {
                      title: parsed.title,
                      description: '',
                      priority: parsed.priority || 'medium',
                      status: 'todo',
                      estimated_time: 25,
                      actual_time: 0,
                      due_date: parsed.dueDate ? parsed.dueDate.toISOString() : new Date().toISOString(),
                      project_id: parsed.projectId ?? null,
                      tags: parsed.tags,
                      category: 'work',
                    },
                    {
                      onSuccess: (newTask) => {
                        modals.setQuickAddText('');
                        modals.closeQuickAdd();
                        showToast(`Task "${newTask.title}" created! ✓`, 'success');
                      },
                      onError: (error) => {
                        showError(error, () => {});
                      },
                    }
                  );
                }}
                onCancel={modals.closeQuickAdd}
                isLoading={createTaskMutation.isPending}
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
