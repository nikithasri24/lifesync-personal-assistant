/**
 * GoalEditor Component
 * Modal for creating and editing financial goals with account linking
 */

import React from 'react';
import { X, Save, Trash2, Target, TrendingUp, DollarSign } from 'lucide-react';
import type { Goal, Account, GoalInput } from '../../types';

interface GoalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: GoalInput) => Promise<void>;
  onDelete?: (goalId: string) => Promise<void>;
  goal?: Goal; // If editing existing goal
  accounts: Account[];
}

export const GoalEditor: React.FC<GoalEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  goal,
  accounts,
}) => {
  const [form, setForm] = React.useState<Partial<GoalInput>>({
    type: 'savings',
    currentAmount: 0,
    trackNetworth: false,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (goal) {
        // Editing existing goal
        setForm({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          dueDateISO: goal.dueDateISO,
          type: goal.type,
          linkedAccountId: goal.linkedAccountId,
          trackNetworth: goal.trackNetworth || false,
        });
      } else {
        // Creating new goal
        setForm({
          type: 'savings',
          currentAmount: 0,
          trackNetworth: false,
          dueDateISO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        });
      }
      setError('');
    }
  }, [isOpen, goal]);

  const handleSave = async () => {
    setError('');

    // Validation
    if (!form.name?.trim()) {
      setError('Please enter a goal name');
      return;
    }
    if (!form.targetAmount || form.targetAmount <= 0) {
      setError('Target amount must be greater than 0');
      return;
    }
    if (!form.dueDateISO) {
      setError('Please select a due date');
      return;
    }
    if (form.trackNetworth && form.linkedAccountId) {
      setError('Cannot track both networth and a specific account');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: form.id,
        name: form.name,
        targetAmount: form.targetAmount,
        currentAmount: form.currentAmount || 0,
        startingAmount: 0, // Always start from 0
        dueDateISO: form.dueDateISO,
        type: form.type || 'savings',
        linkedAccountId: form.linkedAccountId,
        trackNetworth: form.trackNetworth,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !onDelete) return;
    if (!confirm(`Are you sure you want to delete "${goal.name}"?`)) return;

    try {
      setSaving(true);
      await onDelete(goal.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const savingsAccounts = accounts.filter(a => a.type === 'savings' || a.type === 'checking');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {goal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Track your financial objectives with smart insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ maxHeight: '60vh' }}
        >
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Goal Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Goal Name *
              </label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Emergency Fund, House Down Payment"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Goal Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'savings' })}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 border-2 transition-all ${
                    form.type === 'savings'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Savings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'debt' })}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 border-2 transition-all ${
                    form.type === 'debt'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">Debt Payoff</span>
                </button>
              </div>
            </div>

            {/* Amounts Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.currentAmount || ''}
                    onChange={(e) => setForm({ ...form, currentAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.targetAmount || ''}
                    onChange={(e) => setForm({ ...form, targetAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Date *
              </label>
              <input
                type="date"
                value={form.dueDateISO ? form.dueDateISO.split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setForm({ ...form, dueDateISO: e.target.value + 'T00:00:00.000Z' });
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Auto-Tracking Section */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Automatic Tracking</h3>
              <p className="text-xs text-slate-600 mb-4">
                Link this goal to an account or your total net worth to automatically update progress
              </p>

              {/* Track Networth Option */}
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 cursor-pointer transition-colors mb-3">
                <input
                  type="checkbox"
                  checked={form.trackNetworth || false}
                  onChange={(e) => setForm({
                    ...form,
                    trackNetworth: e.target.checked,
                    linkedAccountId: e.target.checked ? undefined : form.linkedAccountId,
                  })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Track Net Worth</div>
                  <div className="text-xs text-slate-600">Use total net worth (assets - liabilities)</div>
                </div>
              </label>

              {/* Link Account Option */}
              {!form.trackNetworth && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Or Link to Savings Account
                  </label>
                  <select
                    value={form.linkedAccountId || ''}
                    onChange={(e) => setForm({ ...form, linkedAccountId: e.target.value || undefined })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No linked account (manual tracking)</option>
                    {savingsAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - ${account.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {savingsAccounts.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      No savings accounts available. Create one in the Accounts section.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              {goal && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Goal
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Goal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalEditor;
