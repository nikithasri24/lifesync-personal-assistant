import React from 'react';
import { Plus } from 'lucide-react';
import { Goal } from '../../types';
import { GoalCard } from '../cards';

interface GoalsTabProps {
  goals: Goal[];
  onOpenCreateGoal: () => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({ goals, onOpenCreateGoal }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Goals</h3>
        <button
          onClick={onOpenCreateGoal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>Create Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
};
