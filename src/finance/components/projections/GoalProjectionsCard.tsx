import React from 'react';
import { Target } from 'lucide-react';
import type { GoalProjection } from '../../utils/projectionCalculations';
import { formatCurrency } from '../../utils/currency';

interface GoalProjectionsCardProps {
  goalProjections: GoalProjection[];
}

export const GoalProjectionsCard: React.FC<GoalProjectionsCardProps> = ({ goalProjections }) => {
  if (goalProjections.length === 0) return null;

  return (
    <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-primary">Goal Projections</h3>
      </div>
      <div className="space-y-3">
        {goalProjections.map(goal => {
          const progress = ((goal.currentAmount || 0) / goal.targetAmount) * 100;
          const isOnTrack = goal.onTrack;

          return (
            <div key={goal.id} className="p-4 rounded-lg bg-primary/20">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-primary">{goal.name}</p>
                  <p className="text-xs text-primary opacity-60">
                    {formatCurrency(goal.currentAmount || 0)} / {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {goal.yearsToGoal === Infinity ? '∞' : goal.yearsToGoal.toFixed(1)} years
                  </p>
                  <p className="text-xs text-primary opacity-60">at current rate</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-primary opacity-70">
                  {isOnTrack ? '✓ On track' : '⚠ Behind schedule'} •
                  Required: {formatCurrency(goal.monthlyRequired)}/mo
                </p>
                <p className="text-primary opacity-70">
                  {progress.toFixed(0)}% complete
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
