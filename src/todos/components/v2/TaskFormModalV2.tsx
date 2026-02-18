/**
 * TaskFormModalV2 Component
 * Comprehensive task editing modal following Together pattern with auto-save
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Folder, Repeat, Link2, Star } from 'lucide-react';
import type { TaskData, ProjectData } from '@/services/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/services/logger';

const STORAGE_KEY = 'tasks_edit_draft';

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
  const colors = useThemeColors();

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  // Only use draft if not editing existing task
  const savedDraft = !initialData && !isEditing ? loadDraft() : null;

  // Form state
  const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
  const [description, setDescription] = useState(initialData?.description || savedDraft?.description || '');
  const [priority, setPriority] = useState<TaskData['priority']>(initialData?.priority || savedDraft?.priority || 'medium');
  const [status, setStatus] = useState<TaskData['status']>(initialData?.status || savedDraft?.status || 'todo');
  const [category, setCategory] = useState<TaskData['category']>(initialData?.category || savedDraft?.category || 'personal');
  const [projectId, setProjectId] = useState<string | null>(initialData?.project_id || savedDraft?.project_id || null);
  const [dueDate, setDueDate] = useState(initialData?.due_date || savedDraft?.due_date || '');
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimated_time?.toString() || savedDraft?.estimated_time || '');
  const [tags, setTags] = useState((initialData?.tags || savedDraft?.tags || []).join(', '));
  const [starred, setStarred] = useState(initialData?.starred || savedDraft?.starred || false);
  const [recurrencePattern, setRecurrencePattern] = useState<TaskData['recurrence_pattern']>(
    initialData?.recurrence_pattern || savedDraft?.recurrence_pattern || 'none'
  );

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && isEditing) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'todo');
      setCategory(initialData.category || 'personal');
      setProjectId(initialData.project_id || null);
      setDueDate(initialData.due_date || '');
      setEstimatedTime(initialData.estimated_time?.toString() || '');
      setTags((initialData.tags || []).join(', '));
      setStarred(initialData.starred || false);
      setRecurrencePattern(initialData.recurrence_pattern || 'none');
    }
  }, [initialData, isEditing]);

  // Auto-save to localStorage (only when creating new task)
  useEffect(() => {
    if (!isEditing && (title || description)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title,
        description,
        priority,
        status,
        category,
        project_id: projectId,
        due_date: dueDate,
        estimated_time: estimatedTime,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        starred,
        recurrence_pattern: recurrencePattern,
      }));
    }
  }, [title, description, priority, status, category, projectId, dueDate, estimatedTime, tags, starred, recurrencePattern, isEditing]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      category,
      project_id: projectId,
      due_date: dueDate || null,
      estimated_time: estimatedTime ? parseInt(estimatedTime, 10) : null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      starred,
      recurrence_pattern: recurrencePattern,
    });

    // Clear draft after successful submit
    localStorage.removeItem(STORAGE_KEY);

    // Reset form if creating new task
    if (!isEditing) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setCategory('personal');
      setProjectId(null);
      setDueDate('');
      setEstimatedTime('');
      setTags('');
      setStarred(false);
      setRecurrencePattern('none');
    }
  };

  if (!isOpen) return null;

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
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                    onClick={() => setPriority(option.value as TaskData['priority'])}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                    style={{
                      background: priority === option.value
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                        : '#F3F4F6',
                      borderColor: priority === option.value ? '#C18B5E' : 'transparent',
                      color: priority === option.value ? '#C18B5E' : '#374151',
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
                    onClick={() => setStatus(option.value as TaskData['status'])}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                    style={{
                      background: status === option.value
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                        : '#F3F4F6',
                      borderColor: status === option.value ? '#C18B5E' : 'transparent',
                      color: status === option.value ? '#C18B5E' : '#374151',
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
                    onClick={() => setCategory(option.value as TaskData['category'])}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2"
                    style={{
                      background: category === option.value
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                        : '#F3F4F6',
                      borderColor: category === option.value ? '#C18B5E' : 'transparent',
                      color: category === option.value ? '#C18B5E' : '#374151',
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
                  value={projectId || ''}
                  onChange={(e) => setProjectId(e.target.value || null)}
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
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
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
                    onClick={() => setRecurrencePattern(option.value as TaskData['recurrence_pattern'])}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all border-2"
                    style={{
                      background: recurrencePattern === option.value
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                        : '#F3F4F6',
                      borderColor: recurrencePattern === option.value ? '#C18B5E' : 'transparent',
                      color: recurrencePattern === option.value ? '#C18B5E' : '#374151',
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
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
                  checked={starred}
                  onChange={(e) => setStarred(e.target.checked)}
                  className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">
                  <Star className="w-4 h-4 inline mr-1" />
                  Star this task
                </span>
              </label>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
            {/* Delete button */}
            {isEditing && onDelete && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                      onDelete();
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
                  aria-label="Delete task"
                >
                  <span>🗑️</span>
                  Delete Task
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                {isPending ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModalV2;
