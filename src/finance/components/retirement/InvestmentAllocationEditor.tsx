/**
 * InvestmentAllocationEditor Component
 * Editor for retirement account investment allocation with validation
 */

import React, { useState, useEffect } from 'react';
import { PieChart, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import type { InvestmentAllocation } from '../../types';
import { validateAllocation, suggestAllocation } from '../../utils/retirementCalculations';

interface InvestmentAllocationEditorProps {
  allocation?: InvestmentAllocation;
  age?: number;
  onChange: (allocation: InvestmentAllocation) => void;
  onClose?: () => void;
}

const InvestmentAllocationEditor: React.FC<InvestmentAllocationEditorProps> = ({
  allocation: initialAllocation,
  age = 30,
  onChange,
  onClose,
}) => {
  const [allocation, setAllocation] = useState<InvestmentAllocation>(
    initialAllocation || { stocks: 0, bonds: 0, cash: 0 }
  );

  const validation = validateAllocation(allocation);
  const suggested = suggestAllocation(age);

  // Update allocation when a field changes
  const handleChange = (field: keyof InvestmentAllocation, value: number) => {
    const newAllocation = { ...allocation, [field]: value };
    setAllocation(newAllocation);
  };

  // Apply suggested allocation
  const applySuggested = () => {
    setAllocation(suggested);
  };

  // Preset allocations
  const presets = {
    conservative: { stocks: 40, bonds: 50, cash: 10 },
    moderate: { stocks: 60, bonds: 35, cash: 5 },
    aggressive: { stocks: 80, bonds: 18, cash: 2 },
  };

  const applyPreset = (preset: 'conservative' | 'moderate' | 'aggressive') => {
    setAllocation(presets[preset]);
  };

  // Save allocation
  const handleSave = () => {
    if (validation.isValid) {
      onChange(allocation);
      onClose?.();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Investment Allocation
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Validation Status */}
      <div className={`mb-6 p-4 rounded-lg ${
        validation.isValid
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-start gap-2">
          {validation.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-semibold ${
              validation.isValid
                ? 'text-green-900 dark:text-green-300'
                : 'text-red-900 dark:text-red-300'
            }`}>
              {validation.isValid ? 'Allocation is valid' : 'Allocation needs adjustment'}
            </p>
            <p className={`text-xs ${
              validation.isValid
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}>
              Total: {validation.totalPercentage.toFixed(1)}%
              {validation.errors.length > 0 && (
                <span className="block mt-1">{validation.errors[0]}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Quick Presets:</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={applySuggested}
            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            Age-Based
          </button>
          <button
            onClick={() => applyPreset('conservative')}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Conservative
          </button>
          <button
            onClick={() => applyPreset('moderate')}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Moderate
          </button>
          <button
            onClick={() => applyPreset('aggressive')}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Aggressive
          </button>
        </div>
      </div>

      {/* Allocation Inputs */}
      <div className="space-y-4 mb-6">
        {/* Stocks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Stocks / Equities
            </label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allocation.stocks || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.stocks || 0}
            onChange={(e) => handleChange('stocks', Number(e.target.value))}
            className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Higher risk, higher potential returns
          </p>
        </div>

        {/* Bonds */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bonds / Fixed Income
            </label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allocation.bonds || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.bonds || 0}
            onChange={(e) => handleChange('bonds', Number(e.target.value))}
            className="w-full h-2 bg-green-200 dark:bg-green-800 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lower risk, stable income
          </p>
        </div>

        {/* Cash */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cash / Money Market
            </label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allocation.cash || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.cash || 0}
            onChange={(e) => handleChange('cash', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Very low risk, minimal returns
          </p>
        </div>

        {/* International (optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              International (Optional)
            </label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allocation.international || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.international || 0}
            onChange={(e) => handleChange('international', Number(e.target.value))}
            className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Diversification across global markets
          </p>
        </div>

        {/* Real Estate (optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Real Estate (Optional)
            </label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {allocation.realEstate || 0}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={allocation.realEstate || 0}
            onChange={(e) => handleChange('realEstate', Number(e.target.value))}
            className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            REITs and real estate investments
          </p>
        </div>
      </div>

      {/* Visual Allocation Bar */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Visual Breakdown
        </p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {allocation.stocks && allocation.stocks > 0 && (
            <div
              className="bg-blue-600 flex items-center justify-center text-white text-xs font-semibold"
              style={{ width: `${allocation.stocks}%` }}
            >
              {allocation.stocks >= 10 && `${allocation.stocks}%`}
            </div>
          )}
          {allocation.bonds && allocation.bonds > 0 && (
            <div
              className="bg-green-600 flex items-center justify-center text-white text-xs font-semibold"
              style={{ width: `${allocation.bonds}%` }}
            >
              {allocation.bonds >= 10 && `${allocation.bonds}%`}
            </div>
          )}
          {allocation.cash && allocation.cash > 0 && (
            <div
              className="bg-gray-500 flex items-center justify-center text-white text-xs font-semibold"
              style={{ width: `${allocation.cash}%` }}
            >
              {allocation.cash >= 10 && `${allocation.cash}%`}
            </div>
          )}
          {allocation.international && allocation.international > 0 && (
            <div
              className="bg-purple-600 flex items-center justify-center text-white text-xs font-semibold"
              style={{ width: `${allocation.international}%` }}
            >
              {allocation.international >= 10 && `${allocation.international}%`}
            </div>
          )}
          {allocation.realEstate && allocation.realEstate > 0 && (
            <div
              className="bg-orange-600 flex items-center justify-center text-white text-xs font-semibold"
              style={{ width: `${allocation.realEstate}%` }}
            >
              {allocation.realEstate >= 10 && `${allocation.realEstate}%`}
            </div>
          )}
        </div>
      </div>

      {/* Age-Based Suggestion */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Age-Based Suggestion (Age {age})
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Based on the "110 minus age" rule: {suggested.stocks}% stocks, {suggested.bonds}% bonds
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              This balances growth potential with risk as you approach retirement.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!validation.isValid}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            validation.isValid
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Save Allocation
        </button>
      </div>
    </div>
  );
};

export default InvestmentAllocationEditor;
