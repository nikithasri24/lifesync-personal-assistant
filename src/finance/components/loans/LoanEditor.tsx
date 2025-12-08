/**
 * LoanEditor Component
 * Form for creating and editing loans
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Loan, LoanInput, LoanType, LoanStatus } from '../../types';

interface LoanEditorProps {
  loan?: Loan;
  onSave: (loan: LoanInput) => void;
  onCancel: () => void;
}

const LoanEditor: React.FC<LoanEditorProps> = ({ loan, onSave, onCancel }) => {
  const [formData, setFormData] = useState<LoanInput>({
    id: loan?.id,
    accountId: loan?.accountId,
    loanName: loan?.loanName || '',
    loanType: loan?.loanType || 'auto',
    status: loan?.status || 'active',
    principalAmount: loan?.principalAmount || 0,
    currentBalance: loan?.currentBalance || 0,
    interestRate: loan?.interestRate || 0,
    monthlyPayment: loan?.monthlyPayment || 0,
    extraPayment: loan?.extraPayment || 0,
    targetPayoffDate: loan?.targetPayoffDate || '',
    startDate: loan?.startDate || new Date().toISOString().split('T')[0],
    firstPaymentDate: loan?.firstPaymentDate || '',
    lender: loan?.lender,
    loanNumber: loan?.loanNumber,
    termMonths: loan?.termMonths,
    notes: loan?.notes,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const loanTypes: { value: LoanType; label: string }[] = [
    { value: 'auto', label: 'Auto Loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'personal', label: 'Personal Loan' },
    { value: 'student', label: 'Student Loan' },
    { value: 'business', label: 'Business Loan' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions: { value: LoanStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'paid_off', label: 'Paid Off' },
    { value: 'deferred', label: 'Deferred' },
    { value: 'defaulted', label: 'Defaulted' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {loan ? 'Edit Loan' : 'Add New Loan'}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loan Name *
            </label>
            <input
              type="text"
              value={formData.loanName}
              onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Car Loan 2024"
              required
            />
          </div>

          {/* Loan Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Type *
              </label>
              <select
                value={formData.loanType}
                onChange={(e) => setFormData({ ...formData, loanType: e.target.value as LoanType })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {loanTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LoanStatus })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lender and Loan Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lender
              </label>
              <input
                type="text"
                value={formData.lender || ''}
                onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bank of America"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Number
              </label>
              <input
                type="text"
                value={formData.loanNumber || ''}
                onChange={(e) => setFormData({ ...formData, loanNumber: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Principal Amount and Current Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Loan Amount (Principal) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.principalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, principalAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Balance *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) =>
                  setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Interest Rate and Term */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Original Term (Months)
              </label>
              <input
                type="number"
                value={formData.termMonths || ''}
                onChange={(e) =>
                  setFormData({ ...formData, termMonths: parseInt(e.target.value) || undefined })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 60"
              />
            </div>
          </div>

          {/* Monthly Payment and Extra Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Payment *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyPayment}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyPayment: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Extra Monthly Payment
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.extraPayment}
                onChange={(e) =>
                  setFormData({ ...formData, extraPayment: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Payment Date *
              </label>
              <input
                type="date"
                value={formData.firstPaymentDate}
                onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Target Payoff Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Payoff Date *
            </label>
            <input
              type="date"
              value={formData.targetPayoffDate}
              onChange={(e) => setFormData({ ...formData, targetPayoffDate: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any additional notes..."
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
              {loan ? 'Save Changes' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { LoanEditor };
