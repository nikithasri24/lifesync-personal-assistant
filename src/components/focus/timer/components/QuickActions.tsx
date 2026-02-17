import React from 'react';
import { Clock, Brain, Coffee, Settings } from 'lucide-react';

interface QuickActionsProps {
  onStart25Min: () => void;
  onStart45Min: () => void;
  onStart5MinBreak: () => void;
  onShowSettings: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onStart25Min,
  onStart45Min,
  onStart5MinBreak,
  onShowSettings
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        onClick={onStart25Min}
        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
      >
        <Clock className="w-6 h-6 text-[#C18B5E] mx-auto mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-sm font-medium text-slate-900 dark:text-white">25 min Focus</div>
      </button>

      <button
        onClick={onStart45Min}
        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
      >
        <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-sm font-medium text-slate-900 dark:text-white">45 min Deep</div>
      </button>

      <button
        onClick={onStart5MinBreak}
        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all group"
      >
        <Coffee className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-sm font-medium text-slate-900 dark:text-white">5 min Break</div>
      </button>

      <button
        onClick={onShowSettings}
        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
      >
        <Settings className="w-6 h-6 text-slate-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
        <div className="text-sm font-medium text-slate-900 dark:text-white">Settings</div>
      </button>
    </div>
  );
};
