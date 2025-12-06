import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { BudgetRecommendation } from './types';

interface CategoryRecommendationsSectionProps {
  recommendations: BudgetRecommendation[];
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'over': return 'text-red-600 bg-red-50 border-red-200';
    case 'under': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getPriorityIcon = (priority: string): React.ReactElement => {
  switch (priority) {
    case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'medium': return <Info className="w-4 h-4 text-yellow-500" />;
    case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
    default: return <Info className="w-4 h-4 text-gray-500" />;
  }
};

export function CategoryRecommendationsSection({
  recommendations
}: CategoryRecommendationsSectionProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Category Recommendations</h4>
          <span className="text-sm text-gray-500">{recommendations.length} categories</span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.category}
              className={`p-4 rounded-lg border ${getStatusColor(recommendation.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{recommendation.icon}</span>
                  <div>
                    <h5 className="font-semibold text-gray-900">{recommendation.categoryName}</h5>
                    <div className="flex items-center text-sm text-gray-600">
                      {getPriorityIcon(recommendation.priority)}
                      <span className="ml-1 capitalize">{recommendation.priority} priority</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ${recommendation.currentSpending.toFixed(0)} / ${recommendation.recommendedBudget.toFixed(0)}
                  </div>
                  <div className="text-sm">
                    {recommendation.percentageOfIncome.toFixed(1)}% of income
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Budget Progress</span>
                  <span>{((recommendation.currentSpending / recommendation.recommendedBudget) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      recommendation.status === 'over' ? 'bg-red-500' :
                      recommendation.status === 'under' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((recommendation.currentSpending / recommendation.recommendedBudget) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{recommendation.reason}</p>

              {recommendation.savings > 0 && (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Potential Monthly Savings:</span>
                    <span className="text-lg font-bold text-green-600">${recommendation.savings.toFixed(2)}</span>
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
