import React from 'react';
import { Plus, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { LoadingButton } from '../../components/LoadingButton';

interface HabitWithProgress {
  id: string;
  name: string;
  description?: string;
  color: string;
  streak?: number;
  todayCompletions: number;
  targetCount: number;
  isComplete: boolean;
}

interface TodayHabitsSectionProps {
  habits: HabitWithProgress[];
  hasAnyHabits: boolean;
  onViewAll: () => void;
  onComplete: (habitId: string) => void;
  completingHabit: string | null;
  completedHabits: Set<string>;
}

/**
 * Today's habits section with completion and streak tracking
 */
export function TodayHabitsSection({
  habits,
  hasAnyHabits,
  onViewAll,
  onComplete,
  completingHabit,
  completedHabits,
}: TodayHabitsSectionProps): React.ReactElement {
  return (
    <div className="card animate-slide-in-right">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-primary font-display">Today's Habits</h3>
        <button
          onClick={onViewAll}
          className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
        >
          View all →
        </button>
      </div>
      <div className="space-y-3">
        {habits.length === 0 ? (
          hasAnyHabits ? (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 mb-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-lg font-semibold text-primary mb-2">All habits completed! 🎉</h4>
              <p className="text-sm text-secondary mb-2 max-w-xs mx-auto">
                Great job! You've completed all your habits for today.
              </p>
              <p className="text-xs text-muted">Keep the streak going tomorrow!</p>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-primary mb-2">Build better habits</h4>
              <p className="text-sm text-secondary mb-4 max-w-xs mx-auto">
                Track daily habits like exercise, reading, or meditation to build a better you.
              </p>
              <LoadingButton
                onClick={onViewAll}
                variant="success"
                size="md"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Create Your First Habit
              </LoadingButton>
            </div>
          )
        ) : (
          habits.map((habit, index: number) => {
            const isJustCompleted = completedHabits.has(habit.id);
            const isProcessing = completingHabit === habit.id;

            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-4 bg-tertiary rounded-xl transition-all duration-300 ${
                  isJustCompleted
                    ? 'animate-celebrate bg-green-50 border-2 border-green-400 shadow-lg'
                    : 'hover:shadow-md hover:-translate-y-1'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Color indicator with completion checkmark */}
                  <div className="relative">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm transition-all duration-200"
                      style={{ backgroundColor: habit.color }}
                    />
                    {isJustCompleted && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 animate-checkmark-pop">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-primary">{habit.name}</p>

                      {/* Progress indicator */}
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                        {habit.todayCompletions}/{habit.targetCount} today
                      </span>

                      {/* Streak badge */}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                        🔥 {habit.streak || 0}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      {habit.description || 'Track your progress'}
                    </p>
                  </div>
                </div>

                {/* Complete button with loading state */}
                <button
                  onClick={(): void => { onComplete(habit.id); }}
                  disabled={isProcessing || isJustCompleted}
                  className={`btn-primary text-xs px-4 py-2 transform transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-wait'
                      : isJustCompleted
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">⏳</span> Saving...
                    </span>
                  ) : isJustCompleted ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done!
                    </span>
                  ) : (
                    'Complete'
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
