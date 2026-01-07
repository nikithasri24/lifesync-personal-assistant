/**
 * Pending Transactions Review Component
 * Shows pending recurring transactions awaiting approval with quick actions
 */

import React, { useState } from 'react';
import { CheckCircle, X, Edit2, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { PendingTransaction, TransactionInput } from '../../types';
import {
  usePendingTransactionsQuery,
  useApprovePendingTransactionMutation,
  useSkipPendingTransactionMutation,
  useDeletePendingTransactionMutation,
  useAccountsQuery,
  useCategoriesQuery,
} from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../../utils/currency';

interface PendingGroup {
  label: string;
  transactions: PendingTransaction[];
  color: string;
}

export const PendingTransactionsReview: React.FC = () => {
  const { data: pending = [], isLoading } = usePendingTransactionsQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const approveMutation = useApprovePendingTransactionMutation();
  const skipMutation = useSkipPendingTransactionMutation();
  const deleteMutation = useDeletePendingTransactionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TransactionInput>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['overdue', 'today']));

  // Group pending transactions by date
  const groups: PendingGroup[] = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const overdue = pending.filter(p => p.scheduledDate < todayStr);
    const todayItems = pending.filter(p => p.scheduledDate === todayStr);
    const tomorrowItems = pending.filter(p => p.scheduledDate === tomorrowStr);
    const thisWeek = pending.filter(p => p.scheduledDate > tomorrowStr && p.scheduledDate <= nextWeekStr);
    const future = pending.filter(p => p.scheduledDate > nextWeekStr);

    return [
      { label: 'Overdue', transactions: overdue, color: 'red' },
      { label: 'Today', transactions: todayItems, color: 'amber' },
      { label: 'Tomorrow', transactions: tomorrowItems, color: 'blue' },
      { label: 'This Week', transactions: thisWeek, color: 'gray' },
      { label: 'Later', transactions: future, color: 'gray' },
    ].filter(g => g.transactions.length > 0);
  }, [pending]);

  const handleApprove = async (p: PendingTransaction) => {
    await approveMutation.mutateAsync({ pendingId: p.id });
  };

  const handleSkip = async (p: PendingTransaction) => {
    await skipMutation.mutateAsync(p.id);
  };

  const handleDelete = async (p: PendingTransaction) => {
    if (!confirm('Delete this pending transaction?')) return;
    await deleteMutation.mutateAsync(p.id);
  };

  const handleEdit = (p: PendingTransaction) => {
    setEditingId(p.id);
    setEditForm({
      description: p.description,
      amount: p.amount,
      type: p.type,
      categoryId: p.categoryId,
      accountId: p.accountId,
      dateISO: p.scheduledDate,
    });
  };

  const handleSaveEdit = async (p: PendingTransaction) => {
    await approveMutation.mutateAsync({ pendingId: p.id, edits: editForm });
    setEditingId(null);
    setEditForm({});
  };

  const toggleGroup = (label: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-medium text-green-900 dark:text-green-100">All caught up!</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
              No pending transactions to review
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Transactions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {pending.length} transaction{pending.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.label);
          const colorClasses = {
            red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
            gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white',
          }[group.color];

          return (
            <div key={group.label} className={`rounded-2xl border ${colorClasses}`}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-2xl"
              >
                <div className="flex items-center gap-3">
                  {group.label === 'Overdue' && <AlertCircle className="h-5 w-5" />}
                  {group.label === 'Today' && <Clock className="h-5 w-5" />}
                  <div>
                    <h3 className="font-medium">{group.label}</h3>
                    <p className="text-sm opacity-70">{group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="border-t border-current/20">
                  {group.transactions.map((p) => {
                    const isEditing = editingId === p.id;
                    const category = categories.find(c => c.id === p.categoryId);
                    const account = accounts.find(a => a.id === p.accountId);

                    return (
                      <div
                        key={p.id}
                        className="p-4 border-b border-current/10 last:border-b-0"
                      >
                        {isEditing ? (
                          /* Edit Mode */
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium mb-1">Description</label>
                                <input
                                  type="text"
                                  value={editForm.description || ''}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Amount</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.amount || 0}
                                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                                  className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Category</label>
                                <select
                                  value={editForm.categoryId || ''}
                                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900"
                                >
                                  <option value="">Select...</option>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Date</label>
                                <input
                                  type="date"
                                  value={editForm.dateISO || ''}
                                  onChange={(e) => setEditForm({ ...editForm, dateISO: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(p)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                              >
                                Save & Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditForm({});
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{p.description}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm opacity-70">
                                <span>{formatCurrency(p.amount)}</span>
                                {category && <span>• {category.name}</span>}
                                {account && <span>• {account.name}</span>}
                                <span>• {new Date(p.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-3">
                              <button
                                onClick={() => handleApprove(p)}
                                className="rounded-lg p-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(p)}
                                className="rounded-lg p-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                title="Edit & Approve"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSkip(p)}
                                className="rounded-lg p-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                                title="Skip"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                className="rounded-lg p-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
                                title="Delete"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
