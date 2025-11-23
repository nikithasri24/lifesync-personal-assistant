import React from 'react';
import { PiggyBank } from 'lucide-react';
import { calculate4PercentRule } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const RetirementCalculator: React.FC = () => {
  const [currentSavings, setCurrentSavings] = React.useState(100000);
  const [annualExpenses, setAnnualExpenses] = React.useState(50000);

  const rule4Percent = calculate4PercentRule(currentSavings);
  const targetAmount = rule4Percent.requiredForExpenses(annualExpenses);
  const shortfall = Math.max(0, targetAmount - currentSavings);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <PiggyBank className="h-6 w-6 text-emerald-600" />
        <h3 className="text-xl font-bold text-primary">Retirement Calculator (4% Rule)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Retirement Savings
            </label>
            <input
              type="number"
              value={currentSavings}
              onChange={e => setCurrentSavings(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Desired Annual Expenses in Retirement
            </label>
            <input
              type="number"
              value={annualExpenses}
              onChange={e => setAnnualExpenses(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50">
            <p className="text-xs text-blue-700">
              📊 <strong>The 4% Rule:</strong> Withdraw 4% of your portfolio annually
              for a 30-year retirement with 95% success rate based on historical data.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-sm text-emerald-700 mb-1">Current Safe Withdrawal</p>
            <p className="text-4xl font-bold text-emerald-900">
              {formatCurrency(rule4Percent.monthlyWithdrawal)}
            </p>
            <p className="text-sm text-emerald-600 mt-1">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Target Retirement Amount</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(targetAmount)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              To support {formatCurrency(annualExpenses/12)}/month
            </p>
          </div>

          {shortfall > 0 ? (
            <div className="p-4 rounded-lg bg-amber-50">
              <p className="text-sm text-amber-700 mb-1">Still Need to Save</p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(shortfall)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {((currentSavings / targetAmount) * 100).toFixed(1)}% of target reached
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">
                🎉 Congratulations! You've reached your retirement target!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
