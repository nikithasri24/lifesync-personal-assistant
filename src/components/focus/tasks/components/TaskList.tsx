/**
 * Task List Component
 * Displays a list of tasks or empty state
 */

import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import type { TaskView, ProjectView, FocusSessionView } from '../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: TaskView[];
  projects: ProjectView[];
  activeFocusSession?: FocusSessionView;
  searchQuery: string;
  onToggleStatus: (taskId: string) => void;
  onStartFocus: (taskId: string, estimatedTime: number) => void;
  onEditTask: (task: TaskView) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onCreateTask: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projects,
  activeFocusSession,
  searchQuery,
  onToggleStatus,
  onStartFocus,
  onEditTask,
  onToggleSubtask,
  onCreateTask
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No tasks found</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
        </p>
        <button
          onClick={onCreateTask}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const project = projects.find(p => p.id === task.projectId);

        return (
          <TaskCard
            key={task.id}
            task={task}
            project={project}
            activeFocusSession={activeFocusSession}
            onToggleStatus={onToggleStatus}
            onStartFocus={onStartFocus}
            onEdit={onEditTask}
            onToggleSubtask={onToggleSubtask}
          />
        );
      })}
    </div>
  );
};
