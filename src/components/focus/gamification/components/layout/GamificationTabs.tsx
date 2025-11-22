import React from 'react';
import { BarChart3, Trophy, Target, Sword, Users } from 'lucide-react';
import { TabType } from '../../types';

interface GamificationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { key: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
  { key: 'achievements' as TabType, label: 'Achievements', icon: Trophy },
  { key: 'goals' as TabType, label: 'Goals', icon: Target },
  { key: 'challenges' as TabType, label: 'Challenges', icon: Sword },
  { key: 'leaderboard' as TabType, label: 'Leaderboard', icon: Users }
];

export const GamificationTabs: React.FC<GamificationTabsProps> = ({ activeTab, onTabChange }) => {
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
