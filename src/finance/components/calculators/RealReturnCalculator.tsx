import React from 'react';
import { Calendar } from 'lucide-react';
import { calculateRealReturn } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const RealReturnCalculator: React.FC = () => {
  const [nominalReturn, setNominalReturn] = React.useState(8);
  const [inflationRate, setInflationRate] = React.useState(3);

  const result = calculateRealReturn(nominalReturn, inflationRate);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-bold text-primary">Real Return Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Nominal Return Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={nominalReturn}
              onChange={e => setNominalReturn(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inflationRate}
              onChange={e => setInflationRate(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              📊 <strong>Why It Matters</strong>
            </p>
            <p className="text-xs text-blue-600">
              Real return shows your actual purchasing power growth. An 8% return with 3% inflation
              means your money's buying power only grows 4.85% per year.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <p className="text-sm text-blue-700 mb-1">Real Rate of Return</p>
            <p className="text-4xl font-bold text-blue-900">
              {result.realReturn.toFixed(2)}%
            </p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-2">Interpretation</p>
            <p className="text-sm text-purple-900">
              {result.interpretation}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              Example: $10,000 invested for 10 years
            </p>
            <div className="space-y-2 text-sm text-emerald-700">
              <div className="flex justify-between">
                <span>Nominal growth:</span>
                <span className="font-bold">
                  {formatCurrency(10000 * Math.pow(1 + nominalReturn / 100, 10))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Real value (purchasing power):</span>
                <span className="font-bold">
                  {formatCurrency(10000 * Math.pow(1 + result.realReturn / 100, 10))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
