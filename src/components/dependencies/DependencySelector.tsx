/**
 * DependencySelector Component
 * Allows selecting which tasks a task depends on (must complete before this task)
 */

import React, { useState, useMemo } from 'react';
import { Link2, X, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TaskData } from '@/services/types';

interface DependencySelectorProps {
  /** Current task ID (to exclude from selection) */
  currentTaskId?: string;
  /** Currently selected dependency IDs */
  selectedDependencies: string[];
  /** All available tasks */
  allTasks: TaskData[];
  /** Callback when dependencies change */
  onChange: (dependencyIds: string[]) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

export const DependencySelector: React.FC<DependencySelectorProps> = ({
  currentTaskId,
  selectedDependencies,
  allTasks,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get tasks that can be dependencies (exclude current task and completed tasks are shown with indicator)
  const availableTasks = useMemo(() => {
    return allTasks
      .filter(task =>
        task.id &&
        task.id !== currentTaskId &&
        !task.deleted &&
        !selectedDependencies.includes(task.id)
      )
      .filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allTasks, currentTaskId, selectedDependencies, searchQuery]);

  // Get the selected dependency task objects
  const selectedTasks = useMemo(() => {
    return selectedDependencies
      .map(id => allTasks.find(t => t.id === id))
      .filter((t): t is TaskData => t !== undefined);
  }, [selectedDependencies, allTasks]);

  const handleAddDependency = (taskId: string) => {
    onChange([...selectedDependencies, taskId]);
    setSearchQuery('');
  };

  const handleRemoveDependency = (taskId: string) => {
    onChange(selectedDependencies.filter(id => id !== taskId));
  };

  const getStatusIcon = (task: TaskData) => {
    if (task.status === 'done') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-amber-500" />;
  };

  const getStatusText = (task: TaskData) => {
    if (task.status === 'done') return 'Completed';
    if (task.status === 'in_progress') return 'In Progress';
    return 'Not Started';
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Link2 className="w-4 h-4" />
        Depends On (Blocked By)
      </label>

      {/* Selected Dependencies */}
      {selectedTasks.length > 0 && (
        <div className="space-y-2">
          {selectedTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(task)}
                <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                  {task.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({getStatusText(task)})
                </span>
              </div>
              {!disabled && task.id && (
                <button
                  type="button"
                  onClick={() => handleRemoveDependency(task.id!)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Dependency Button / Search */}
      {!disabled && (
        <div className="relative">
          {!isOpen ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 
                         border border-dashed border-slate-300 dark:border-slate-600 rounded-lg
                         hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-full"
            >
              <Link2 className="w-4 h-4" />
              Add blocking task...
            </button>
          ) : (
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-600">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setSearchQuery(''); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {/* Task List */}
              <div className="max-h-48 overflow-y-auto">
                {availableTasks.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    {searchQuery ? 'No matching tasks found' : 'No available tasks'}
                  </div>
                ) : (
                  availableTasks.slice(0, 10).map(task => task.id && (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleAddDependency(task.id!)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700
                                 text-left transition-colors"
                    >
                      {getStatusIcon(task)}
                      <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                        {task.title}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </button>
                  ))
                )}
                {availableTasks.length > 10 && (
                  <div className="p-2 text-xs text-slate-500 text-center border-t border-slate-200 dark:border-slate-600">
                    {availableTasks.length - 10} more tasks - refine your search
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocked Warning */}
      {selectedTasks.some(t => t.status !== 'done') && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300">
            This task is blocked until all dependencies are completed
          </span>
        </div>
      )}
    </div>
  );
};

export default DependencySelector;

