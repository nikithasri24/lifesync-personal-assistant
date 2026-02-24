/**
 * QuickAddModalV2 Component
 * CLAUDE.md compliant modal for quick task creation with scheduling
 *
 * Features:
 * - Uses FormModalV2 for consistent modal structure
 * - Task title input with natural language parsing support
 * - Optional scheduling (date + time)
 * - Auto-detection of time from text input
 * - ESC key support (via FormModalV2)
 * - Backdrop click support (via FormModalV2)
 * - Mobile-friendly with proper safe areas
 *
 * Fixed: Issue #1 from QA-ISSUES-FOUND.md
 * - Removed invalid customSubmitButton prop
 * - Added task title input field to children
 * - Now renders all form fields correctly
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { FormModalV2 } from '@/components/v2';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { useToast } from '@/hooks/useToast';
import { parseQuickAdd } from '@/todos/services/taskHelpers';

interface QuickAddModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}

interface ScheduleState {
  showSchedule: boolean;
  dueDate: string;
  dueTime: string;
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
  const [scheduleState, setScheduleState] = useState<ScheduleState>(() => ({
    showSchedule: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
  }));

  // Reset scheduling when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScheduleState({
        showSchedule: false,
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '',
      });
    }
  }, [isOpen]);

  // Auto-detect time from text input
  useEffect(() => {
    if (value) {
      const parsed = parseQuickAdd(value, []);
      if (parsed.dueTime) {
        setScheduleState(prev => ({
          ...prev,
          dueTime: parsed.dueTime!,
          showSchedule: true,
        }));
      }
    }
  }, [value]);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    const parsed = parseQuickAdd(value, []);

    // Use parsed time if available, otherwise use manual input
    const timeToUse = parsed.dueTime || scheduleState.dueTime;
    const dateToUse = parsed.dueDate || new Date(scheduleState.dueDate);

    // Build due_date with time if specified
    let finalDueDate: string;
    if (timeToUse) {
      const dateStr = dateToUse instanceof Date
        ? dateToUse.toISOString().split('T')[0]
        : scheduleState.dueDate;
      finalDueDate = `${dateStr}T${timeToUse}:00`;
    } else {
      const dateStr = dateToUse instanceof Date
        ? dateToUse.toISOString().split('T')[0]
        : scheduleState.dueDate;
      finalDueDate = `${dateStr}T00:00:00`;
    }

    return new Promise<void>((resolve, reject) => {
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
            const timeMsg = timeToUse ? ` at ${timeToUse}` : '';
            showToast(`Task "${newTask.title}" scheduled${timeMsg}! 📅`, 'success');
            resolve();
          },
          onError: (error) => {
            showToast(`Failed to create task: ${error.message}`, 'error');
            reject(error);
          },
        }
      );
    });
  };

  return (
    <FormModalV2<Record<string, never>>
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Task"
      defaultData={{}}
      isPending={createTaskMutation.isPending}
      submitText="Create Task"
      isEditing={false}
      onSubmit={handleSubmit}
      validate={() => {
        if (!value.trim()) return 'Please enter a task title';
        return null;
      }}
    >
      {() => (
        <>
          {/* Task Title Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Try "Buy groceries #shopping !high" or "Meeting at 2pm"
            </p>
          </div>

          {/* Schedule Section */}
          <div className="space-y-3">
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setScheduleState(prev => ({ ...prev, showSchedule: !prev.showSchedule }))}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: scheduleState.showSchedule ? '#C18B5E' : '#6B7280' }}
            >
              <Calendar className="w-4 h-4" />
              {scheduleState.showSchedule ? 'Scheduled' : 'Add to Calendar'}
            </button>

            {/* Date/Time Inputs */}
            {scheduleState.showSchedule && (
              <div className="space-y-3 pl-6">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleState.dueDate}
                    onChange={(e) => setScheduleState(prev => ({ ...prev, dueDate: e.target.value }))}
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
                    value={scheduleState.dueTime}
                    onChange={(e) => setScheduleState(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all text-sm"
                    placeholder="Select time"
                  />
                  {scheduleState.dueTime && (
                    <button
                      type="button"
                      onClick={() => setScheduleState(prev => ({ ...prev, dueTime: '' }))}
                      className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                    >
                      Clear time
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default QuickAddModalV2;
