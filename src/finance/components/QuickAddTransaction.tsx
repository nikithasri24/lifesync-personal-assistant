/**
 * Quick Add Transaction Modal
 *
 * Simple form for adding test transactions quickly
 */

import React from 'react';
import { Button } from '../ui/Button';
import { getFinanceAPI } from '../data';
import { logger } from '../../services/logger';

interface QuickAddTransactionProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickAddTransaction: React.FC<QuickAddTransactionProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = React.useState({
    accountId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'debit' as 'debit' | 'credit',
    notes: ''
  });

  // Load accounts
  React.useEffect(() => {
    async function loadAccounts() {
      try {
        const api = await getFinanceAPI();
        const accts = await api.listAccounts();
        setAccounts(accts);
        if (accts.length > 0) {
          setFormData(prev => ({ ...prev, accountId: accts[0].id }));
        }
      } catch (error) {
        logger.error('Failed to load accounts:', { error });
      }
    }
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const api = await getFinanceAPI();
      await api.upsertTransaction({
        accountId: formData.accountId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dateISO: formData.date,
        type: formData.type,
        notes: formData.notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Failed to add transaction:', { error });
      alert('Failed to add transaction. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const presetTransactions = [
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

  const fillPreset = (preset: { description: string; amount: string }) => {
    setFormData(prev => ({
      ...prev,
      description: preset.description,
      amount: preset.amount
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Quick Add Transaction</h2>
          <p className="text-sm text-slate-600 mt-1">Add a test transaction</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quick Presets (click to fill)
              </label>
              <div className="flex flex-wrap gap-2">
                {presetTransactions.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => fillPreset(preset)}
                    className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-300 transition-colors"
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

            {/* Type */}
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
                  Debit (Expense)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit"
                    checked={formData.type === 'credit'}
                    onChange={(_e) => setFormData({ ...formData, type: 'credit' })}
                    className="mr-2"
                  />
                  Credit (Income)
                </label>
              </div>
            </div>

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

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.accountId}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </div>
    </div>
  );
};
