/**
 * TaskEditModal Component
 * Modal for editing task details with full CRUD functionality
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Flag,
  Star,
  Trash2,
  Save,
  Tag,
  FolderOpen,
  AlignLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ScheduledTask } from '../types';
import type { TaskData, ProjectData } from '../../services/types';
import { DependencySelector, DependencyIndicator } from '../../components/dependencies';

interface TaskEditModalProps {
  task: ScheduledTask | null;
  projects: ProjectData[];
  /** All tasks for dependency selection */
  allTasks?: TaskData[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<TaskData>) => void;
  onDelete?: (taskId: string) => void;
  isSaving?: boolean;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  projects,
  allTasks = [],
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<Partial<TaskData>>({});
  const [tagInput, setTagInput] = useState('');

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        estimated_time: task.estimated_time || 0,
        project_id: task.project_id,
        tags: task.tags || [],
        starred: task.starred || false,
        category: task.category,
        depends_on: task.depends_on || [],
      });
    }
  }, [task]);

  if (!isOpen || !task || !task.id) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (task.id) {
      onSave(task.id, formData);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const formatTimeEstimate = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <AlignLeft className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a description..."
            />
          </div>

          {/* Row 1: Status, Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'todo'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskData['status'] })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="scheduled">Scheduled</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskData['priority'] })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
                <option value="important">⭐ Important</option>
              </select>
            </div>
          </div>

          {/* Row 2: Due Date, Estimated Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date ? format(new Date(formData.due_date), 'yyyy-MM-dd') : ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={formData.estimated_time ?? 0}
                onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 0 })}
                min="0"
                step="15"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.estimated_time != null && formData.estimated_time > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {formatTimeEstimate(formData.estimated_time)}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Project, Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <FolderOpen className="w-4 h-4 inline mr-1" />
                Project
              </label>
              <select
                value={formData.project_id || ''}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value || null })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskData['category'] })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Category</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
                <option value="creative">Creative</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Starred */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="starred"
              checked={formData.starred || false}
              onChange={(e) => setFormData({ ...formData, starred: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="starred" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              Star this task
            </label>
          </div>

          {/* Dependencies */}
          {allTasks.length > 0 && (
            <DependencySelector
              currentTaskId={task.id}
              selectedDependencies={formData.depends_on || []}
              allTasks={allTasks}
              onChange={(deps) => setFormData({ ...formData, depends_on: deps })}
            />
          )}

          {/* Dependency Status Indicator */}
          {task && allTasks.length > 0 && (formData.depends_on?.length ?? 0) > 0 && (
            <DependencyIndicator
              task={{ ...task, depends_on: formData.depends_on } as TaskData}
              allTasks={allTasks}
              variant="detailed"
            />
          )}
        </form>

        {/* Actions - Fixed Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
          <div>
            {onDelete && task.id && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id!);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
