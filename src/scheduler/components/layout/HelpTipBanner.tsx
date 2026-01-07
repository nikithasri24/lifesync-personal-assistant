import React from 'react';

/**
 * Help tip banner at the bottom of the Task Scheduler
 */
export function HelpTipBanner(): React.ReactElement {
  return (
    <div className="flex-shrink-0 px-6 py-2 bg-blue-50 dark:bg-gray-800 border-t border-blue-200 dark:border-gray-700">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong className="font-semibold text-blue-600 dark:text-blue-400">Tip:</strong> {' '}
        Drag tasks between columns to change status. Click any task to edit. Focus on urgent & important items first.
      </p>
    </div>
  );
}
