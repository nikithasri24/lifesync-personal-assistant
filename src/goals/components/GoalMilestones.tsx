/**
 * Goal Milestones Component
 * View and manage milestones for a goal
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Award } from 'lucide-react';
import { addMilestone, updateMilestone, deleteMilestone, updateLifeGoal } from '../api/lifeGoalsAPI';
import type { LifeGoalMilestone, LifeGoal } from '../types/lifeGoals';
import { logger } from '../../services/logger';

interface GoalMilestonesProps {
  goal: LifeGoal;
  milestones: LifeGoalMilestone[];
  onMilestonesUpdated: (goal: LifeGoal, milestones: LifeGoalMilestone[]) => void;
}

const GoalMilestones: React.FC<GoalMilestonesProps> = ({ goal, milestones, onMilestonesUpdated }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDescription, setNewMilestoneDescription] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const progressFromMilestones = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : goal.progress;

  const handleToggleComplete = async (milestone: LifeGoalMilestone): Promise<void> => {
    try {
      const updated = await updateMilestone(milestone.id, {
        isCompleted: !milestone.isCompleted,
      });

      const updatedMilestones = milestones.map(m =>
        m.id === milestone.id ? updated : m
      );

      // Update goal progress based on milestones
      const newProgress = Math.round((updatedMilestones.filter(m => m.isCompleted).length / updatedMilestones.length) * 100);
      const updatedGoal = await updateLifeGoal(goal.id, {
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'not-started',
        completedDate: newProgress === 100 ? new Date().toISOString() : undefined,
      });

      onMilestonesUpdated(updatedGoal, updatedMilestones);
    } catch (error) {
      logger.error('Error updating milestone:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to update milestone');
    }
  };

  const handleAddMilestone = async (): Promise<void> => {
    if (!newMilestoneTitle.trim()) return;

    try {
      const newMilestone = await addMilestone({
        goalId: goal.id,
        title: newMilestoneTitle,
        description: newMilestoneDescription,
        orderIndex: milestones.length,
        targetDate: newMilestoneDate || undefined,
      });

      const updatedMilestones = [...milestones, newMilestone];
      onMilestonesUpdated(goal, updatedMilestones);

      setNewMilestoneTitle('');
      setNewMilestoneDescription('');
      setNewMilestoneDate('');
      setShowAddForm(false);
    } catch (error) {
      logger.error('Error adding milestone:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to add milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!confirm('Delete this milestone?')) return;

    try {
      await deleteMilestone(milestoneId);
      const updatedMilestones = milestones.filter(m => m.id !== milestoneId);

      // Recalculate progress
      if (updatedMilestones.length > 0) {
        const newProgress = Math.round((updatedMilestones.filter(m => m.isCompleted).length / updatedMilestones.length) * 100);
        const updatedGoal = await updateLifeGoal(goal.id, {
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in-progress' : 'not-started',
          completedDate: newProgress === 100 ? new Date().toISOString() : undefined,
        });
        onMilestonesUpdated(updatedGoal, updatedMilestones);
      } else {
        onMilestonesUpdated(goal, updatedMilestones);
      }
    } catch (error) {
      logger.error('Error deleting milestone:', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to delete milestone');
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">
            Milestones {milestones.length > 0 && `(${completedCount}/${milestones.length})`}
          </h4>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add milestone
        </button>
      </div>

      {/* Progress from milestones */}
      {milestones.length > 0 && progressFromMilestones !== goal.progress && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          💡 Based on milestones, this goal is {progressFromMilestones}% complete
        </div>
      )}

      {/* Add milestone form */}
      {showAddForm && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <input
            type="text"
            placeholder="Milestone title"
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={newMilestoneDescription}
            onChange={(e) => setNewMilestoneDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
            rows={2}
          />
          <input
            type="date"
            value={newMilestoneDate}
            onChange={(e) => setNewMilestoneDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { void handleAddMilestone(); }}
              disabled={!newMilestoneTitle.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:bg-slate-300"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewMilestoneTitle('');
                setNewMilestoneDescription('');
                setNewMilestoneDate('');
              }}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No milestones yet. Break this goal into steps!</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                milestone.isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <button
                onClick={() => { void handleToggleComplete(milestone); }}
                className="flex-shrink-0 mt-0.5"
              >
                {milestone.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400 hover:text-indigo-600" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      milestone.isCompleted ? 'text-green-900 line-through' : 'text-slate-900'
                    }`}>
                      {index + 1}. {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-slate-600 mt-1">{milestone.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      {milestone.targetDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.targetDate).toLocaleDateString()}
                        </span>
                      )}
                      {milestone.isCompleted && milestone.completedDate && (
                        <span className="text-green-700">
                          ✓ Completed {new Date(milestone.completedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { void handleDeleteMilestone(milestone.id); }}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalMilestones;
