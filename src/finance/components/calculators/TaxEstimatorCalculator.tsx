import React from 'react';
import { Percent } from 'lucide-react';
import { calculateFederalTax, calculateFICATax } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';

export const TaxEstimatorCalculator: React.FC = () => {
  const [income, setIncome] = React.useState(80000);
  const [filingStatus, setFilingStatus] = React.useState<'single' | 'married'>('single');
  const [selfEmployed, setSelfEmployed] = React.useState(false);

  const federalTax = calculateFederalTax(income, filingStatus);
  const ficaTax = calculateFICATax(income, selfEmployed);
  const totalTax = federalTax.totalTax + ficaTax.total;
  const takeHome = income - totalTax;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Percent className="h-6 w-6 text-red-600" />
        <h3 className="text-xl font-bold text-primary">Tax Estimator (2025)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Annual Income
            </label>
            <input
              type="number"
              value={income}
              onChange={e => setIncome(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={e => setFilingStatus(e.target.value as 'single' | 'married')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="selfEmployed"
              checked={selfEmployed}
              onChange={e => setSelfEmployed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selfEmployed" className="ml-2 text-sm text-primary">
              Self-Employed (pay both halves of FICA)
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50">
            <p className="text-sm text-red-700 mb-1">Total Tax Liability</p>
            <p className="text-4xl font-bold text-red-900">
              {formatCurrency(totalTax)}
            </p>
            <p className="text-sm text-red-600 mt-1">
              {((totalTax / income) * 100).toFixed(1)}% of income
            </p>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-blue-50 flex items-center justify-between">
              <span className="text-sm text-blue-700">Federal Income Tax</span>
              <span className="font-bold text-blue-900">{formatCurrency(federalTax.totalTax)}</span>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 flex items-center justify-between">
              <span className="text-sm text-purple-700">FICA (SS + Medicare)</span>
              <span className="font-bold text-purple-900">{formatCurrency(ficaTax.total)}</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-1">Take-Home Pay</p>
            <p className="text-2xl font-bold text-emerald-900">
              {formatCurrency(takeHome)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {formatCurrency(takeHome / 12)}/month
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 text-xs text-amber-700">
            <p className="font-semibold mb-1">Tax Rates:</p>
            <p>Marginal: {federalTax.marginalRate.toFixed(1)}%</p>
            <p>Effective: {federalTax.effectiveRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
