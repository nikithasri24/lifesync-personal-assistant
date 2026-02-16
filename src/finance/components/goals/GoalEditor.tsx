/**
 * GoalEditor Component
 * Modal for creating and editing financial goals with account linking
 */

import React from 'react';
import {
  X,
  Save,
  Trash2,
  Target,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import type { Goal, Account, GoalInput } from '../../types';
import { useAuth } from '@/hooks/useAuth';
import { useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';

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
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  const [form, setForm] = React.useState<Partial<GoalInput>>({
    type: 'savings',
    currentAmount: 0,
    trackNetworth: false,
    isShared: false,
  });
  const [saving, setSaving] = React.useState<boolean>(false);
  const [_error, setError] = React.useState<string>('');
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = React.useState<boolean>(false);

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
          trackNetworth: goal.trackNetworth ?? false,
          isShared: goal.isShared ?? false,
          connectionId: goal.connectionId,
        });
      } else {
        // Creating new goal
        setForm({
          type: 'savings',
          currentAmount: 0,
          trackNetworth: false,
          isShared: false,
          dueDateISO: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        });
      }
      setError('');
    }
  }, [isOpen, goal]);

  const _handleSave = async (): Promise<void> => {
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
      // If shared goal, use the connection_id from merged connection
      const connectionId = (form.isShared && mergedConnection) ? mergedConnection.connectionId : undefined;

      await onSave({
        ...(form.id ? { id: form.id } : {}),
        name: form.name ?? '',
        targetAmount: form.targetAmount ?? 0,
        currentAmount: form.currentAmount ?? 0,
        startingAmount: 0, // Always start from 0
        dueDateISO: form.dueDateISO ?? '',
        type: form.type ?? 'savings',
        connectionId,
        isShared: form.isShared,
        linkedAccountId: form.linkedAccountId,
        trackNetworth: form.trackNetworth,
      } as GoalInput);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (): void => {
    if (!goal || !onDelete) return;

    // Replacing confirm with state-based confirmation
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!goal || !onDelete) {
      setIsDeleteConfirmationOpen(false);
      return;
    }

    try {
      setSaving(true);
      await onDelete(goal.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setSaving(false);
      setIsDeleteConfirmationOpen(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const _savingsAccounts = accounts.filter(a => a.type === 'savings' || a.type === 'checking');

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              {goal ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Goal Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Goal Name
              </label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Emergency Fund, Vacation, New Car"
              />
            </div>

            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Goal Type
              </label>
              <select
                value={form.type ?? 'savings'}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'savings' | 'debt' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="savings">Savings</option>
                <option value="debt">Debt Payoff</option>
              </select>
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.targetAmount ?? ''}
                  onChange={(e) => setForm({ ...form, targetAmount: parseFloat(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Current Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.currentAmount ?? 0}
                  onChange={(e) => setForm({ ...form, currentAmount: parseFloat(e.target.value) })}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={form.dueDateISO ? form.dueDateISO.split('T')[0] : ''}
                onChange={(e) => setForm({ ...form, dueDateISO: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Linked Account (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Linked Account (Optional)
              </label>
              <select
                value={form.linkedAccountId ?? ''}
                onChange={(e) => setForm({ ...form, linkedAccountId: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={form.trackNetworth}
              >
                <option value="">None - Manual tracking</option>
                {_savingsAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Automatically track progress from a savings account balance
              </p>
            </div>

            {/* Track Net Worth Option */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.trackNetworth ?? false}
                  onChange={(e) => setForm({ ...form, trackNetworth: e.target.checked })}
                  disabled={!!form.linkedAccountId}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Track total net worth instead</span>
              </label>
            </div>

            {/* Shared Goal Option - only in merged mode */}
            {mergedConnection && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isShared ?? false}
                    onChange={(e) => setForm({ ...form, isShared: e.target.checked })}
                    className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900">
                      This is a shared goal
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      Both you and {mergedConnection.partnerName} are working toward this goal together.
                      It will be visible to both of you and contributions from either partner will count toward the target.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                {goal && onDelete && (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Goal
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void _handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete "{goal?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmationOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoalEditor;