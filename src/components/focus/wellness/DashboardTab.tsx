import React from 'react';
import {
  Eye,
  Droplets,
  Heart,
  Wind,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { type WellnessEvent, type HealthMetrics, type FocusSessionType } from './types';
import { Frown, Meh, Smile } from 'lucide-react';

interface Props {
  todayEvents: WellnessEvent[];
  todayMetrics: HealthMetrics | undefined;
  todayWater: number;
  activeFocusSession?: FocusSessionType;
  onEyeStrainExercise: () => void;
  onAddWater: () => void;
  onShowMoodLogger: () => void;
  onShowBreathing: () => void;
}

const getMoodIcon = (mood: number): JSX.Element => {
  if (mood <= 2) return <Frown className="w-6 h-6 text-red-500" />;
  if (mood <= 3) return <Meh className="w-6 h-6 text-yellow-500" />;
  return <Smile className="w-6 h-6 text-green-500" />;
};

export const DashboardTab: React.FC<Props> = ({
  todayEvents,
  todayMetrics,
  todayWater,
  activeFocusSession,
  onEyeStrainExercise,
  onAddWater,
  onShowMoodLogger,
  onShowBreathing
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={onEyeStrainExercise}
          className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:shadow-lg transition-all group"
        >
          <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Eye Care</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">20-20-20 Rule</div>
        </button>

        <button
          onClick={onAddWater}
          className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl hover:shadow-lg transition-all group"
        >
          <Droplets className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Hydration</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">{todayWater} glasses today</div>
        </button>

        <button
          onClick={onShowMoodLogger}
          className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl hover:shadow-lg transition-all group"
        >
          <Heart className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Mood</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Log feelings</div>
        </button>

        <button
          onClick={onShowBreathing}
          className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl hover:shadow-lg transition-all group"
        >
          <Wind className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Breathing</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Guided exercises</div>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Wellness</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Completed Activities</h4>
            <div className="space-y-2">
              {todayEvents.filter(e => e.completed).map((event) => (
                <div key={event.id} className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                    {event.type.replace('_', ' ')} at {format(event.timestamp, 'HH:mm')}
                  </span>
                </div>
              ))}
              {todayEvents.filter(e => e.completed).length === 0 && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  No activities completed yet today
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Pending Reminders</h4>
            <div className="space-y-2">
              {todayEvents.filter(e => !e.completed).map((event) => (
                <div key={event.id} className="flex items-center space-x-3">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {todayEvents.filter(e => !e.completed).length === 0 && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  All reminders completed! 🎉
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-white">Health Snapshot</h4>
            {todayMetrics && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Sleep Quality</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {todayMetrics.sleepQuality}/5
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Water Intake</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {todayWater} glasses
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Mood</span>
                  <span className="flex items-center space-x-1">
                    {getMoodIcon(todayMetrics.mood)}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {todayMetrics.mood}/5
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeFocusSession && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Focus Session Health</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(activeFocusSession.duration / 60)}</div>
              <div className="text-sm text-indigo-100">Minutes Focused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {todayEvents.filter(e => e.completed && e.type === 'eye_strain').length}
              </div>
              <div className="text-sm text-indigo-100">Eye Breaks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{todayWater}</div>
              <div className="text-sm text-indigo-100">Water Glasses</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
