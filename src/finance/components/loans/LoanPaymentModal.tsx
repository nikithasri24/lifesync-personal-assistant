/**
 * LoanPaymentModal Component
 * Modal for recording loan payments
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Loan, LoanPaymentInput } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface LoanPaymentModalProps {
  loan: Loan;
  onSave: (payment: LoanPaymentInput) => void;
  onCancel: () => void;
}

export const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({ loan, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<LoanPaymentInput, 'balanceAfter'>>({
    loanId: loan.id,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: loan.monthlyPayment + loan.extraPayment,
    principalAmount: 0,
    interestAmount: 0,
    extraAmount: loan.extraPayment,
    notes: '',
  });

  // Calculate interest based on current balance and APR
  const monthlyInterestRate = loan.interestRate / 100 / 12;
  const calculatedInterest = loan.currentBalance * monthlyInterestRate;
  const calculatedPrincipal = formData.amount - calculatedInterest;
  const newBalance = loan.currentBalance - calculatedPrincipal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-calculate interest and principal if not manually entered
    const interestAmount = formData.interestAmount || calculatedInterest;
    const principalAmount = formData.principalAmount || calculatedPrincipal;
    const balanceAfter = loan.currentBalance - principalAmount;

    onSave({
      ...formData,
      interestAmount,
      principalAmount,
      balanceAfter,
    });
  };

  const handleAutoCalculate = () => {
    setFormData({
      ...formData,
      interestAmount: calculatedInterest,
      principalAmount: calculatedPrincipal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Record Payment
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{loan.loanName}</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Balance Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Current Balance:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(loan.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-700 dark:text-gray-300">Estimated Interest:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(calculatedInterest)}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Total Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Auto-calculate button */}
          <button
            type="button"
            onClick={handleAutoCalculate}
            className="w-full px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors"
          >
            Auto-Calculate Interest & Principal Split
          </button>

          {/* Interest and Principal Split */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestAmount}
                onChange={(e) =>
                  setFormData({ ...formData, interestAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={calculatedInterest.toFixed(2)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Principal Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.principalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={calculatedPrincipal.toFixed(2)}
              />
            </div>
          </div>

          {/* Extra Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Extra Payment (beyond required)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.extraAmount}
              onChange={(e) =>
                setFormData({ ...formData, extraAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* New Balance Preview */}
          {(formData.principalAmount > 0 || calculatedPrincipal > 0) && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">New Balance:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(newBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Optional payment notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
