import React from 'react';
import { Target } from 'lucide-react';
import { calculateRequiredSavings } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const GoalSavingsCalculator: React.FC = () => {
  const [goalAmount, setGoalAmount] = React.useState(30000);
  const [currentSavings, setCurrentSavings] = React.useState(5000);
  const [years, setYears] = React.useState(3);
  const [returnRate, setReturnRate] = React.useState(5);

  const result = calculateRequiredSavings(goalAmount, currentSavings, years, returnRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Goal Savings Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Goal Amount
            </label>
            <input
              type="number"
              value={goalAmount}
              onChange={e => setGoalAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Current Savings
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
              Years Until Goal
            </label>
            <input
              type="number"
              value={years}
              onChange={e => setYears(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Expected Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={returnRate}
              onChange={e => setReturnRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-sm text-blue-700 mb-1">Required Monthly Savings</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(result.requiredMonthlySavings)}
            </p>
            <p className="text-sm text-blue-600 mt-1">per month</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Total You'll Contribute</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.totalContributions)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Investment Growth</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(result.totalGrowth)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              From your current savings + new contributions
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Plan:</strong> Save {formatCurrency(result.requiredMonthlySavings)}/month
              for {years} years to reach your {formatCurrency(goalAmount)} goal!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
