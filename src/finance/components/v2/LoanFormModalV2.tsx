/**
 * LoanFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit loans with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 383 lines to ~270 lines (30% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 6 loan types with emoji icons
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

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

interface LoanFormState {
  name: string;
  loanType: string;
  principalAmount: string;
  currentBalance: string;
  interestRate: string;
  monthlyPayment: string;
  nextPaymentDate: string;
  loanTerm: string;
  notes: string;
}

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
  const defaultFormData: LoanFormState = {
    name: '',
    loanType: 'personal',
    principalAmount: '',
    currentBalance: '',
    interestRate: '',
    monthlyPayment: '',
    nextPaymentDate: '',
    loanTerm: '',
    notes: '',
  };

  const initialFormData: LoanFormState | undefined = initialData ? {
    name: initialData.name || '',
    loanType: initialData.loanType || 'personal',
    principalAmount: initialData.principalAmount?.toString() || '',
    currentBalance: initialData.currentBalance?.toString() || '',
    interestRate: initialData.interestRate?.toString() || '',
    monthlyPayment: initialData.monthlyPayment?.toString() || '',
    nextPaymentDate: initialData.nextPaymentDate || '',
    loanTerm: initialData.loanTerm?.toString() || '',
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<LoanFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Loan' : 'Add Loan'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_loan_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Loan'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const loanData: LoanFormData = {
          name: formData.name.trim(),
          loanType: formData.loanType,
          principalAmount: parseFloat(formData.principalAmount) || 0,
          currentBalance: parseFloat(formData.currentBalance) || 0,
          interestRate: parseFloat(formData.interestRate) || 0,
          monthlyPayment: parseFloat(formData.monthlyPayment) || 0,
          nextPaymentDate: formData.nextPaymentDate || undefined,
          loanTerm: formData.loanTerm ? parseInt(formData.loanTerm) : undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(loanData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Please enter a loan name';
        if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
          return 'Please enter a valid principal amount';
        }
        if (!formData.currentBalance || parseFloat(formData.currentBalance) < 0) {
          return 'Please enter a valid current balance';
        }
        if (!formData.monthlyPayment || parseFloat(formData.monthlyPayment) <= 0) {
          return 'Please enter a valid monthly payment';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Loan Name */}
          <div>
            <label htmlFor="loan-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Loan Name <span className="text-red-500">*</span>
            </label>
            <input
              id="loan-name"
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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
              value={formState.loanType}
              onChange={(e) => setFormState({ ...formState, loanType: e.target.value })}
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
              value={formState.principalAmount}
              onChange={(e) => setFormState({ ...formState, principalAmount: e.target.value })}
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
              value={formState.currentBalance}
              onChange={(e) => setFormState({ ...formState, currentBalance: e.target.value })}
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
              value={formState.interestRate}
              onChange={(e) => setFormState({ ...formState, interestRate: e.target.value })}
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
              value={formState.monthlyPayment}
              onChange={(e) => setFormState({ ...formState, monthlyPayment: e.target.value })}
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
              value={formState.loanTerm}
              onChange={(e) => setFormState({ ...formState, loanTerm: e.target.value })}
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
              value={formState.nextPaymentDate}
              onChange={(e) => setFormState({ ...formState, nextPaymentDate: e.target.value })}
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
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes about this loan..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
