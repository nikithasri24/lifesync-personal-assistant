/**
 * TaskCardV2 Component
 * Task card with soft design and completion functionality
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Circle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../../../lib/supabase';

export interface TaskCardV2Props {
  task: Task;
  onComplete: (taskId: string) => void;
  isCompleting?: boolean;
  index?: number;
}

const priorityStyles = {
  urgent: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  high: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  medium: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  low: {
    bg: 'bg-gray-500/10 dark:bg-gray-500/20',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

export const TaskCardV2: React.FC<TaskCardV2Props> = ({
  task,
  onComplete,
  isCompleting = false,
  index = 0,
}) => {
  const priority = task.priority || 'low';
  const styles = priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.low;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="
        group flex items-center gap-3 p-4
        bg-white dark:bg-gray-800
        rounded-xl
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200
      "
    >
      {/* Checkbox */}
      <button
        onClick={() => task.id && onComplete(task.id)}
        disabled={isCompleting || !task.id}
        className="
          flex-shrink-0
          transition-all duration-200
          hover:scale-110
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isCompleting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Circle className="h-5 w-5 text-gray-400" />
          </motion.div>
        ) : (
          <Circle className="h-5 w-5 text-gray-400 group-hover:text-[var(--color-primary-500)] transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {task.title}
        </p>
        {task.due_date && (
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              Due {format(new Date(task.due_date), 'MMM dd')}
            </p>
          </div>
        )}
      </div>

      {/* Priority Badge */}
      <div className={`
        px-2.5 py-1 rounded-full
        text-xs font-medium whitespace-nowrap
        ${styles.bg} ${styles.text}
        border ${styles.border}
        flex-shrink-0
      `}>
        {priority}
      </div>
    </motion.div>
  );
};

export default TaskCardV2;

