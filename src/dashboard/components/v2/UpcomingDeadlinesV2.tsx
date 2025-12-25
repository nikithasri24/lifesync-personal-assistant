/**
 * UpcomingDeadlinesV2 Component
 * Upcoming deadlines section with V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Circle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../../../lib/supabase';

export interface UpcomingDeadlinesV2Props {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  completingTask: string | null;
}

const priorityStyles = {
  urgent: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-400',
    badgeBg: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
    badgeBg: 'bg-yellow-500',
  },
  low: {
    bg: 'bg-gray-500/10 dark:bg-gray-500/20',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-400',
    badgeBg: 'bg-gray-500',
  },
};

export const UpcomingDeadlinesV2: React.FC<UpcomingDeadlinesV2Props> = ({
  tasks,
  onComplete,
  completingTask,
}) => {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-2xl p-6
      border border-gray-200 dark:border-gray-700
      shadow-sm
    ">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Upcoming Deadlines
        </h3>
      </div>

      <div className="space-y-3">
        {tasks.slice(0, 3).map((task, index) => {
          const priority = task.priority || 'low';
          const styles = priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.low;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -2 }}
              className={`
                group flex items-center justify-between p-4
                ${styles.bg}
                rounded-xl
                border ${styles.border}
                shadow-sm hover:shadow-md
                transition-all duration-200
              `}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Checkbox */}
                <button
                  onClick={() => task.id && onComplete(task.id)}
                  disabled={completingTask === task.id || !task.id}
                  className="
                    flex-shrink-0
                    transition-all duration-200
                    hover:scale-110
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {completingTask === task.id ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Circle className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  ) : (
                    <Circle className={`h-5 w-5 ${styles.text} group-hover:scale-110 transition-transform`} />
                  )}
                </button>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${styles.text} mb-1 truncate`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Due {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Badge */}
              <span className={`
                px-3 py-1 rounded-full
                text-xs font-medium text-white
                ${styles.badgeBg}
                flex-shrink-0
              `}>
                {priority}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingDeadlinesV2;

