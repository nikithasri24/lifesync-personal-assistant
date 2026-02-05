/**
 * Recurring Transactions List Component
 * Displays all recurring transaction templates with management actions
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, DollarSign, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import type { RecurringTransaction, RecurringTransactionInput } from '../../types';
import {
  useRecurringTransactionsQuery,
  useUpsertRecurringTransactionMutation,
  useDeleteRecurringTransactionMutation,
  useFinanceMergedConnectionQuery,
} from '@/hooks/useFinanceQuery';
import { RecurringTransactionEditor } from './RecurringTransactionEditor';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '../OwnerBadge';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const RecurringTransactionsList: React.FC = () => {
  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  const { data: recurring = [], isLoading } = useRecurringTransactionsQuery();
  const upsertMutation = useUpsertRecurringTransactionMutation();
  const deleteMutation = useDeleteRecurringTransactionMutation();

  const [showEditor, setShowEditor] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | undefined>();

  const handleAdd = () => {
    setEditingRecurring(undefined);
    setShowEditor(true);
  };

  const handleEdit = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setShowEditor(true);
  };

  const handleSave = async (input: RecurringTransactionInput) => {
    await upsertMutation.mutateAsync(input);
    setShowEditor(false);
    setEditingRecurring(undefined);
  };

  const handleToggleActive = async (rec: RecurringTransaction) => {
    await upsertMutation.mutateAsync({
      ...rec,
      active: !rec.active,
    });
  };

  const handleDelete = async (rec: RecurringTransaction) => {
    if (!confirm(`Delete recurring transaction "${rec.description}"?`)) return;
    await deleteMutation.mutateAsync(rec.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading recurring transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recurring Transactions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your recurring bills and income
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Recurring
        </button>
      </div>

      {/* List */}
      {recurring.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No recurring transactions yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set up recurring transactions like subscriptions, rent, or salary
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Your First Recurring Transaction
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((rec) => (
            <div
              key={rec.id}
              className={`rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ${
                rec.active ? 'ring-gray-200 dark:ring-gray-700' : 'ring-gray-300 dark:ring-gray-600 opacity-60'
              } p-4 transition-all hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {rec.description}
                    </h3>
                    {user && (
                      <OwnerBadge
                        userId={rec.userId}
                        currentUserId={user.id}
                        partnerName={partnerName}
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {FREQUENCY_LABELS[rec.frequency] || rec.frequency}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleToggleActive(rec)}
                    className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={rec.active ? 'Deactivate' : 'Activate'}
                  >
                    {rec.active ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(rec)}
                    className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(rec)}
                    className="rounded-lg p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Amount</span>
                </div>
                <p className={`text-2xl font-bold ${rec.type === 'credit' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {rec.type === 'credit' ? '+' : ''}{formatCurrency(rec.amount)}
                </p>
              </div>

              {/* Next Occurrence */}
              {rec.nextOccurrenceDate && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      Next on {new Date(rec.nextOccurrenceDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Pending Count Badge */}
              {rec.pendingCount && rec.pendingCount > 0 && (
                <div className="flex items-center gap-1.5 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    {rec.pendingCount} pending for review
                  </span>
                </div>
              )}

              {/* Details */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Generate:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {rec.daysBefore} day{rec.daysBefore !== 1 ? 's' : ''} before
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Approval:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {rec.requireApproval ? 'Required' : 'Auto-create'}
                  </span>
                </div>
                {rec.endDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Ends:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(rec.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <RecurringTransactionEditor
          recurring={editingRecurring}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingRecurring(undefined);
          }}
        />
      )}
    </div>
  );
};
