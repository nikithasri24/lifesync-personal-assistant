/**
 * Goal Check-ins Component
 * Regular accountability check-ins with mood, blockers, wins, and next actions
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Smile, Frown, Meh, TrendingUp, AlertCircle, Lightbulb, Plus, Calendar } from 'lucide-react';
import { createCheckin, getGoalCheckins } from '../api/lifeGoalsAPI';
import type { LifeGoal, LifeGoalCheckin } from '../types/lifeGoals';
import { logger } from '../../services/logger';

interface GoalCheckinsProps {
  goal: LifeGoal;
}

const moodIcons = {
  great: { icon: Smile, label: 'Great', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' },
  good: { icon: Smile, label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  okay: { icon: Meh, label: 'Okay', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  struggling: { icon: Frown, label: 'Struggling', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
  stuck: { icon: Frown, label: 'Stuck', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
};

const GoalCheckins: React.FC<GoalCheckinsProps> = ({ goal }) => {
  const [checkins, setCheckins] = useState<LifeGoalCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check-in form state
  const [progressUpdate, setProgressUpdate] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'struggling' | 'stuck'>('okay');
  const [blockers, setBlockers] = useState('');
  const [wins, setWins] = useState('');
  const [nextActions, setNextActions] = useState('');

  useEffect(() => {
    loadCheckins();
  }, [goal.id]);

  const loadCheckins = async () => {
    try {
      setLoading(true);
      const data = await getGoalCheckins(goal.id);
      setCheckins(data);
    } catch (error) {
      logger.error('Error loading check-ins:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCheckin = async () => {
    if (!progressUpdate.trim()) {
      alert('Please add a progress update');
      return;
    }

    try {
      setSubmitting(true);

      const checkin = await createCheckin({
        goalId: goal.id,
        progressUpdate,
        notes: notes || undefined,
        mood,
        blockers: blockers || undefined,
        wins: wins || undefined,
        nextActions: nextActions || undefined,
      });

      setCheckins(prev => [checkin, ...prev]);

      // Reset form
      setProgressUpdate('');
      setNotes('');
      setMood('okay');
      setBlockers('');
      setWins('');
      setNextActions('');
      setShowForm(false);
    } catch (error) {
      logger.error('Error creating check-in:', { error });
      alert('Failed to save check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-900">
            Check-ins {checkins.length > 0 && `(${checkins.length})`}
          </h4>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add check-in
        </button>
      </div>

      {/* Check-in form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Progress Update *
            </label>
            <textarea
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              placeholder="What progress have you made since your last check-in?"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              How are you feeling about this goal?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(moodIcons) as Array<keyof typeof moodIcons>).map((moodKey) => {
                const moodData = moodIcons[moodKey];
                const MoodIcon = moodData.icon;
                const isSelected = mood === moodKey;

                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => setMood(moodKey)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${moodData.bg} ${moodData.border}`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <MoodIcon className={`h-5 w-5 ${isSelected ? moodData.color : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium ${isSelected ? moodData.color : 'text-slate-600'}`}>
                      {moodData.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Wins & Achievements
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well? Any wins to celebrate?"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Blockers & Challenges
            </label>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="What's holding you back or making this difficult?"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Next Actions
            </label>
            <textarea
              value={nextActions}
              onChange={(e) => setNextActions(e.target.value)}
              placeholder="What are your next steps?"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other thoughts or observations?"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmitCheckin}
              disabled={submitting || !progressUpdate.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded font-medium hover:bg-indigo-700 disabled:bg-slate-300"
            >
              {submitting ? 'Saving...' : 'Save Check-in'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setProgressUpdate('');
                setNotes('');
                setMood('okay');
                setBlockers('');
                setWins('');
                setNextActions('');
              }}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded font-medium hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Check-in history */}
      {checkins.length === 0 ? (
        <p className="text-xs text-slate-500 italic">
          No check-ins yet. Add your first check-in to track your progress!
        </p>
      ) : (
        <div className="space-y-3">
          {checkins.map((checkin) => {
            const moodData = moodIcons[checkin.mood];
            const MoodIcon = moodData.icon;

            return (
              <div
                key={checkin.id}
                className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 ${moodData.bg} rounded-lg`}>
                      <MoodIcon className={`h-4 w-4 ${moodData.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        {moodData.label}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(checkin.checkInDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Update */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-indigo-600" />
                    <p className="text-xs font-semibold text-slate-700">Progress</p>
                  </div>
                  <p className="text-sm text-slate-900">{checkin.progressUpdate}</p>
                </div>

                {/* Wins */}
                {checkin.wins && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <p className="text-xs font-semibold text-green-900">Wins</p>
                    </div>
                    <p className="text-xs text-green-800">{checkin.wins}</p>
                  </div>
                )}

                {/* Blockers */}
                {checkin.blockers && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <p className="text-xs font-semibold text-orange-900">Blockers</p>
                    </div>
                    <p className="text-xs text-orange-800">{checkin.blockers}</p>
                  </div>
                )}

                {/* Next Actions */}
                {checkin.nextActions && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb className="h-3 w-3 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-900">Next Actions</p>
                    </div>
                    <p className="text-xs text-blue-800">{checkin.nextActions}</p>
                  </div>
                )}

                {/* Additional Notes */}
                {checkin.notes && (
                  <div className="border-t border-slate-200 pt-2">
                    <p className="text-xs text-slate-600 italic">{checkin.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalCheckins;
