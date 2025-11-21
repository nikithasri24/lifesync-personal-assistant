/**
 * EditableTransactionRow Component
 * Inline editable transaction row with save/cancel controls
 */

import React, { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import type { Transaction, Category } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { getFinanceAPI } from '../../data';
import { logger } from '../../../services/logger';

interface EditableTransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  onUpdate: () => void;
  onDelete: () => void;
}

export const EditableTransactionRow: React.FC<EditableTransactionRowProps> = ({
  transaction,
  categories,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: transaction.description,
    amount: transaction.amount.toString(),
    categoryId: transaction.categoryId || '',
    dateISO: transaction.dateISO.split('T')[0],
    type: transaction.type,
    notes: transaction.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId || '',
      dateISO: transaction.dateISO.split('T')[0],
      type: transaction.type,
      notes: transaction.notes || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const api = await getFinanceAPI();

      await api.upsertTransaction({
        id: transaction.id,
        accountId: transaction.accountId,
        description: editData.description,
        amount: parseFloat(editData.amount),
        categoryId: editData.categoryId || undefined,
        dateISO: new Date(editData.dateISO).toISOString(),
        type: editData.type as 'debit' | 'credit',
        notes: editData.notes || undefined,
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      logger.error('Failed to update transaction:', { error });
      alert('Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;

    try {
      const api = await getFinanceAPI();
      await api.deleteTransaction(transaction.id);
      onDelete();
    } catch (error) {
      logger.error('Failed to delete transaction:', { error });
      alert('Failed to delete transaction');
    }
  };

  if (isEditing) {
    return (
      <tr className="border-b border-primary/10 bg-blue-50/30">
        <td className="px-4 py-3">
          <input
            type="date"
            value={editData.dateISO}
            onChange={(e) => setEditData({ ...editData, dateISO: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-2 py-1 text-sm border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={editData.categoryId}
            onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <select
            value={editData.type}
            onChange={(e) => setEditData({ ...editData, type: e.target.value as 'debit' | 'credit' })}
            className="w-full px-2 py-1 text-sm border border-primary/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="0.01"
            value={editData.amount}
            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
            placeholder="Amount"
            className="w-full px-2 py-1 text-sm border border-primary/20 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
              title="Save"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const categoryName = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)?.name || 'Unknown'
    : 'Uncategorized';

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3 text-sm text-slate-700">
        {new Date(transaction.dateISO).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-slate-900 text-sm">{transaction.description}</div>
          {transaction.merchantName && transaction.merchantName !== transaction.description && (
            <div className="text-xs text-slate-600">{transaction.merchantName}</div>
          )}
          {transaction.notes && (
            <div className="text-xs text-slate-500 mt-0.5 italic">{transaction.notes}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-sm ${
            transaction.categoryId
              ? 'text-slate-700'
              : 'text-slate-500 italic'
          }`}
        >
          {categoryName}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 capitalize">{transaction.type}</td>
      <td className="px-4 py-3 text-sm text-right font-medium">
        <span
          className={
            transaction.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
          }
        >
          {transaction.type === 'credit' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EditableTransactionRow;
