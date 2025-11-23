import React from 'react';
import { DollarSign, TrendingDown, PieChart, TrendingUp } from 'lucide-react';

interface BudgetOverviewCardsProps {
  totalIncome: number;
  totalExpenses: number;
  currentSavingsRate: number;
  totalSavings: number;
}

export function BudgetOverviewCards({
  totalIncome,
  totalExpenses,
  currentSavingsRate,
  totalSavings
}: BudgetOverviewCardsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Monthly Income</p>
            <p className="text-2xl font-bold text-blue-900">${totalIncome.toLocaleString()}</p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Current Expenses</p>
            <p className="text-2xl font-bold text-red-900">${totalExpenses.toLocaleString()}</p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Current Savings Rate</p>
            <p className="text-2xl font-bold text-yellow-900">{(currentSavingsRate * 100).toFixed(1)}%</p>
          </div>
          <PieChart className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Potential Savings</p>
            <p className="text-2xl font-bold text-green-900">${totalSavings.toLocaleString()}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  );
}
