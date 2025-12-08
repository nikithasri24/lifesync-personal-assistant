import React from 'react';
import { PiggyBank, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { calculate4PercentRule } from '../../utils/calculations';
import type { RetirementAccountWithStats } from '../../types';
import { calculateTotalRetirementValue } from '../../utils/retirementCalculations';

interface RetirementPlanningCardProps {
  netWorth: number;
  monthlyExpenses: number;
  savingsRate: number;
  yearsToFI: number;
  yearsToFIInterpretation: string;
  retirementAccounts?: RetirementAccountWithStats[];
}

export const RetirementPlanningCard: React.FC<RetirementPlanningCardProps> = ({
  netWorth,
  monthlyExpenses,
  savingsRate,
  yearsToFI,
  yearsToFIInterpretation,
  retirementAccounts,
}) => {
  // Use retirement-specific balance if accounts are provided
  const retirementTotals = retirementAccounts ? calculateTotalRetirementValue(retirementAccounts) : null;
  const retirementBalance = retirementTotals ? retirementTotals.totalVested : netWorth;

  const retirementRule = calculate4PercentRule(retirementBalance);
  const targetRetirementAmount = (monthlyExpenses * 12) / 0.04;
  const retirementGap = targetRetirementAmount - retirementBalance;

  // Calculate total YTD contributions if retirement accounts available
  const totalYTDContributions = retirementAccounts?.reduce(
    (sum, account) => sum + account.totalYTDContributions,
    0
  ) || 0;

  return (
    <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <PiggyBank className="h-5 w-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-primary">Retirement Planning</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-blue-50">
          <p className="text-sm text-blue-700 mb-2">Current Safe Withdrawal (4% Rule)</p>
          <p className="text-3xl font-bold text-blue-900">
            {formatCurrency(retirementRule.monthlyWithdrawal)}
          </p>
          <p className="text-xs text-blue-600 mt-1">per month</p>
          <p className="text-sm text-blue-700 mt-3">
            Based on {retirementTotals ? 'retirement accounts' : 'net worth'} of {formatCurrency(retirementBalance)}
          </p>
          {retirementTotals && retirementTotals.totalUnvested > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              ({formatCurrency(retirementTotals.totalUnvested)} unvested not included)
            </p>
          )}
        </div>
        <div className="p-4 rounded-lg bg-purple-50">
          <p className="text-sm text-purple-700 mb-2">Target Retirement Amount</p>
          <p className="text-3xl font-bold text-purple-900">
            {formatCurrency(targetRetirementAmount)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            to cover {formatCurrency(monthlyExpenses)}/mo expenses
          </p>
          {retirementGap > 0 && (
            <p className="text-sm text-purple-700 mt-3">
              Need {formatCurrency(retirementGap)} more to reach target
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900 mb-1">
              Financial Independence Timeline
            </p>
            <p className="text-sm text-emerald-700">
              At your current savings rate of {savingsRate.toFixed(1)}%,
              you could achieve financial independence in approximately{' '}
              <span className="font-bold">
                {yearsToFI === Infinity ? '∞' : yearsToFI.toFixed(0)} years
              </span>.
            </p>
            <p className="text-xs text-emerald-600 mt-2">
              {yearsToFIInterpretation}
            </p>
          </div>
        </div>
      </div>

      {/* Retirement Accounts Summary */}
      {retirementAccounts && retirementAccounts.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Retirement Account Contributions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-amber-700">Total Accounts</p>
                  <p className="text-lg font-bold text-amber-900">{retirementAccounts.length}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-700">{new Date().getFullYear()} YTD</p>
                  <p className="text-lg font-bold text-amber-900">
                    {formatCurrency(totalYTDContributions)}
                  </p>
                </div>
              </div>
              {retirementTotals && Object.keys(retirementTotals.byType).length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-700 mb-1">By Account Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(retirementTotals.byType).map(([type, value]) => (
                      <span key={type} className="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded">
                        {type}: {formatCurrency(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
