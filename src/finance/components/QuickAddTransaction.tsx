/**
 * Quick Add Transaction Modal
 *
 * Simple form for adding test transactions quickly
 */

import React from 'react';
import { Button } from '../ui/Button';
import { logger } from '../../services/logger';
import { useToast } from '../../hooks/useToast';
import { useUpsertTransactionMutation, useAccountsQuery, useCategoriesQuery, useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import { useAuth } from '@/hooks/useAuth';

interface QuickAddTransactionProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickAddTransaction: React.FC<QuickAddTransactionProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const upsertTransactionMutation = useUpsertTransactionMutation();
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner info from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const partnerId = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerId;
  }, [mergedConnection, user]);

  // Use React Query hooks for data fetching
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();

  const [formData, setFormData] = React.useState({
    accountId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'debit' as 'debit' | 'credit',
    categoryId: '',
    notes: '',
    userId: user?.id ?? '' // Default to current user
  });

  // Set default account when accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, formData.accountId]);

  // Filter categories based on transaction type
  const incomeCategories = ['Salary', 'Income', 'Freelance', 'Bonus', 'Investment', 'Refund', 'Gift', 'Other Income'];
  const expenseCategories = ['Coffee', 'Groceries', 'Dining Out', 'Entertainment', 'Shopping', 'Gas', 'Utilities', 'Miscellaneous', 'Vanity'];

  const filteredCategories = React.useMemo(() => {
    if (formData.type === 'credit') {
      // Show income categories first, then others
      return categories.sort((a, b) => {
        const aIsIncome = incomeCategories.some(ic => a.name.toLowerCase().includes(ic.toLowerCase()));
        const bIsIncome = incomeCategories.some(ic => b.name.toLowerCase().includes(ic.toLowerCase()));
        if (aIsIncome && !bIsIncome) return -1;
        if (!aIsIncome && bIsIncome) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Show expense categories first, then others
      return categories.sort((a, b) => {
        const aIsExpense = expenseCategories.some(ec => a.name.toLowerCase().includes(ec.toLowerCase()));
        const bIsExpense = expenseCategories.some(ec => b.name.toLowerCase().includes(ec.toLowerCase()));
        if (aIsExpense && !bIsExpense) return -1;
        if (!aIsExpense && bIsExpense) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  }, [categories, formData.type]);

  // Auto-select appropriate category when type changes
  React.useEffect(() => {
    if (categories.length === 0) return;

    const suggestedCategoryNames = formData.type === 'credit'
      ? ['Salary', 'Income', 'Miscellaneous']
      : ['Miscellaneous'];

    // Find first matching category
    const suggestedCategory = categories.find(cat =>
      suggestedCategoryNames.some(name => cat.name.toLowerCase().includes(name.toLowerCase()))
    );

    if (suggestedCategory) {
      setFormData(prev => ({ ...prev, categoryId: suggestedCategory.id }));
    }
  }, [formData.type, categories]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      logger.debug('QuickAddTransaction', 'Submitting transaction', {
        userId: formData.userId,
        currentUserId: user?.id,
        partnerId,
        accountId: formData.accountId,
        description: formData.description,
        amount: formData.amount,
      });

      await upsertTransactionMutation.mutateAsync({
        accountId: formData.accountId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dateISO: formData.date,
        type: formData.type,
        categoryId: formData.categoryId || undefined,
        notes: formData.notes || undefined,
        userId: formData.userId || user?.id, // Use selected userId or default to current user
      });

      showToast('Transaction added successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      logger.error('QuickAddTransaction', error instanceof Error ? error : new Error(String(error)), {
        errorMessage,
        userId: formData.userId,
        currentUserId: user?.id,
        partnerId,
        accountId: formData.accountId,
      });
      showToast(`Failed to add transaction: ${errorMessage}`, 'error');
    }
  };

  const expensePresets: Array<{ description: string; amount: string }> = [
    { description: 'STARBUCKS #1234', amount: '5.75' },
    { description: 'NETFLIX.COM', amount: '15.49' },
    { description: 'WHOLE FOODS', amount: '127.50' },
    { description: 'MY LOCAL CAFE', amount: '4.25' },
    { description: 'AMAZON PRIME', amount: '14.99' },
    { description: 'UBER TRIP', amount: '23.45' },
    { description: 'SPOTIFY PREMIUM', amount: '10.99' },
    { description: 'MCDONALDS #456', amount: '12.50' },
    { description: 'TARGET STORE', amount: '65.30' },
    { description: 'CVS PHARMACY', amount: '28.75' },
  ];

  const incomePresets: Array<{ description: string; amount: string }> = [
    { description: 'Monthly Salary', amount: '5000.00' },
    { description: 'Paycheck', amount: '2500.00' },
    { description: 'Freelance Payment', amount: '1500.00' },
    { description: 'Bonus', amount: '2000.00' },
    { description: 'Tax Refund', amount: '3000.00' },
    { description: 'Investment Dividend', amount: '250.00' },
    { description: 'Side Hustle Income', amount: '800.00' },
    { description: 'Rental Income', amount: '1200.00' },
  ];

  const fillPreset = React.useCallback((preset: { description: string; amount: string }): void => {
    setFormData(prev => ({
      ...prev,
      description: preset.description,
      amount: preset.amount
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-slate-900">
            {formData.type === 'credit' ? 'Add Income' : 'Add Expense'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {formData.type === 'credit'
              ? 'Record income, salary, or other money received'
              : 'Record expenses, purchases, or money spent'}
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              >
                {accounts.length === 0 && (
                  <option value="">No accounts found - create one first</option>
                )}
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Type Selection - Moved up for better UX */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="debit"
                    checked={formData.type === 'debit'}
                    onChange={(_e) => setFormData({ ...formData, type: 'debit' })}
                    className="mr-2"
                  />
                  <span className="text-rose-600 font-medium">Expense (Debit)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit"
                    checked={formData.type === 'credit'}
                    onChange={(_e) => setFormData({ ...formData, type: 'credit' })}
                    className="mr-2"
                  />
                  <span className="text-emerald-600 font-medium">Income (Credit)</span>
                </label>
              </div>
            </div>

            {/* Quick Presets - Dynamic based on type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quick Presets (click to fill)
              </label>
              <div className="flex flex-wrap gap-2">
                {(formData.type === 'credit' ? incomePresets : expensePresets).map((preset) => (
                  <button
                    key={preset.description}
                    type="button"
                    onClick={() => fillPreset(preset)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      formData.type === 'credit'
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                    }`}
                  >
                    {preset.description} (${preset.amount})
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g., STARBUCKS #1234"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">-- Select Category --</option>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {formData.type === 'credit'
                  ? 'Income categories shown first'
                  : 'Expense categories shown first'}
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            {/* Owner Selection - only in merged mode */}
            {mergedConnection && user && partnerId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Who made this purchase?
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value={user.id}>Me</option>
                  <option value={partnerId}>{partnerName || 'Partner'}</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  This determines who owns this transaction
                </p>
              </div>
            )}

            {/* Notes (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-slate-200 flex justify-between flex-shrink-0 bg-white">
          <Button variant="ghost" onClick={onClose} disabled={upsertTransactionMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={upsertTransactionMutation.isPending || !formData.accountId}>
            {upsertTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </div>
    </div>
  );
};
