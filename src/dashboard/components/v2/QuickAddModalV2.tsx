/**
 * QuickAddModalV2 Component
 * CLAUDE.md compliant modal for quick task creation
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { useToast } from '@/hooks/useToast';
import { parseQuickAdd } from '@/todos/services/taskHelpers';
import { QuickAddForm } from '@/todos/components';

interface QuickAddModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}

export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
  isOpen,
  onClose,
  value,
  onChange,
}) => {
  const { showToast } = useToast();
  const createTaskMutation = useCreateTask();

  // ESC key closes modal
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

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!value.trim()) return;

    const parsed = parseQuickAdd(value, []);

    createTaskMutation.mutate(
      {
        title: parsed.title,
        description: '',
        priority: parsed.priority || 'medium',
        status: 'todo',
        estimated_time: 25,
        actual_time: 0,
        due_date: parsed.dueDate ? parsed.dueDate.toISOString() : new Date().toISOString(),
        project_id: parsed.projectId ?? null,
        tags: parsed.tags,
        category: 'work',
      },
      {
        onSuccess: (newTask) => {
          onChange('');
          onClose();
          if (showToast) {
            showToast(`Task "${newTask.title}" created! ✓`, 'success');
          }
        },
        onError: (error) => {
          if (showToast) {
            showToast(`Failed to create task: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Add New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-shrink-0">
          <QuickAddForm
            value={value}
            onChange={onChange}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createTaskMutation.isPending}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default QuickAddModalV2;
