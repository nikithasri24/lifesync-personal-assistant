/**
 * TransactionItemV2 Component
 * Display transaction list items with category icons and color-coded amounts
 */

import React from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  dateISO: string;
  categoryId?: string;
}

interface Category {
  name: string;
  icon?: string;
  color?: string;
}

interface TransactionItemV2Props {
  transaction: Transaction;
  category?: Category;
  onClick: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const TransactionItemV2: React.FC<TransactionItemV2Props> = ({
  transaction,
  category,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-md"
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(139, 111, 71, 0.06)',
      }}
    >
      {/* Category Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: category?.color
            ? `${category.color}20`
            : 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {category?.icon || '💰'}
      </div>

      {/* Transaction Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#5C4A3A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {transaction.description}
        </div>
        <div style={{ fontSize: '13px', color: '#9B8B7A', marginTop: '2px' }}>
          {category?.name || 'Uncategorized'} •{' '}
          {new Date(transaction.dateISO).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Amount */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: transaction.type === 'credit' ? '#4CAF50' : '#5C4A3A',
          flexShrink: 0,
        }}
      >
        {transaction.type === 'credit' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
};
