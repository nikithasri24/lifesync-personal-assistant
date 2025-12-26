import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Trophy } from 'lucide-react';
import type { LifeGoal, LifeGoalMilestone, CreateMilestoneInput } from '../types/lifeGoals';
import { addMilestone, updateMilestone, deleteMilestone } from '../api/lifeGoalsAPI';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GoalMilestonesProps {
  goal: LifeGoal;
  milestones?: LifeGoalMilestone[];
  onMilestonesUpdated?: (goal: LifeGoal, milestones: LifeGoalMilestone[]) => void;
}

export function GoalMilestones({ goal, milestones = [], onMilestonesUpdated }: GoalMilestonesProps): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', targetDate: '' });
  const queryClient = useQueryClient();

  // Mutations
  const addMilestoneMutation = useMutation({
    mutationFn: (input: CreateMilestoneInput) => addMilestone(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lifeGoals'] });
      setShowAddForm(false);
      setNewMilestone({ title: '', description: '', targetDate: '' });
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateMilestone(id, { isCompleted }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lifeGoals'] });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lifeGoals'] });
    },
  });

  const handleAddMilestone = (): void => {
    if (!newMilestone.title.trim()) return;

    const input: CreateMilestoneInput = {
      goalId: goal.id,
      title: newMilestone.title,
      description: newMilestone.description || undefined,
      targetDate: newMilestone.targetDate || undefined,
      orderIndex: milestones.length,
    };

    addMilestoneMutation.mutate(input);
  };

  const handleToggleMilestone = (milestone: LifeGoalMilestone): void => {
    toggleMilestoneMutation.mutate({
      id: milestone.id,
      isCompleted: !milestone.isCompleted,
    });
  };

  const handleDeleteMilestone = (milestoneId: string): void => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      deleteMilestoneMutation.mutate(milestoneId);
    }
  };

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount = milestones.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Milestones</h3>
            <p className="text-xs text-slate-500">
              {completedCount} of {totalCount} completed ({completionPercentage}%)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      )}

      {/* Add milestone form */}
      {showAddForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <input
            type="text"
            placeholder="Milestone title"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <textarea
            placeholder="Description (optional)"
            value={newMilestone.description}
            onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="date"
            value={newMilestone.targetDate}
            onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddMilestone}
              disabled={addMilestoneMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {addMilestoneMutation.isPending ? 'Adding...' : 'Add Milestone'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewMilestone({ title: '', description: '', targetDate: '' });
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">No milestones yet</p>
          <p className="text-xs text-slate-500">Break down your goal into smaller, achievable steps</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {milestones
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((milestone) => (
              <li
                key={milestone.id}
                className={`group flex items-start gap-3 rounded-lg border p-3 transition ${
                  milestone.isCompleted
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleMilestone(milestone)}
                  className="mt-0.5 flex-shrink-0"
                >
                  {milestone.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 transition group-hover:text-indigo-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      milestone.isCompleted ? 'text-emerald-900 line-through' : 'text-slate-900'
                    }`}
                  >
                    {milestone.title}
                  </p>
                  {milestone.description && (
                    <p className="mt-1 text-xs text-slate-600">{milestone.description}</p>
                  )}
                  {milestone.targetDate && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(milestone.targetDate).toLocaleDateString()}
                    </div>
                  )}
                  {milestone.completedDate && (
                    <p className="mt-1 text-xs text-emerald-600">
                      ✓ Completed {new Date(milestone.completedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className="flex-shrink-0 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default GoalMilestones;
