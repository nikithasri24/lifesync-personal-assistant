import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingButton } from '../../components/LoadingButton';
import type { Task } from '../../lib/supabase';

interface TodayTasksSectionProps {
  tasks: Task[];
  onViewAll: () => void;
  onComplete: (taskId: string) => void;
  completingTask: string | null;
}

/**
 * Today's tasks section with completion functionality
 */
export function TodayTasksSection({
  tasks,
  onViewAll,
  onComplete,
  completingTask,
}: TodayTasksSectionProps): React.ReactElement {
  return (
    <div className="card animate-slide-in-left">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-primary font-display">Today's Tasks</h3>
        <button
          onClick={onViewAll}
          className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
        >
          View all →
        </button>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
              <CheckSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">No tasks for today</h4>
            <p className="text-sm text-secondary mb-4 max-w-xs mx-auto">
              You're all caught up! Create a task or enjoy your free time.
            </p>
            <LoadingButton
              onClick={onViewAll}
              variant="primary"
              size="md"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add Your First Task
            </LoadingButton>
          </div>
        ) : (
          tasks.slice(0, 5).map((task: Task, index: number) => (
            <div
              key={task.id}
              className="group flex items-center space-x-4 p-4 bg-tertiary rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={(): void => { if (task.id) onComplete(task.id); }}
                disabled={completingTask === task.id}
                className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all duration-200 ${
                  completingTask === task.id
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-muted hover:border-accent hover:bg-accent hover:text-white'
                }`}
                title="Mark as complete"
              >
                {completingTask === task.id ? (
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckSquare size={14} />
                )}
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">{task.title}</p>
                {task.due_date && (
                  <p className="text-xs text-secondary mt-1">
                    Due: {format(new Date(task.due_date), 'MMM dd')}
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                task.priority === 'urgent' ? 'bg-error-light text-error' :
                task.priority === 'high' ? 'bg-warning-light text-warning' :
                task.priority === 'medium' ? 'bg-warning-light text-warning' :
                'bg-tertiary text-secondary'
              }`}>
                {task.priority ?? 'low'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
