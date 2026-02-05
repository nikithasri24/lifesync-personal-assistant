/**
 * GoalCard Component
 * Matches the BudgetCard design system
 */

import React from 'react';
import { TrendingUp, Calendar, Target, Edit2, DollarSign } from 'lucide-react';
import type { Goal, GoalProgressPoint, Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
  calculateGoalRecommendation,
  generateExpectedPath,
  calculateProgressPercentage,
} from '../../utils/goalCalculations';
import { GoalRing } from '../GoalRing';
import GoalProgressChart from '../GoalProgressChart';
import { OwnerBadge } from '../../components/common/OwnerBadge';

interface GoalCardProps {
  goal: Goal;
  progressHistory?: GoalProgressPoint[];
  linkedAccount?: Account;
  onEdit: (goal: Goal) => void;
  currentUserId?: string;
  partnerName?: string;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  progressHistory = [],
  linkedAccount,
  onEdit,
  currentUserId,
  partnerName,
}) => {
  const recommendation = calculateGoalRecommendation(goal, progressHistory);
  const progressPercentage = calculateProgressPercentage(goal);
  const expectedPath = generateExpectedPath(goal, 12);

  // Format dates
  const dueDate = new Date(goal.dueDateISO).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Status-based styling (matching BudgetCard pattern)
  const statusConfig = {
    ahead: {
      borderColor: 'border-emerald-500/30',
      icon: '✨',
      iconColor: 'text-emerald-400',
      ringColor: '#10b981',
    },
    'on-track': {
      borderColor: 'border-blue-500/30',
      icon: '✨',
      iconColor: 'text-blue-400',
      ringColor: '#3b82f6',
    },
    behind: {
      borderColor: 'border-amber-500/30',
      icon: '⚠️',
      iconColor: 'text-amber-400',
      ringColor: '#f59e0b',
    },
    'at-risk': {
      borderColor: 'border-rose-500/30',
      icon: '🔴',
      iconColor: 'text-rose-400',
      ringColor: '#ef4444',
    },
  };

  const config = statusConfig[recommendation.status];

  return (
    <div
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${config.borderColor} p-4 transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-primary">{goal.name}</h3>
            {currentUserId && (
              <OwnerBadge
                userId={goal.userId}
                currentUserId={currentUserId}
                partnerName={partnerName}
                size="sm"
              />
            )}
          </div>
          {linkedAccount && (
            <div className="flex items-center gap-1 mt-0.5">
              <DollarSign className="h-3 w-3 text-primary opacity-60" />
              <p className="text-xs text-primary opacity-60">Linked to {linkedAccount.name}</p>
            </div>
          )}
          {goal.trackNetworth && (
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3 w-3 text-primary opacity-60" />
              <p className="text-xs text-primary opacity-60">Tracking net worth</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <button
            onClick={() => onEdit(goal)}
            className="rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
            aria-label={`Edit ${goal.name}`}
          >
            <Edit2 className="h-4 w-4 text-primary opacity-60 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Progress Ring and Amounts */}
      <div className="flex items-start gap-4 mb-3">
        <div className="flex-shrink-0">
          <GoalRing
            value={progressPercentage}
            size={80}
            stroke={10}
            color={config.ringColor}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-primary opacity-70">Current</span>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(goal.currentAmount)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-primary opacity-70">Target</span>
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-primary opacity-70">Remaining</span>
            <span className={`text-sm font-semibold ${config.iconColor}`}>
              {formatCurrency(goal.targetAmount - goal.currentAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-3 p-2.5 rounded-lg bg-primary/20 border border-primary/20">
        <p className="text-xs text-primary font-medium">{recommendation.message}</p>
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between mb-3 text-xs text-primary opacity-70">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Due {dueDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          <span>{recommendation.daysRemaining} days left</span>
        </div>
      </div>

      {/* Progress Chart */}
      {expectedPath.length > 0 && (
        <div className="mb-3 pt-3 border-t border-primary/20">
          <GoalProgressChart
            expectedPath={expectedPath}
            actualPath={progressHistory}
            targetAmount={goal.targetAmount}
            currentAmount={goal.currentAmount}
            height={120}
          />
        </div>
      )}

      {/* Monthly Contribution */}
      {recommendation.requiredMonthlyContribution > 0 && (
        <div className="flex items-baseline justify-between pt-3 border-t border-primary/20">
          <span className="text-xs font-medium text-primary opacity-70">
            Monthly contribution:
          </span>
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(recommendation.requiredMonthlyContribution)}
          </span>
        </div>
      )}
    </div>
  );
};

export default GoalCard;
