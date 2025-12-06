import React from 'react';
import { Zap } from 'lucide-react';
import { ruleOf72 } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const RuleOf72Calculator: React.FC = () => {
  const [returnRate, setReturnRate] = React.useState(7);
  const result = ruleOf72(returnRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-6 w-6 text-yellow-600" />
        <h3 className="text-xl font-bold text-primary">Rule of 72 Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
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

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>What is the Rule of 72?</strong>
            </p>
            <p className="text-xs text-blue-600">
              A quick way to estimate how long it takes for an investment to double.
              Simply divide 72 by your annual return rate.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <p className="text-sm text-yellow-700 mb-1">Years to Double Your Money</p>
            <p className="text-4xl font-bold text-yellow-900">
              {result.yearsToDouble.toFixed(1)} years
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm font-semibold text-purple-800 mb-3">
              Your Money Over Time (starting with $10,000)
            </p>
            {result.doublings.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-purple-200 last:border-0">
                <span className="text-sm text-purple-700">Year {d.years.toFixed(1)}</span>
                <span className="font-bold text-purple-900">
                  {formatCurrency(10000 * d.multiplier)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
