/**
 * Task Focus Tabs Component
 * Navigation tabs for Tasks, Projects, Analytics
 */

import React from 'react';
import { CheckSquare, Folder, BarChart3 } from 'lucide-react';
import type { TabType } from '../types';

interface TaskFocusTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { key: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
  { key: 'projects' as const, label: 'Projects', icon: Folder },
  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 }
];

export const TaskFocusTabs: React.FC<TaskFocusTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === tab.key
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <tab.icon size={16} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
