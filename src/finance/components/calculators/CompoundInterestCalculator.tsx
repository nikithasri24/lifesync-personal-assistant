import React from 'react';
import { TrendingUp } from 'lucide-react';
import { calculateCompoundInterest } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const CompoundInterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = React.useState(10000);
  const [monthlyContribution, setMonthlyContribution] = React.useState(500);
  const [years, setYears] = React.useState(30);
  const [returnRate, setReturnRate] = React.useState(7);

  const result = calculateCompoundInterest(principal, monthlyContribution, returnRate, years);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Compound Interest Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Starting Amount
            </label>
            <input
              type="number"
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly Contribution
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Years to Grow
            </label>
            <input
              type="number"
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Annual Return Rate (%)
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
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <p className="text-sm text-blue-700 mb-1">Future Value</p>
            <p className="text-4xl font-bold text-blue-900">
              {formatCurrency(result.futureValue)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Total Contributed</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(result.totalContributed)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Investment Gains</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.totalGains)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {((result.totalGains / result.totalContributed) * 100).toFixed(1)}% return on contributions
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>Insight:</strong> Your {formatCurrency(monthlyContribution)}/month contribution
              will grow to {formatCurrency(result.futureValue)} in {years} years,
              earning {formatCurrency(result.totalGains)} in investment returns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
