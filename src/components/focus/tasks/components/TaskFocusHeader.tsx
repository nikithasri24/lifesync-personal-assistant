/**
 * Task Focus Header Component
 * Displays the header with title and action buttons
 */

import React from 'react';
import { Plus, Folder } from 'lucide-react';

interface TaskFocusHeaderProps {
  onCreateTask: () => void;
  onCreateProject: () => void;
}

export const TaskFocusHeader: React.FC<TaskFocusHeaderProps> = ({
  onCreateTask,
  onCreateProject
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Organize your work and track focus time
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onCreateTask}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
        <button
          onClick={onCreateProject}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Folder size={16} />
          <span>New Project</span>
        </button>
      </div>
    </div>
  );
};
