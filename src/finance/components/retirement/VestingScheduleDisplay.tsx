/**
 * VestingScheduleDisplay Component
 * Timeline visualization of vesting schedule for retirement accounts
 */

import React from 'react';
import { Lock, Unlock, Clock, CheckCircle } from 'lucide-react';
import type { RetirementAccountWithStats } from '../../types';
import { calculateVestedAmount } from '../../utils/retirementCalculations';

interface VestingScheduleDisplayProps {
  retirement: RetirementAccountWithStats;
  employmentYears?: number;
}

const VestingScheduleDisplay: React.FC<VestingScheduleDisplayProps> = ({
  retirement,
  employmentYears = 0,
}) => {
  if (!retirement.hasVestingSchedule) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fully Vested
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All employer contributions are immediately vested
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate vesting milestones based on schedule type
  const getMilestones = () => {
    const milestones: Array<{ year: number; percentage: number; label: string }> = [];

    if (retirement.vestingScheduleType === 'immediate') {
      return [{ year: 0, percentage: 100, label: 'Immediate' }];
    }

    if (retirement.vestingScheduleType === 'cliff') {
      const cliffYears = retirement.vestingCliffYears || 3;
      for (let i = 0; i <= cliffYears; i++) {
        milestones.push({
          year: i,
          percentage: i >= cliffYears ? 100 : 0,
          label: i >= cliffYears ? 'Fully Vested' : 'Not Vested',
        });
      }
    }

    if (retirement.vestingScheduleType === 'graded') {
      const gradedYears = retirement.vestingGradedYears || 5;
      for (let i = 0; i <= gradedYears; i++) {
        const percentage = Math.min(100, (i / gradedYears) * 100);
        milestones.push({
          year: i,
          percentage,
          label: percentage === 100 ? 'Fully Vested' : `${percentage.toFixed(0)}% Vested`,
        });
      }
    }

    return milestones;
  };

  const milestones = getMilestones();
  const currentVestingPercentage = retirement.vestingPercentage;
  const vestedAmount = retirement.accountBalance - retirement.unvestedBalance;
  const unvestedAmount = retirement.unvestedBalance;

  // Calculate years until fully vested
  const yearsToFullyVested = (() => {
    if (currentVestingPercentage >= 100) return 0;

    if (retirement.vestingScheduleType === 'cliff') {
      const cliffYears = retirement.vestingCliffYears || 3;
      return Math.max(0, cliffYears - employmentYears);
    }

    if (retirement.vestingScheduleType === 'graded') {
      const gradedYears = retirement.vestingGradedYears || 5;
      return Math.max(0, gradedYears - employmentYears);
    }

    return 0;
  })();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        Vesting Schedule
      </h3>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Vesting Status</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentVestingPercentage.toFixed(0)}%
            </p>
          </div>
          {currentVestingPercentage >= 100 ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm font-semibold">Fully Vested</span>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Years to 100%</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {yearsToFullyVested.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              currentVestingPercentage >= 100
                ? 'bg-green-600'
                : currentVestingPercentage >= 50
                ? 'bg-orange-500'
                : 'bg-orange-400'
            }`}
            style={{ width: `${currentVestingPercentage}%` }}
          />
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Vested</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(vestedAmount)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Yours to keep if you leave
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Unvested</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(unvestedAmount)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Subject to vesting schedule
          </p>
        </div>
      </div>

      {/* Vesting Timeline */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Vesting Timeline
        </h4>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const isPast = employmentYears >= milestone.year;
              const isCurrent = employmentYears >= milestone.year && employmentYears < (milestones[index + 1]?.year || Infinity);

              return (
                <div key={milestone.year} className="relative flex items-center gap-4">
                  {/* Milestone Dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isPast
                        ? 'bg-green-600 border-green-600'
                        : isCurrent
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-white" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className={`flex-1 p-3 rounded-lg ${
                    isPast
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : isCurrent
                      ? 'bg-orange-50 dark:bg-orange-900/20'
                      : 'bg-gray-50 dark:bg-gray-900/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${
                          isPast
                            ? 'text-green-900 dark:text-green-300'
                            : isCurrent
                            ? 'text-orange-900 dark:text-orange-300'
                            : 'text-gray-900 dark:text-gray-300'
                        }`}>
                          Year {milestone.year}
                          {isCurrent && ' (Current)'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {milestone.label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          isPast
                            ? 'text-green-600 dark:text-green-400'
                            : isCurrent
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {milestone.percentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          About Your Vesting Schedule
        </h5>
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          {retirement.vestingScheduleType === 'cliff' && (
            <>
              <p>
                <strong>Cliff Vesting:</strong> You'll become 100% vested after {retirement.vestingCliffYears} years of service.
              </p>
              <p>
                Before the cliff date, if you leave, you forfeit all employer contributions.
              </p>
            </>
          )}
          {retirement.vestingScheduleType === 'graded' && (
            <>
              <p>
                <strong>Graded Vesting:</strong> You become vested gradually over {retirement.vestingGradedYears} years.
              </p>
              <p>
                Each year, you vest an additional {(100 / (retirement.vestingGradedYears || 5)).toFixed(0)}% of employer contributions.
              </p>
            </>
          )}
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            💡 Your own contributions (employee deferrals) are always 100% vested immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VestingScheduleDisplay;
