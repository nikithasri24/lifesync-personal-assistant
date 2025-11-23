import React from 'react';
import { DollarSign } from 'lucide-react';
import { calculate503020Budget } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const BudgetCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = React.useState(5000);
  const result = calculate503020Budget(monthlyIncome);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-6 w-6 text-green-600" />
        <h3 className="text-xl font-bold text-primary">50/30/20 Budget Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Monthly After-Tax Income
            </label>
            <input
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>The 50/30/20 Rule</strong>
            </p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• 50% Needs (housing, utilities, groceries, insurance)</li>
              <li>• 30% Wants (dining out, entertainment, hobbies)</li>
              <li>• 20% Savings & Debt (emergency fund, retirement, extra debt payments)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className="text-sm text-emerald-700 mb-1">Needs (50%)</p>
            <p className="text-4xl font-bold text-emerald-900">
              {formatCurrency(result.needs)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Housing, food, utilities, insurance</p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-1">Wants (30%)</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(result.wants)}
            </p>
            <p className="text-xs text-blue-600 mt-1">Entertainment, dining, hobbies</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-1">Savings & Debt (20%)</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(result.savings)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Emergency fund, retirement, extra payments</p>
          </div>
        </div>
      </div>
    </div>
  );
};
