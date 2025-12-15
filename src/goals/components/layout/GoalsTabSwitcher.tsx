import React from 'react';

interface GoalsTabSwitcherProps {
  activeTab: 'goals' | 'dreams';
  onTabChange: (tab: 'goals' | 'dreams') => void;
}

/**
 * Tab switcher between goals and dreams views
 */
export function GoalsTabSwitcher({ activeTab, onTabChange }: GoalsTabSwitcherProps): React.ReactElement {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onTabChange('goals')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'goals'
            ? 'bg-indigo-600 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Goals
      </button>
      <button
        type="button"
        onClick={() => onTabChange('dreams')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'dreams'
            ? 'bg-indigo-600 text-white'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Dreams
      </button>
    </div>
  );
}
