/**
 * Task Edit Modal
 *
 * Modal for editing scheduled tasks.
 * This is a stub component - full implementation pending.
 */

import React from 'react';
import type { ScheduledTask } from '../types';

interface TaskEditModalProps {
  task: ScheduledTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ScheduledTask) => void;
}

export function TaskEditModal({ task, isOpen, onClose, onSave }: TaskEditModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
        <p className="text-gray-600 mb-4">Task editing functionality will be implemented soon.</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
