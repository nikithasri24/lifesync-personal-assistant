import React from 'react';
import { CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '../../lib/supabase';

interface UpcomingDeadlinesProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  completingTask: string | null;
}

/**
 * Upcoming deadlines section with task completion
 */
export function UpcomingDeadlines({
  tasks,
  onComplete,
  completingTask,
}: UpcomingDeadlinesProps): React.ReactElement | null {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="card animate-fade-in">
      <h3 className="text-xl font-semibold text-primary font-display mb-6">Upcoming Deadlines</h3>
      <div className="space-y-4">
        {tasks.slice(0, 3).map((task: Task, index: number) => (
          <div
            key={task.id}
            className="group flex items-center justify-between p-4 bg-warning-light border border-warning rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={(): void => { if (task.id) onComplete(task.id); }}
                disabled={completingTask === task.id}
                className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                  completingTask === task.id
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-warning hover:bg-warning hover:text-white'
                }`}
                title="Mark as complete"
              >
                {completingTask === task.id ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckSquare size={16} />
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-primary group-hover:text-warning transition-colors duration-200">
                  {task.title}
                </p>
                <p className="text-xs text-secondary mt-1">
                  Due: {task.due_date && format(new Date(task.due_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <span className={`px-3 py-2 rounded-full text-xs font-medium ${
              task.priority === 'urgent' ? 'bg-error text-white' :
              task.priority === 'high' ? 'bg-warning text-white' :
              'bg-warning text-white'
            }`}>
              {task.priority ?? 'low'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
