import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Plus, CheckCircle2 } from 'lucide-react';
import type { Task } from '../../lib/supabase';

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  unscheduledTasks: Task[];
  onScheduleTask: (taskId: string, date: Date) => void;
  onCreateNew: (date: Date) => void;
  onCreateBlock?: (date: Date) => void;
}

export const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  unscheduledTasks,
  onScheduleTask,
  onCreateNew,
  onCreateBlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !selectedDate) return null;

  const filteredTasks = unscheduledTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScheduleTask = (taskId: string) => {
    onScheduleTask(taskId, selectedDate);
    onClose();
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    onCreateNew(selectedDate);
    onClose();
    setSearchQuery('');
  };

  const handleCreateBlock = () => {
    if (!onCreateBlock) return;
    onCreateBlock(selectedDate);
    onClose();
    setSearchQuery('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C18B5E] dark:text-[#E5B88A]" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Schedule for {format(selectedDate, 'EEEE, MMM d')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a task or create new
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E5B88A]"
              autoFocus
            />
          </div>

          {/* Create New Button */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#C18B5E] dark:text-[#E5B88A] bg-[#F5EBE0] dark:bg-[#8B6F47]/20 hover:bg-[#F5EBE0] dark:hover:bg-[#8B6F47]/30 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new task on this date
            </button>
            {onCreateBlock && (
              <button
                onClick={handleCreateBlock}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#C18B5E] dark:text-[#E5B88A] bg-[#F5EBE0] dark:bg-[#8B6F47]/20 hover:bg-[#F5EBE0] dark:hover:bg-[#8B6F47]/30 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create schedule block
              </button>
            )}
          </div>

          {/* Task List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No tasks found matching your search' : 'No unscheduled tasks'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleScheduleTask(task.id as string)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.priority && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : task.priority === 'high'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          )}
                          {task.estimated_time != null && task.estimated_time > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {task.estimated_time >= 60
                                ? `${Math.round(task.estimated_time / 60)}h`
                                : `${task.estimated_time}m`}
                            </span>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
