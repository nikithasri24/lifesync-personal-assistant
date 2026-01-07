/**
 * HabitCardV2 Component
 * Habit card with completion tracking and streak display
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flame } from 'lucide-react';

export interface HabitWithProgress {
  id: string;
  name: string;
  description?: string;
  color: string;
  streak?: number;
  todayCompletions: number;
  targetCount: number;
  isComplete: boolean;
}

export interface HabitCardV2Props {
  habit: HabitWithProgress;
  onComplete: (habitId: string) => void;
  isCompleting?: boolean;
  isJustCompleted?: boolean;
  index?: number;
}

export const HabitCardV2: React.FC<HabitCardV2Props> = ({
  habit,
  onComplete,
  isCompleting = false,
  isJustCompleted = false,
  index = 0,
}) => {
  const progress = habit.targetCount > 0 
    ? (habit.todayCompletions / habit.targetCount) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`
        group flex items-center gap-4 p-4
        bg-white dark:bg-gray-800
        rounded-xl
        border ${isJustCompleted 
          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
          : 'border-gray-200 dark:border-gray-700'
        }
        shadow-sm hover:shadow-md
        transition-all duration-200
      `}
    >
      {/* Color Indicator with Completion */}
      <div className="relative flex-shrink-0">
        <div
          className="w-4 h-4 rounded-full shadow-sm"
          style={{ backgroundColor: habit.color }}
        />
        {isJustCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {habit.name}
          </p>

          {/* Progress Badge */}
          <span className="
            px-2 py-0.5 rounded-full
            text-[10px] font-medium
            bg-[var(--color-primary-500)]/10 dark:bg-[var(--color-primary-500)]/20
            text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]
            border border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)]
          ">
            {habit.todayCompletions}/{habit.targetCount} today
          </span>

          {/* Streak Badge */}
          {habit.streak && habit.streak > 0 && (
            <span className="
              flex items-center gap-1
              px-2 py-0.5 rounded-full
              text-[10px] font-medium
              bg-orange-500/10 dark:bg-orange-500/20
              text-orange-700 dark:text-orange-300
              border border-orange-200 dark:border-orange-800
            ">
              <Flame className="h-3 w-3" />
              {habit.streak}
            </span>
          )}
        </div>

        {habit.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {habit.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="h-full bg-gradient-to-r from-[var(--color-accent-500)] to-[var(--color-accent-600)] rounded-full"
          />
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={() => onComplete(habit.id)}
        disabled={isCompleting || habit.isComplete}
        className={`
          flex-shrink-0 p-2 rounded-lg
          transition-all duration-200
          ${habit.isComplete
            ? 'bg-green-500/10 dark:bg-green-500/20 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-[var(--color-accent-500)]/10 dark:hover:bg-[var(--color-accent-500)]/20'
          }
          disabled:opacity-50
        `}
      >
        {habit.isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-accent-500)] transition-colors" />
        )}
      </button>
    </motion.div>
  );
};

export default HabitCardV2;

