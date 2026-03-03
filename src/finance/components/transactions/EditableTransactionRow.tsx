/**
 * EditableTransactionRow Component
 * Inline editable transaction row with save/cancel controls
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Edit2, Trash2, ArrowLeftRight } from 'lucide-react';
import type { Transaction, Category, Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { logger } from '../../../services/logger';
import { useUpsertTransactionMutation, useDeleteTransactionMutation } from '@/hooks/useFinanceQuery';
import { TransactionFormModalV2, type TransactionFormData } from '../v2/TransactionFormModalV2';

interface EditableTransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
  onUpdate: () => void;
  onDelete: () => void;
  currentUserId?: string;
  partnerName?: string;
}

export const EditableTransactionRow = React.memo<EditableTransactionRowProps>(({
  transaction,
  categories,
  accounts,
  onUpdate,
  onDelete,
  currentUserId,
  partnerName,
}) => {
  const isOwnTransaction = !currentUserId || transaction.userId === currentUserId;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const upsertTransactionMutation = useUpsertTransactionMutation();
  const deleteTransactionMutation = useDeleteTransactionMutation();

  const handleSave = async (formData: TransactionFormData): Promise<void> => {
    try {
      await upsertTransactionMutation.mutateAsync({
        id: transaction.id,
        userId: transaction.userId,
        accountId: formData.accountId,
        description: formData.description,
        amount: formData.amount,
        categoryId: formData.categoryId,
        dateISO: formData.dateISO,
        type: formData.type,
        notes: formData.notes,
        merchantName: formData.merchantName,
        tags: formData.tags,
      });
      setIsEditModalOpen(false);
      onUpdate();
    } catch (error) {
      logger.error('EditableTransactionRow', error instanceof Error ? error : new Error(String(error)), { context: 'handleSave', transactionId: transaction.id });
      throw error;
    }
  };

  const handleDelete = async (): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!confirm('Delete this transaction?')) return;
    try {
      await deleteTransactionMutation.mutateAsync(transaction.id);
      onDelete();
    } catch (error) {
      logger.error('EditableTransactionRow', error instanceof Error ? error : new Error(String(error)), { context: 'handleDelete', transactionId: transaction.id });
      // eslint-disable-next-line no-alert
      alert('Failed to delete transaction');
    }
  };

  const isTransfer = !!transaction.transferId;

  return (
    <>
    <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors group ${isTransfer ? 'bg-blue-50/40' : ''}`}>
      <td className="px-4 py-3 text-sm text-slate-700">
        {new Date(transaction.dateISO).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
            {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
            {transaction.description}
          </div>
          {transaction.merchantName && transaction.merchantName !== transaction.description && (
            <div className="text-xs text-slate-600">{transaction.merchantName}</div>
          )}
          {transaction.notes && (
            <div className="text-xs text-slate-500 mt-0.5 italic">{transaction.notes}</div>
          )}
          {transaction.tags && transaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {transaction.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium">
        <span
          className={
            isTransfer
              ? 'text-blue-600'
              : transaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
          }
        >
          {isTransfer ? '↔' : transaction.type === 'credit' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-4 py-3">
        {isOwnTransaction ? (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-all hover:scale-110"
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => { void handleDelete(); }}
              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded transition-all hover:scale-110"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <span className="text-xs text-slate-400 italic">View only</span>
          </div>
        )}
      </td>

    </tr>
    {/* Portal to avoid invalid <tr> > <div> nesting */}
    {isEditModalOpen && ReactDOM.createPortal(
      <TransactionFormModalV2
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        isPending={upsertTransactionMutation.isPending}
        accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        categories={categories.map(c => ({ id: c.id, name: c.name, icon: c.icon }))}
        initialData={{
          dateISO: transaction.dateISO,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          notes: transaction.notes,
          merchantName: transaction.merchantName,
          tags: transaction.tags,
        }}
      />,
      document.body
    )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom equality check - only re-render if these specific props change
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.description === nextProps.transaction.description &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.transaction.categoryId === nextProps.transaction.categoryId &&
    prevProps.transaction.dateISO === nextProps.transaction.dateISO &&
    prevProps.transaction.type === nextProps.transaction.type &&
    prevProps.transaction.notes === nextProps.transaction.notes &&
    prevProps.transaction.userId === nextProps.transaction.userId &&
    prevProps.transaction.merchantName === nextProps.transaction.merchantName &&
    prevProps.transaction.transferId === nextProps.transaction.transferId &&
    prevProps.categories.length === nextProps.categories.length &&
    prevProps.accounts.length === nextProps.accounts.length
  );
});

export default EditableTransactionRow;
