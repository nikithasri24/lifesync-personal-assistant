/**
 * RetirementDashboard Component
 * Overview dashboard for all retirement accounts with aggregate stats
 */

import React from 'react';
import { PiggyBank, TrendingUp, Target, Award, Plus } from 'lucide-react';
import type { RetirementAccountWithStats } from '../../types';
import { calculateTotalRetirementValue, calculate4PercentRule, calculateRetirementReadiness } from '../../utils/retirementCalculations';
import RetirementAccountCard from './RetirementAccountCard';

interface RetirementDashboardProps {
  retirementAccounts: RetirementAccountWithStats[];
  annualSalary?: number;
  age?: number;
  onAddAccount?: () => void;
  onEditAccount?: (accountId: string) => void;
  onDeleteAccount?: (accountId: string) => void;
}

const RetirementDashboard: React.FC<RetirementDashboardProps> = ({
  retirementAccounts,
  annualSalary = 0,
  age = 30,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totals = calculateTotalRetirementValue(retirementAccounts);
  const rule4Percent = calculate4PercentRule(totals.totalValue);

  // Calculate retirement readiness
  const readiness = calculateRetirementReadiness(age, totals.totalValue, annualSalary);

  // Calculate total YTD contributions
  const totalYTDContributions = retirementAccounts.reduce(
    (sum, account) => sum + account.totalYTDContributions,
    0
  );

  // Calculate total gains
  const totalGains = retirementAccounts.reduce((sum, account) => {
    return sum + (account.latestGains || 0);
  }, 0);

  // Group accounts by type
  const accountsByType = retirementAccounts.reduce((acc, account) => {
    const type = account.accountName;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(account);
    return acc;
  }, {} as Record<string, RetirementAccountWithStats[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Retirement Accounts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your 401(k), IRA, HSA, and other retirement savings
          </p>
        </div>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Retirement Account
          </button>
        )}
      </div>

      {retirementAccounts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <PiggyBank className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Retirement Accounts Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start tracking your 401(k), IRA, HSA, and other retirement accounts to monitor your progress toward retirement goals.
            </p>
            {onAddAccount && (
              <button
                onClick={onAddAccount}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Retirement Account
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Value */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm font-medium">Total Value</span>
                <PiggyBank className="h-5 w-5 text-blue-100" />
              </div>
              <p className="text-3xl font-bold mb-1">{formatCurrency(totals.totalValue)}</p>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span>Vested: {formatCurrency(totals.totalVested)}</span>
              </div>
            </div>

            {/* YTD Contributions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {new Date().getFullYear()} Contributions
                </span>
                <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(totalYTDContributions)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {retirementAccounts.length} account{retirementAccounts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Total Gains */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Gains</span>
                <TrendingUp className={`h-5 w-5 ${totalGains >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <p className={`text-3xl font-bold mb-1 ${totalGains >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(totalGains)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Investment performance
              </p>
            </div>

            {/* Retirement Readiness */}
            <div className={`rounded-lg shadow-sm p-6 ${
              readiness.status === 'excellent' || readiness.status === 'good'
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : readiness.status === 'fair'
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white'
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">Readiness Score</span>
                <Target className="h-5 w-5 opacity-90" />
              </div>
              <p className="text-3xl font-bold mb-1">{readiness.score}/100</p>
              <p className="text-sm opacity-90 capitalize">{readiness.status.replace('-', ' ')}</p>
            </div>
          </div>

          {/* 4% Rule & Readiness Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 4% Rule Withdrawal */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Safe Withdrawal (4% Rule)
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Safe Withdrawal</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(rule4Percent.annualWithdrawal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Safe Withdrawal</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(rule4Percent.monthlyWithdrawal)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Based on current balance, you could safely withdraw this amount annually in retirement with a high probability of not running out of money.
                  </p>
                </div>
              </div>
            </div>

            {/* Readiness Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Retirement Readiness
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Multiple</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {readiness.currentMultiple}x salary
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target for Age {age}</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {readiness.benchmarkMultiple}x salary
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {readiness.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown by Account Type */}
          {Object.keys(totals.byType).length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Balance by Account Type
              </h3>
              <div className="space-y-3">
                {Object.entries(totals.byType).map(([type, value]) => {
                  const percentage = totals.totalValue > 0 ? (value / totals.totalValue) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{type}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(value)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Account Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Accounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {retirementAccounts.map((account) => (
                <RetirementAccountCard
                  key={account.id}
                  retirement={account}
                  onEdit={onEditAccount ? () => onEditAccount(account.accountId) : undefined}
                  onDelete={onDeleteAccount ? () => onDeleteAccount(account.accountId) : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RetirementDashboard;
