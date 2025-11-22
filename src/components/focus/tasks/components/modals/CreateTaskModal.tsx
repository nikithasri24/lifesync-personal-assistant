/**
 * Create Task Modal Component
 * Modal for creating a new task
 */

import React from 'react';
import { format } from 'date-fns';
import type { TaskView, ProjectView } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTask: Partial<TaskView>;
  onTaskChange: (task: Partial<TaskView>) => void;
  onSubmit: () => void;
  projects: ProjectView[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  newTask,
  onTaskChange,
  onSubmit,
  projects
}) => {
  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Task</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={newTask.title || ''}
              onChange={(e) => onTaskChange({ ...newTask, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={newTask.description || ''}
              onChange={(e) => onTaskChange({ ...newTask, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              rows={3}
              placeholder="Describe the task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project
              </label>
              <select
                value={newTask.projectId || ''}
                onChange={(e) => onTaskChange({ ...newTask, projectId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => onTaskChange({ ...newTask, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estimated Time (min)
              </label>
              <input
                type="number"
                value={newTask.estimatedTime || ''}
                onChange={(e) => onTaskChange({ ...newTask, estimatedTime: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Difficulty (1-5)
              </label>
              <select
                value={newTask.difficulty}
                onChange={(e) => onTaskChange({ ...newTask, difficulty: parseInt(e.target.value) as any })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={1}>1 - Very Easy</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Hard</option>
                <option value={5}>5 - Very Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={newTask.category}
                onChange={(e) => onTaskChange({ ...newTask, category: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
                <option value="creative">Creative</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={newTask.dueDate ? format(newTask.dueDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => onTaskChange({ ...newTask, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newTask.title}
              className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
