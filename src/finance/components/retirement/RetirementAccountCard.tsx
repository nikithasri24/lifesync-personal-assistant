/**
 * RetirementAccountCard Component
 * Displays retirement account summary with vested balance, contributions, and performance
 */

import React from 'react';
import { PiggyBank, TrendingUp, Lock, Unlock, DollarSign, Edit, Trash2 } from 'lucide-react';
import type { RetirementAccountWithStats } from '../../types';
import { OwnerBadge } from '../../../components/common/OwnerBadge';

interface RetirementAccountCardProps {
  retirement: RetirementAccountWithStats;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUserId?: string;
  partnerName?: string;
}

const RetirementAccountCard: React.FC<RetirementAccountCardProps> = ({
  retirement,
  onEdit,
  onDelete,
  currentUserId,
  partnerName,
}) => {
  const totalBalance = retirement.accountBalance;
  const vestedBalance = retirement.vestedBalance;
  const unvestedBalance = retirement.unvestedBalance;
  const ytdContributions = retirement.totalYTDContributions;
  const remainingRoom = retirement.remainingEmployeeRoom;
  const contributionProgress = retirement.annualContributionLimit > 0
    ? (retirement.currentYearContributions / retirement.annualContributionLimit) * 100
    : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get account type display name
  const getAccountTypeDisplay = (name: string) => {
    if (name.includes('401')) return '401(k)';
    if (name.includes('403')) return '403(b)';
    if (name.includes('roth')) return 'Roth IRA';
    if (name.includes('traditional')) return 'Traditional IRA';
    if (name.includes('sep')) return 'SEP IRA';
    if (name.includes('simple')) return 'SIMPLE IRA';
    if (name.includes('hsa')) return 'HSA';
    return name;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {retirement.accountName}
              </h3>
              {currentUserId && retirement.userId && (
                <OwnerBadge
                  userId={retirement.userId}
                  currentUserId={currentUserId}
                  partnerName={partnerName}
                  size="sm"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getAccountTypeDisplay(retirement.accountName)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit account"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Balance Section */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {unvestedBalance > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vested</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(vestedBalance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unvested</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(unvestedBalance)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance (if available) */}
      {retirement.latestGains !== undefined && retirement.latestGains !== null && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${retirement.latestGains >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Total Gains</span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${retirement.latestGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(retirement.latestGains)}
              </p>
              {retirement.latestReturnRate !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {retirement.latestReturnRate.toFixed(2)}% annual return
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contribution Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {retirement.contributionYear} Contributions
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(ytdContributions)} / {formatCurrency(retirement.annualContributionLimit)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              contributionProgress >= 100
                ? 'bg-green-600'
                : contributionProgress >= 75
                ? 'bg-blue-600'
                : 'bg-blue-400'
            }`}
            style={{ width: `${Math.min(contributionProgress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {contributionProgress.toFixed(1)}% of limit
          </span>
          {remainingRoom > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(remainingRoom)} remaining
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Employee YTD</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(retirement.currentYearContributions)}
          </p>
        </div>

        {retirement.hasEmployerMatch && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Employer YTD</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(retirement.employerContributionsYTD)}
            </p>
          </div>
        )}

        {retirement.hasVestingSchedule && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vesting</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {retirement.vestingPercentage.toFixed(0)}%
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tax Treatment</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {retirement.taxTreatment.replace('_', '-')}
          </p>
        </div>
      </div>

      {/* Investment Allocation (if available) */}
      {retirement.allocation && Object.keys(retirement.allocation).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Asset Allocation</p>
          <div className="flex flex-wrap gap-2">
            {retirement.allocation.stocks !== undefined && (
              <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                <span className="text-blue-900 dark:text-blue-300">
                  Stocks: {retirement.allocation.stocks}%
                </span>
              </div>
            )}
            {retirement.allocation.bonds !== undefined && (
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs">
                <span className="text-green-900 dark:text-green-300">
                  Bonds: {retirement.allocation.bonds}%
                </span>
              </div>
            )}
            {retirement.allocation.cash !== undefined && retirement.allocation.cash > 0 && (
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <span className="text-gray-900 dark:text-gray-300">
                  Cash: {retirement.allocation.cash}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes (if available) */}
      {retirement.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{retirement.notes}</p>
        </div>
      )}
    </div>
  );
};

export default RetirementAccountCard;
