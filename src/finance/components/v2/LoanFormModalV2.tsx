/**
 * LoanFormModalV2 Component
 * Create/edit loans with Together pattern
 * Auto-save, loan type selector, payment details, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LoanFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LoanFormData) => void | Promise<void>;
  initialData?: Partial<LoanFormData>;
  isPending?: boolean;
}

export interface LoanFormData {
  name: string;
  loanType: string;
  principalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate?: string;
  loanTerm?: number; // months
  notes?: string;
}

const STORAGE_KEY = 'finance_loan_modal_draft';

const LOAN_TYPES = [
  { value: 'mortgage', label: 'Mortgage', emoji: '🏠' },
  { value: 'auto', label: 'Auto Loan', emoji: '🚗' },
  { value: 'student', label: 'Student Loan', emoji: '🎓' },
  { value: 'personal', label: 'Personal Loan', emoji: '💳' },
  { value: 'business', label: 'Business Loan', emoji: '🏢' },
  { value: 'other', label: 'Other', emoji: '💰' },
];

export const LoanFormModalV2: React.FC<LoanFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}) => {
  // Load saved draft
  const loadDraft = () => {
    if (initialData) return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = loadDraft();

  const [name, setName] = useState(savedDraft?.name || initialData?.name || '');
  const [loanType, setLoanType] = useState(savedDraft?.loanType || initialData?.loanType || 'personal');
  const [principalAmount, setPrincipalAmount] = useState(
    savedDraft?.principalAmount?.toString() || initialData?.principalAmount?.toString() || ''
  );
  const [currentBalance, setCurrentBalance] = useState(
    savedDraft?.currentBalance?.toString() || initialData?.currentBalance?.toString() || ''
  );
  const [interestRate, setInterestRate] = useState(
    savedDraft?.interestRate?.toString() || initialData?.interestRate?.toString() || ''
  );
  const [monthlyPayment, setMonthlyPayment] = useState(
    savedDraft?.monthlyPayment?.toString() || initialData?.monthlyPayment?.toString() || ''
  );
  const [nextPaymentDate, setNextPaymentDate] = useState(
    savedDraft?.nextPaymentDate || initialData?.nextPaymentDate || ''
  );
  const [loanTerm, setLoanTerm] = useState(
    savedDraft?.loanTerm?.toString() || initialData?.loanTerm?.toString() || ''
  );
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name,
          loanType,
          principalAmount: parseFloat(principalAmount) || 0,
          currentBalance: parseFloat(currentBalance) || 0,
          interestRate: parseFloat(interestRate) || 0,
          monthlyPayment: parseFloat(monthlyPayment) || 0,
          nextPaymentDate,
          loanTerm: loanTerm ? parseInt(loanTerm) : undefined,
          notes,
        })
      );
    }
  }, [name, loanType, principalAmount, currentBalance, interestRate, monthlyPayment, nextPaymentDate, loanTerm, notes, initialData]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a loan name');
      return;
    }

    if (!principalAmount || parseFloat(principalAmount) <= 0) {
      alert('Please enter a valid principal amount');
      return;
    }

    if (!currentBalance || parseFloat(currentBalance) < 0) {
      alert('Please enter a valid current balance');
      return;
    }

    if (!monthlyPayment || parseFloat(monthlyPayment) <= 0) {
      alert('Please enter a valid monthly payment');
      return;
    }

    const formData: LoanFormData = {
      name: name.trim(),
      loanType,
      principalAmount: parseFloat(principalAmount),
      currentBalance: parseFloat(currentBalance),
      interestRate: parseFloat(interestRate) || 0,
      monthlyPayment: parseFloat(monthlyPayment),
      nextPaymentDate: nextPaymentDate || undefined,
      loanTerm: loanTerm ? parseInt(loanTerm) : undefined,
      notes: notes.trim() || undefined,
    };

    await onSave(formData);

    if (!initialData) {
      localStorage.removeItem(STORAGE_KEY);
    }

    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Loan' : 'Add Loan'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Loan Name */}
            <div>
              <label htmlFor="loan-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Loan Name <span className="text-red-500">*</span>
              </label>
              <input
                id="loan-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Home Mortgage, Car Loan"
                required
              />
            </div>

            {/* Loan Type */}
            <div>
              <label htmlFor="loan-type" className="block text-sm font-semibold text-gray-900 mb-2">
                Loan Type
              </label>
              <select
                id="loan-type"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                {LOAN_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Principal Amount */}
            <div>
              <label htmlFor="loan-principal" className="block text-sm font-semibold text-gray-900 mb-2">
                Original Loan Amount <span className="text-red-500">*</span>
              </label>
              <input
                id="loan-principal"
                type="number"
                step="0.01"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Current Balance */}
            <div>
              <label htmlFor="loan-balance" className="block text-sm font-semibold text-gray-900 mb-2">
                Current Balance <span className="text-red-500">*</span>
              </label>
              <input
                id="loan-balance"
                type="number"
                step="0.01"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Interest Rate */}
            <div>
              <label htmlFor="loan-rate" className="block text-sm font-semibold text-gray-900 mb-2">
                Interest Rate (APR %)
              </label>
              <input
                id="loan-rate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Monthly Payment */}
            <div>
              <label htmlFor="loan-payment" className="block text-sm font-semibold text-gray-900 mb-2">
                Monthly Payment <span className="text-red-500">*</span>
              </label>
              <input
                id="loan-payment"
                type="number"
                step="0.01"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Loan Term */}
            <div>
              <label htmlFor="loan-term" className="block text-sm font-semibold text-gray-900 mb-2">
                Loan Term (months)
              </label>
              <input
                id="loan-term"
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., 360 for 30-year mortgage"
              />
            </div>

            {/* Next Payment Date */}
            <div>
              <label htmlFor="loan-next-payment" className="block text-sm font-semibold text-gray-900 mb-2">
                Next Payment Date
              </label>
              <input
                id="loan-next-payment"
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="loan-notes" className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="loan-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes about this loan..."
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
