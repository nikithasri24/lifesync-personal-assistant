import { Zap, Award } from 'lucide-react';
import type { StrategyComparison } from './types';

interface StrategyRecommendationProps {
  strategies: StrategyComparison[];
}

export default function StrategyRecommendation({ strategies }: StrategyRecommendationProps) {
  if (strategies.length === 0) return <></>;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start space-x-3">
        <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-800 mb-2">Recommended Strategy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy, index) => {
              const isBest = index === 0;
              return (
                <div key={strategy.name} className={`p-4 rounded-lg border ${
                  isBest ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{strategy.name}</h5>
                    {isBest && <Award className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Interest:</span>
                      <span className="font-medium">${strategy.totalInterest.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payoff Time:</span>
                      <span className="font-medium">{strategy.monthsToPayoff} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="font-medium">${strategy.totalPayments.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
