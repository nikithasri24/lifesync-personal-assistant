/**
 * Active Focus Banner Component
 * Displays currently active focus session
 */

import React from 'react';
import type { FocusSessionView, TaskView } from '../types';

interface ActiveFocusBannerProps {
  activeFocusSession: FocusSessionView;
  tasks: TaskView[];
}

export const ActiveFocusBanner: React.FC<ActiveFocusBannerProps> = ({
  activeFocusSession,
  tasks
}) => {
  const currentTask = activeFocusSession.taskId
    ? tasks.find(t => t.id === activeFocusSession.taskId)
    : null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Active Focus Session</h3>
          <p className="text-indigo-100">
            {currentTask
              ? `Working on: ${currentTask.title}`
              : 'General focus session'
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {Math.floor(activeFocusSession.duration / 60)}:
            {(activeFocusSession.duration % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-indigo-200">Time elapsed</div>
        </div>
      </div>
    </div>
  );
};
