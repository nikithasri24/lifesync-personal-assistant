/**
 * GoalEditor Component
 * Modal for creating and editing financial goals with account linking
 */

import React from 'react';
import {
  _X,
  _Save,
  Trash2,
  _Target,
  _TrendingUp,
  _DollarSign
} from 'lucide-react';
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
      await onSave({
        id: form.id,
        name: form.name,
        targetAmount: form.targetAmount,
        currentAmount: form.currentAmount ?? 0,
        startingAmount: 0, // Always start from 0
        dueDateISO: form.dueDateISO,
        type: form.type ?? 'savings',
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
          {/* Header and other sections */}
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