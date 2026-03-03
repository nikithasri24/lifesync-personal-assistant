/**
 * TransactionGroupTable
 * Table displaying transactions within a group
 */

import React from 'react';
import { EditableTransactionRow } from './EditableTransactionRow';
import type { Transaction, Category, Account } from '../../types';

interface TransactionGroupTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdate: () => void;
  onDelete: () => void;
  currentUserId?: string;
  partnerName?: string;
}

export const TransactionGroupTable: React.FC<TransactionGroupTableProps> = ({
  transactions,
  categories,
  accounts,
  onUpdate,
  onDelete,
  currentUserId,
  partnerName,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
              Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
              Description
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
              Amount
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <EditableTransactionRow
              key={txn.id}
              transaction={txn}
              categories={categories}
              accounts={accounts}
              onUpdate={onUpdate}
              onDelete={onDelete}
              currentUserId={currentUserId}
              partnerName={partnerName}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

