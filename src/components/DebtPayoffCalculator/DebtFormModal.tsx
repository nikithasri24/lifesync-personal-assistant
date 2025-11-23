import { X } from 'lucide-react';
import type { DebtAccount } from '../../types/finance';

const DEBT_TYPES = [
  { value: 'credit_card', label: 'Credit Card', icon: '💳', color: '#EF4444' },
  { value: 'student_loan', label: 'Student Loan', icon: '🎓', color: '#3B82F6' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠', color: '#10B981' },
  { value: 'loan', label: 'Personal Loan', icon: '💰', color: '#F59E0B' },
  { value: 'other', label: 'Other Debt', icon: '📋', color: '#8B5CF6' }
];

interface DebtFormData {
  type: 'credit_card' | 'student_loan' | 'mortgage' | 'loan' | 'other';
  balance: string;
  interestRate: string;
  minimumPayment: string;
  creditLimit: string;
  accountName: string;
}

interface DebtFormModalProps {
  editingDebt: DebtAccount | null;
  debtForm: DebtFormData;
  onFormChange: (form: DebtFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function DebtFormModal({
  editingDebt,
  debtForm,
  onFormChange,
  onSave,
  onClose
}: DebtFormModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingDebt ? 'Edit Debt Account' : 'Add New Debt'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debt Type
            </label>
            <select
              value={debtForm.type}
              onChange={(e) => onFormChange({
                ...debtForm,
                type: e.target.value as 'credit_card' | 'student_loan' | 'mortgage' | 'loan' | 'other'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {DEBT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={debtForm.balance}
                onChange={(e) => onFormChange({ ...debtForm, balance: e.target.value })}
                placeholder="5000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={debtForm.interestRate}
                onChange={(e) => onFormChange({ ...debtForm, interestRate: e.target.value })}
                placeholder="18.99"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Payment
              </label>
              <input
                type="number"
                step="0.01"
                value={debtForm.minimumPayment}
                onChange={(e) => onFormChange({ ...debtForm, minimumPayment: e.target.value })}
                placeholder="125.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Limit (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={debtForm.creditLimit}
                onChange={(e) => onFormChange({ ...debtForm, creditLimit: e.target.value })}
                placeholder="8000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!debtForm.balance || !debtForm.interestRate || !debtForm.minimumPayment}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {editingDebt ? 'Update Debt' : 'Add Debt'}
          </button>
        </div>
      </div>
    </div>
  );
}
