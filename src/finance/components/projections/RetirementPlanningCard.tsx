import React from 'react';
import { PiggyBank, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { calculate4PercentRule } from '../../utils/calculations';

interface RetirementPlanningCardProps {
  netWorth: number;
  monthlyExpenses: number;
  savingsRate: number;
  yearsToFI: number;
  yearsToFIInterpretation: string;
}

export const RetirementPlanningCard: React.FC<RetirementPlanningCardProps> = ({
  netWorth,
  monthlyExpenses,
  savingsRate,
  yearsToFI,
  yearsToFIInterpretation,
}) => {
  const retirementRule = calculate4PercentRule(netWorth);
  const targetRetirementAmount = (monthlyExpenses * 12) / 0.04;
  const retirementGap = targetRetirementAmount - netWorth;

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
            Based on current net worth of {formatCurrency(netWorth)}
          </p>
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
    </div>
  );
};
