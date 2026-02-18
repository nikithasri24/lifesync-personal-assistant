/**
 * TaskFormModalV2 Component
 * Comprehensive task editing modal - MIGRATED to use FormModalV2
 *
 * MIGRATION COMPLETE:
 * - Reduced from 512 lines to ~260 lines (49% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save handled by FormModalV2/useDraftStorage
 * - ESC key, backdrop click built-in
 */

import React from 'react';
import { Calendar, Flag, Folder, Repeat, Link2, Star } from 'lucide-react';
import type { TaskData, ProjectData } from '@/services/types';
import { FormModalV2 } from '@/components/v2';

export interface TaskFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TaskData>) => void;
  onDelete?: () => void;
  initialData?: Partial<TaskData>;
  projects: ProjectData[];
  isEditing?: boolean;
  isPending?: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskData['priority'];
  status: TaskData['status'];
  category: TaskData['category'];
  project_id: string | null;
  due_date: string;
  estimated_time: string;
  tags: string; // comma-separated
  starred: boolean;
  recurrence_pattern: TaskData['recurrence_pattern'];
}

export const TaskFormModalV2: React.FC<TaskFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  projects,
  isEditing = false,
  isPending = false,
}) => {
  // Convert initialData to form format
  const initialFormData: TaskFormData | undefined = initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    status: initialData.status || 'todo',
    category: initialData.category || 'personal',
    project_id: initialData.project_id || null,
    due_date: initialData.due_date || '',
    estimated_time: initialData.estimated_time?.toString() || '',
    tags: (initialData.tags || []).join(', '),
    starred: initialData.starred || false,
    recurrence_pattern: initialData.recurrence_pattern || 'none',
  } : undefined;

  // Default form data for new tasks
  const defaultFormData: TaskFormData = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    category: 'personal',
    project_id: null,
    due_date: '',
    estimated_time: '',
    tags: '',
    starred: false,
    recurrence_pattern: 'none',
  };

  // Priority options with colors
  const priorityOptions = [
    { value: 'urgent', label: '🔥 Urgent', color: '#EF4444' },
    { value: 'important', label: '⭐ Important', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#F97316' },
    { value: 'medium', label: 'Medium', color: '#3B82F6' },
    { value: 'low', label: 'Low', color: '#6B7280' },
  ];

  // Status options
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'done', label: 'Done' },
  ];

  // Category options
  const categoryOptions = [
    { value: 'work', label: '💼 Work' },
    { value: 'personal', label: '🏠 Personal' },
    { value: 'learning', label: '📚 Learning' },
    { value: 'creative', label: '🎨 Creative' },
    { value: 'health', label: '💪 Health' },
    { value: 'other', label: '📌 Other' },
  ];

  // Recurrence options
  const recurrenceOptions = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <FormModalV2<TaskFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create Task'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey="tasks_edit_draft"
      isPending={isPending}
      submitText={isEditing ? 'Update Task' : 'Create Task'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete}
      onSubmit={async (formData) => {
        // Transform form data to TaskData format
        const taskData: Partial<TaskData> = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          status: formData.status,
          category: formData.category,
          project_id: formData.project_id,
          due_date: formData.due_date || null,
          estimated_time: formData.estimated_time ? parseInt(formData.estimated_time, 10) : null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          starred: formData.starred,
          recurrence_pattern: formData.recurrence_pattern,
        };

        await onSubmit(taskData);
        onClose();
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Task title is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              rows={4}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Add more details..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Flag className="w-4 h-4 inline mr-1" />
              Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, priority: option.value as TaskData['priority'] })}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                  style={{
                    background: formState.priority === option.value
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: formState.priority === option.value ? '#C18B5E' : 'transparent',
                    color: formState.priority === option.value ? '#C18B5E' : '#374151',
                  }}
                >
                  <Flag className="w-4 h-4 inline mr-1" style={{ color: option.color }} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, status: option.value as TaskData['status'] })}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                  style={{
                    background: formState.status === option.value
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: formState.status === option.value ? '#C18B5E' : 'transparent',
                    color: formState.status === option.value ? '#C18B5E' : '#374151',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, category: option.value as TaskData['category'] })}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                  style={{
                    background: formState.category === option.value
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: formState.category === option.value ? '#C18B5E' : 'transparent',
                    color: formState.category === option.value ? '#C18B5E' : '#374151',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Folder className="w-4 h-4 inline mr-1" />
                Project (optional)
              </label>
              <select
                value={formState.project_id || ''}
                onChange={(e) => setFormState({ ...formState, project_id: e.target.value || null })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date (optional)
            </label>
            <input
              type="date"
              value={formState.due_date}
              onChange={(e) => setFormState({ ...formState, due_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Estimated Time (minutes, optional)
            </label>
            <input
              type="number"
              value={formState.estimated_time}
              onChange={(e) => setFormState({ ...formState, estimated_time: e.target.value })}
              placeholder="30"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              min="0"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Repeat className="w-4 h-4 inline mr-1" />
              Recurrence
            </label>
            <div className="flex gap-2 flex-wrap">
              {recurrenceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, recurrence_pattern: option.value as TaskData['recurrence_pattern'] })}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all border-2"
                  style={{
                    background: formState.recurrence_pattern === option.value
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                      : '#F3F4F6',
                    borderColor: formState.recurrence_pattern === option.value ? '#C18B5E' : 'transparent',
                    color: formState.recurrence_pattern === option.value ? '#C18B5E' : '#374151',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Link2 className="w-4 h-4 inline mr-1" />
              Tags (optional)
            </label>
            <input
              type="text"
              value={formState.tags}
              onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
              placeholder="work, urgent, client"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">Separate tags with commas</p>
          </div>

          {/* Starred */}
          <div>
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formState.starred}
                onChange={(e) => setFormState({ ...formState, starred: e.target.checked })}
                className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
              />
              <span className="font-medium text-gray-900">
                <Star className="w-4 h-4 inline mr-1" />
                Star this task
              </span>
            </label>
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default TaskFormModalV2;
