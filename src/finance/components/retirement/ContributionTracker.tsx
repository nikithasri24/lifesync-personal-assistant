/**
 * ContributionTracker Component
 * Visual display of contribution limits and progress for retirement accounts
 */

import React from 'react';
import { TrendingUp, DollarSign, Award } from 'lucide-react';
import type { RetirementAccountWithStats } from '../../types';

interface ContributionTrackerProps {
  retirement: RetirementAccountWithStats;
  annualSalary?: number;
  age?: number;
}

const ContributionTracker: React.FC<ContributionTrackerProps> = ({
  retirement,
  annualSalary = 0,
  age = 30,
}) => {
  const isOver50 = age >= 50;
  const catchUpEligible = isOver50 && retirement.catchUpLimit ? retirement.catchUpLimit : 0;
  const totalEmployeeLimit = retirement.annualContributionLimit + catchUpEligible;

  const employeeContributions = retirement.currentYearContributions;
  const employerContributions = retirement.employerContributionsYTD;
  const totalContributions = employeeContributions + employerContributions;

  const employeeProgress = totalEmployeeLimit > 0 ? (employeeContributions / totalEmployeeLimit) * 100 : 0;
  const employeeRemaining = Math.max(0, totalEmployeeLimit - employeeContributions);

  // Calculate employer match room
  let employerMatchLimit = 0;
  let employerProgress = 0;
  let employerRemaining = 0;

  if (retirement.hasEmployerMatch && annualSalary > 0 && retirement.employerMatchLimit) {
    employerMatchLimit = (annualSalary * retirement.employerMatchLimit) / 100;
    employerProgress = employerMatchLimit > 0 ? (employerContributions / employerMatchLimit) * 100 : 0;
    employerRemaining = Math.max(0, employerMatchLimit - employerContributions);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return formatCurrency(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        {retirement.contributionYear} Contribution Tracker
      </h3>

      {/* Total Contributions Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Contributions YTD</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalContributions)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Combined Limit</p>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {formatCurrency(totalEmployeeLimit + employerMatchLimit)}
            </p>
          </div>
        </div>
      </div>

      {/* Employee Contributions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Employee Contributions
            </h4>
          </div>
          {isOver50 && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs rounded-full">
              Catch-up Eligible
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                employeeProgress >= 100
                  ? 'bg-green-600'
                  : employeeProgress >= 75
                  ? 'bg-blue-600'
                  : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(employeeProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contributed</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCompact(employeeContributions)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCompact(employeeRemaining)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Limit</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCompact(totalEmployeeLimit)}
            </p>
          </div>
        </div>

        {/* Breakdown if catch-up is eligible */}
        {isOver50 && retirement.catchUpLimit && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Base: {formatCurrency(retirement.annualContributionLimit)}</span>
            <span>Catch-up: {formatCurrency(retirement.catchUpLimit)}</span>
          </div>
        )}

        {/* Progress Percentage */}
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${
            employeeProgress >= 100
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {employeeProgress.toFixed(1)}% of limit reached
          </span>
          {employeeProgress >= 100 && (
            <span className="ml-2 text-green-600 dark:text-green-400">✓ Maxed out!</span>
          )}
        </div>
      </div>

      {/* Employer Match Contributions */}
      {retirement.hasEmployerMatch && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Employer Match
              </h4>
            </div>
            {retirement.employerMatchPercentage && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {retirement.employerMatchPercentage}% match up to {retirement.employerMatchLimit}% of salary
              </span>
            )}
          </div>

          {annualSalary > 0 ? (
            <>
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      employerProgress >= 100
                        ? 'bg-amber-600'
                        : employerProgress >= 75
                        ? 'bg-amber-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(employerProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Matched</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCompact(employerContributions)}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCompact(employerRemaining)}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Match</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCompact(employerMatchLimit)}
                  </p>
                </div>
              </div>

              {/* Progress Percentage */}
              <div className="mt-2 text-center">
                <span className={`text-sm font-medium ${
                  employerProgress >= 100
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {employerProgress.toFixed(1)}% of match received
                </span>
                {employerProgress >= 100 && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">✓ Full match!</span>
                )}
              </div>

              {/* Tip for maximizing match */}
              {employerProgress < 100 && employeeRemaining > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    💡 <strong>Tip:</strong> Contribute {formatCurrency(employerRemaining)} more to maximize your employer match!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your annual salary to track employer match progress
              </p>
            </div>
          )}
        </div>
      )}

      {/* Helpful Tips */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Contribution Tips
        </h5>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          {employeeProgress < 100 && (
            <li>• You have {formatCurrency(employeeRemaining)} remaining contribution room for {retirement.contributionYear}</li>
          )}
          {isOver50 && retirement.catchUpLimit && employeeContributions < retirement.annualContributionLimit && (
            <li>• Age 50+ catch-up contributions available after reaching base limit</li>
          )}
          {retirement.hasEmployerMatch && employerProgress < 100 && annualSalary > 0 && (
            <li>• Leaving {formatCurrency(employerRemaining)} in free money on the table!</li>
          )}
          {retirement.taxTreatment === 'pre_tax' && (
            <li>• Pre-tax contributions reduce your taxable income</li>
          )}
          {retirement.taxTreatment === 'post_tax' && (
            <li>• Roth contributions grow tax-free and qualified withdrawals are tax-free</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ContributionTracker;
