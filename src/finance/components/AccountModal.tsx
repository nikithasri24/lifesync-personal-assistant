/**
 * Account Modal - Add/Edit Account
 *
 * Modal for creating new accounts or editing existing ones
 */

import React from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../services/logger';
import { useToast } from '../../hooks/useToast';
import type { Account, AccountType } from '../types';
import { useUpsertAccountMutation, useDeleteAccountMutation } from '@/hooks/useFinanceQuery';

interface AccountModalProps {
  account?: Account;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ account, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const upsertAccountMutation = useUpsertAccountMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const [formData, setFormData] = React.useState({
    name: account?.name ?? '',
    type: account?.type ?? 'checking',
    balance: account?.balance?.toString() ?? '0',
  });

  const isEditing = !!account;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      await upsertAccountMutation.mutateAsync({
        id: account?.id,
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance),
      });

      showToast(
        isEditing ? 'Account updated successfully!' : 'Account created successfully!',
        'success'
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      logger.error('AccountModal', error instanceof Error ? error : new Error(String(error)), { context: 'handleSubmit' });
      showToast('Failed to save account. Check console for details.', 'error');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!account?.id) return;

    if (!confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync(account.id);
      showToast('Account deleted successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      logger.error('AccountModal', error instanceof Error ? error : new Error(String(error)), { context: 'handleDelete', accountId: account.id });
      showToast('Failed to delete account. Check console for details.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">
            {isEditing ? 'Edit Account' : 'Add New Account'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {isEditing ? 'Update account details' : 'Create a new financial account'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g., My Checking Account"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="brokerage">Brokerage</option>
                <option value="investment">Investment</option>
                <option value="loan">Loan</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Credit cards and loans are treated as liabilities (negative balances are debts)
              </p>
            </div>

            {/* Balance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Balance <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                For credit cards, enter positive number for amount owed (e.g., 1200 for $1,200 debt)
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={upsertAccountMutation.isPending || deleteAccountMutation.isPending}>
              Cancel
            </Button>
            {isEditing && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={upsertAccountMutation.isPending || deleteAccountMutation.isPending}
                className="text-rose-600 hover:bg-rose-50"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
          <Button onClick={(e) => { void handleSubmit(e); }} disabled={upsertAccountMutation.isPending || deleteAccountMutation.isPending}>
            {upsertAccountMutation.isPending ? 'Saving...' : isEditing ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </div>
    </div>
  );
};
