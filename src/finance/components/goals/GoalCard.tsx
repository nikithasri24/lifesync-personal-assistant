/**
 * GoalCard Component
 * Modern card design showing goal progress with charts and smart recommendations
 */

import React from 'react';
import { TrendingUp, Calendar, Target, Edit2, DollarSign, Sparkles } from 'lucide-react';
import type { Goal, GoalProgressPoint, Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
  calculateGoalRecommendation,
  generateExpectedPath,
  calculateProgressPercentage,
  getStatusColor,
} from '../../utils/goalCalculations';
import { GoalRing } from '../GoalRing';
import GoalProgressChart from '../GoalProgressChart';

interface GoalCardProps {
  goal: Goal;
  progressHistory?: GoalProgressPoint[];
  linkedAccount?: Account;
  onEdit: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  progressHistory = [],
  linkedAccount,
  onEdit,
}) => {
  const recommendation = calculateGoalRecommendation(goal, progressHistory);
  const progressPercentage = calculateProgressPercentage(goal);
  const statusColors = getStatusColor(recommendation.status);
  const expectedPath = generateExpectedPath(goal, 12);

  // Format dates
  const dueDate = new Date(goal.dueDateISO).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-2xl ${statusColors.bg} shadow-sm ring-1 ${statusColors.ring} transition-all hover:shadow-md overflow-hidden`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-semibold ${statusColors.text} truncate`}>
              {goal.name}
            </h3>
            {linkedAccount && (
              <div className="flex items-center gap-1.5 mt-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs text-slate-600">
                  Linked to {linkedAccount.name}
                </span>
              </div>
            )}
            {goal.trackNetworth && (
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs text-slate-600">Tracking net worth</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onEdit(goal)}
            className="rounded-lg p-2 hover:bg-white/50 transition-colors"
            title="Edit goal"
          >
            <Edit2 className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-6">
          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <GoalRing
              value={progressPercentage}
              size={100}
              stroke={12}
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-600 font-medium mb-0.5">Current</div>
                <div className={`text-lg font-bold ${statusColors.text}`}>
                  {formatCurrency(goal.currentAmount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 font-medium mb-0.5">Target</div>
                <div className="text-lg font-bold text-slate-900">
                  {formatCurrency(goal.targetAmount)}
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className={`flex items-start gap-2 p-3 rounded-lg bg-white/60 border border-white`}>
              <Sparkles className={`h-4 w-4 mt-0.5 flex-shrink-0 ${statusColors.text}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{recommendation.message}</p>
              </div>
            </div>

            {/* Time & Target Info */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due {dueDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                <span>{recommendation.daysRemaining} days left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        {expectedPath.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/50">
            <GoalProgressChart
              expectedPath={expectedPath}
              actualPath={progressHistory}
              targetAmount={goal.targetAmount}
              currentAmount={goal.currentAmount}
              height={100}
            />
          </div>
        )}

        {/* Monthly Contribution */}
        {recommendation.requiredMonthlyContribution > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-white/60">
            <span className="text-sm font-medium text-slate-700">
              Monthly contribution needed:
            </span>
            <span className={`text-base font-bold ${statusColors.text}`}>
              {formatCurrency(recommendation.requiredMonthlyContribution)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
