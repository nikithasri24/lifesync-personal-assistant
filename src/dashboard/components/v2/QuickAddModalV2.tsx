/**
 * QuickAddModalV2 Component
 * CLAUDE.md compliant modal for quick task creation with scheduling
 */

import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
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

  // Scheduling state
  const [showSchedule, setShowSchedule] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const [dueTime, setDueTime] = useState('');

  // Reset scheduling when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      setDueDate(today.toISOString().split('T')[0]);
      setDueTime('');
      setShowSchedule(false);
    }
  }, [isOpen]);

  // Auto-detect time from text input
  useEffect(() => {
    if (value) {
      const parsed = parseQuickAdd(value, []);
      if (parsed.dueTime) {
        setDueTime(parsed.dueTime);
        setShowSchedule(true); // Auto-show schedule section if time detected
      }
    }
  }, [value]);

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

    // Use parsed time if available, otherwise use manual input
    const timeToUse = parsed.dueTime || dueTime;
    const dateToUse = parsed.dueDate || new Date(dueDate);

    // Build due_date with time if specified
    let finalDueDate: string;
    if (timeToUse) {
      // Combine date and time
      const dateStr = dateToUse instanceof Date
        ? dateToUse.toISOString().split('T')[0]
        : dueDate;
      finalDueDate = `${dateStr}T${timeToUse}:00`;
    } else {
      // Just date, set to start of day
      const dateStr = dateToUse instanceof Date
        ? dateToUse.toISOString().split('T')[0]
        : dueDate;
      finalDueDate = `${dateStr}T00:00:00`;
    }

    createTaskMutation.mutate(
      {
        title: parsed.title,
        description: '',
        priority: parsed.priority || 'medium',
        status: 'todo',
        estimated_time: 25,
        actual_time: 0,
        due_date: finalDueDate,
        project_id: parsed.projectId ?? null,
        tags: parsed.tags,
        category: 'work',
      },
      {
        onSuccess: (newTask) => {
          onChange('');
          onClose();
          if (showToast) {
            const timeMsg = timeToUse ? ` at ${timeToUse}` : '';
            showToast(`Task "${newTask.title}" scheduled${timeMsg}! 📅`, 'success');
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
        <div className="p-6 space-y-4 flex-shrink-0">
          <QuickAddForm
            value={value}
            onChange={onChange}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createTaskMutation.isPending}
            autoFocus
          />

          {/* Schedule Section */}
          <div className="space-y-3">
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: showSchedule ? '#C18B5E' : '#6B7280' }}
            >
              <Calendar className="w-4 h-4" />
              {showSchedule ? 'Scheduled' : 'Add to Calendar'}
            </button>

            {/* Date/Time Inputs */}
            {showSchedule && (
              <div className="space-y-3 pl-6">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all text-sm"
                  />
                </div>

                {/* Time Input (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all text-sm"
                    placeholder="Select time"
                  />
                  {dueTime && (
                    <button
                      type="button"
                      onClick={() => setDueTime('')}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                    >
                      Clear time
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModalV2;
