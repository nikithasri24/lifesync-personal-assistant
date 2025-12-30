import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, TrendingUp, AlertCircle, Lightbulb, Target } from 'lucide-react';
import type { LifeGoal, LifeGoalCheckin, CreateCheckinInput, CheckinMood } from '../types/lifeGoals';
import { createCheckin, getGoalCheckins } from '../api/lifeGoalsAPI';
import { lifeGoalsKeys, useUpdateLifeGoalMutation } from '@/hooks/useLifeGoalsQuery';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface GoalCheckinsProps {
  goal: LifeGoal;
}

const MOOD_OPTIONS: { value: CheckinMood; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Great', emoji: '🎉', color: 'text-emerald-600' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'text-green-600' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'text-yellow-600' },
  { value: 'struggling', label: 'Struggling', emoji: '😓', color: 'text-orange-600' },
  { value: 'stuck', label: 'Stuck', emoji: '😰', color: 'text-red-600' },
];

export function GoalCheckins({ goal }: GoalCheckinsProps): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCheckin, setNewCheckin] = useState({
    progressUpdate: goal.progress,
    notes: '',
    mood: 'good' as CheckinMood,
    blockers: '',
    wins: '',
    nextActions: '',
  });

  const queryClient = useQueryClient();
  const updateGoalMutation = useUpdateLifeGoalMutation();

  // Fetch check-ins
  const { data: checkins = [], isLoading } = useQuery({
    queryKey: lifeGoalsKeys.checkins(goal.id),
    queryFn: () => getGoalCheckins(goal.id),
  });

  // Create check-in mutation
  const createCheckinMutation = useMutation({
    mutationFn: (input: CreateCheckinInput) => createCheckin(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.checkins(goal.id) });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goals() });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goal.id) });
      if (input.progressUpdate !== undefined && input.progressUpdate !== goal.progress) {
        updateGoalMutation.mutate({
          goalId: goal.id,
          updates: { progress: input.progressUpdate },
        });
      }
      setShowAddForm(false);
      setNewCheckin({
        progressUpdate: goal.progress,
        notes: '',
        mood: 'good',
        blockers: '',
        wins: '',
        nextActions: '',
      });
    },
  });

  const handleAddCheckin = (): void => {
    const input: CreateCheckinInput = {
      goalId: goal.id,
      progressUpdate: newCheckin.progressUpdate,
      notes: newCheckin.notes || undefined,
      mood: newCheckin.mood,
      blockers: newCheckin.blockers || undefined,
      wins: newCheckin.wins || undefined,
      nextActions: newCheckin.nextActions || undefined,
    };

    createCheckinMutation.mutate(input);
  };

  // Update progress when goal changes
  useEffect(() => {
    setNewCheckin((prev) => ({ ...prev, progressUpdate: goal.progress }));
  }, [goal.progress]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Check-ins</h3>
            <p className="text-xs text-slate-500">{checkins.length} total check-ins</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
        >
          <Plus className="h-4 w-4" />
          Add Check-in
        </button>
      </div>

      {/* Add check-in form */}
      {showAddForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
          {/* Mood selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">How are you feeling?</label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setNewCheckin({ ...newCheckin, mood: mood.value })}
                  className={`flex-1 rounded-lg border p-2 text-center transition ${
                    newCheckin.mood === mood.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="text-2xl">{mood.emoji}</div>
                  <div className={`text-xs font-medium ${mood.color}`}>{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress update */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Progress Update: {newCheckin.progressUpdate}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={newCheckin.progressUpdate}
              onChange={(e) => setNewCheckin({ ...newCheckin, progressUpdate: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Wins */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-2">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              What went well?
            </label>
            <textarea
              placeholder="Celebrate your wins..."
              value={newCheckin.wins}
              onChange={(e) => setNewCheckin({ ...newCheckin, wins: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Blockers */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-2">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              What's blocking you?
            </label>
            <textarea
              placeholder="Any challenges or obstacles..."
              value={newCheckin.blockers}
              onChange={(e) => setNewCheckin({ ...newCheckin, blockers: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Next actions */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-2">
              <Target className="h-3 w-3 text-indigo-600" />
              What's next?
            </label>
            <textarea
              placeholder="Your next steps..."
              value={newCheckin.nextActions}
              onChange={(e) => setNewCheckin({ ...newCheckin, nextActions: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-2">
              <Lightbulb className="h-3 w-3 text-yellow-600" />
              Additional notes
            </label>
            <textarea
              placeholder="Any other thoughts or reflections..."
              value={newCheckin.notes}
              onChange={(e) => setNewCheckin({ ...newCheckin, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddCheckin}
              disabled={createCheckinMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {createCheckinMutation.isPending ? 'Saving...' : 'Save Check-in'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Check-ins list */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">Loading check-ins...</p>
        </div>
      ) : checkins.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">No check-ins yet</p>
          <p className="text-xs text-slate-500">Track your progress with regular check-ins</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {checkins
            .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
            .map((checkin) => {
              const moodOption = MOOD_OPTIONS.find((m) => m.value === checkin.mood);
              return (
                <li key={checkin.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {moodOption && (
                        <span className="text-2xl" title={moodOption.label}>
                          {moodOption.emoji}
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {new Date(checkin.checkInDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        {checkin.progressUpdate !== undefined && (
                          <p className="text-xs text-slate-500">Progress: {checkin.progressUpdate}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {checkin.wins && (
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-medium text-emerald-900 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Wins
                      </p>
                      <p className="text-xs text-emerald-800">{checkin.wins}</p>
                    </div>
                  )}

                  {checkin.blockers && (
                    <div className="rounded-lg bg-orange-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-medium text-orange-900 mb-1">
                        <AlertCircle className="h-3 w-3" />
                        Blockers
                      </p>
                      <p className="text-xs text-orange-800">{checkin.blockers}</p>
                    </div>
                  )}

                  {checkin.nextActions && (
                    <div className="rounded-lg bg-indigo-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-medium text-indigo-900 mb-1">
                        <Target className="h-3 w-3" />
                        Next Actions
                      </p>
                      <p className="text-xs text-indigo-800">{checkin.nextActions}</p>
                    </div>
                  )}

                  {checkin.notes && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-medium text-slate-900 mb-1">
                        <Lightbulb className="h-3 w-3" />
                        Notes
                      </p>
                      <p className="text-xs text-slate-700">{checkin.notes}</p>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export default GoalCheckins;
