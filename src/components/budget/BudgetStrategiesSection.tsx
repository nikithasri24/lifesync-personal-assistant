import React from 'react';
import { Calculator, Award } from 'lucide-react';
import type { BudgetStrategy } from './types';

interface BudgetStrategiesSectionProps {
  strategies: BudgetStrategy[];
  selectedStrategy: string;
  totalIncome: number;
  showDetails: boolean;
  onStrategySelect: (strategyId: string) => void;
}

export function BudgetStrategiesSection({
  strategies,
  selectedStrategy,
  totalIncome,
  showDetails,
  onStrategySelect
}: BudgetStrategiesSectionProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Recommended Budget Strategies
        </h4>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedStrategy === strategy.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onStrategySelect(strategy.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">{strategy.name}</h5>
                <div className="flex items-center">
                  <Award className={`w-4 h-4 mr-1 ${
                    strategy.suitability >= 80 ? 'text-green-500' :
                    strategy.suitability >= 60 ? 'text-yellow-500' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">{strategy.suitability}% match</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Savings Rate</span>
                  <div className="font-semibold text-green-600">
                    {(strategy.totalSavingsRate * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Monthly Savings</span>
                  <div className="font-semibold text-green-600">
                    ${(totalIncome * strategy.totalSavingsRate).toLocaleString()}
                  </div>
                </div>
              </div>

              {showDetails && (
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-green-700">Pros:</span>
                    <ul className="text-xs text-gray-600">
                      {strategy.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-red-700">Cons:</span>
                    <ul className="text-xs text-gray-600">
                      {strategy.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
