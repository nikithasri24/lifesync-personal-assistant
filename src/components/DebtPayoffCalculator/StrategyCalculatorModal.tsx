import { X } from 'lucide-react';
import type { StrategyComparison } from './types';

interface StrategyCalculatorModalProps {
  strategies: StrategyComparison[];
  extraPayment: number;
  selectedStrategy: 'snowball' | 'avalanche' | 'custom';
  onExtraPaymentChange: (value: number) => void;
  onStrategyChange: (strategy: 'snowball' | 'avalanche' | 'custom') => void;
  onClose: () => void;
}

export default function StrategyCalculatorModal({
  strategies,
  extraPayment,
  selectedStrategy,
  onExtraPaymentChange,
  onStrategyChange,
  onClose
}: StrategyCalculatorModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Debt Payoff Strategy Calculator</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extra Monthly Payment
              </label>
              <input
                type="number"
                step="0.01"
                value={extraPayment}
                onChange={(e) => onExtraPaymentChange(parseFloat(e.target.value) || 0)}
                placeholder="500.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Additional amount beyond minimum payments
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => onStrategyChange(
                  e.target.value as 'avalanche' | 'snowball' | 'custom'
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="avalanche">Debt Avalanche (Highest Interest First)</option>
                <option value="snowball">Debt Snowball (Smallest Balance First)</option>
                <option value="custom">Custom Strategy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map((strategy, _index) => (
              <div key={strategy.name} className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">{strategy.name}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payoff Time:</span>
                    <span className="font-medium">{strategy.monthsToPayoff} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-medium text-red-600">${strategy.totalInterest.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payments:</span>
                    <span className="font-medium">${strategy.totalPayments.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Strategy Comparison</h5>
            <p className="text-sm text-blue-700">
              The <strong>Debt Avalanche</strong> method typically saves more money in interest,
              while the <strong>Debt Snowball</strong> method provides psychological wins with quicker payoffs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
