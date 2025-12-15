import React from 'react';
import { Trophy } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'goals' | 'dreams' | 'progress';
  onTabChange: (tab: 'goals' | 'dreams' | 'progress') => void;
}

/**
 * Tab navigation for Goals, Dreams, and Progress views
 */
export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps): React.ReactElement {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onTabChange('goals')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'goals' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Goals
      </button>
      <button
        type="button"
        onClick={() => onTabChange('dreams')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'dreams' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        Dreams
      </button>
      <button
        type="button"
        onClick={() => onTabChange('progress')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
          activeTab === 'progress' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Trophy className="h-4 w-4" />
        Progress & XP
      </button>
    </div>
  );
}
