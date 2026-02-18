/**
 * BudgetCardV2 Component
 * Display budget cards with progress bars and status
 */

import React from 'react';

interface Budget {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
}

interface Category {
  name: string;
  icon?: string;
  color?: string;
}

interface BudgetCardV2Props {
  budget: Budget;
  spent: number;
  category: Category;
  onClick: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const BudgetCardV2: React.FC<BudgetCardV2Props> = ({
  budget,
  spent,
  category,
  onClick,
}) => {
  const percentage = Math.min((spent / budget.limit) * 100, 100);
  const isOverBudget = spent > budget.limit;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
        borderLeft: `4px solid ${isOverBudget ? '#F44336' : category.color || '#D4A574'}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{category.icon || '📦'}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
              {category.name}
            </div>
            <div style={{ fontSize: '12px', color: '#9B8B7A' }}>{budget.month}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: isOverBudget ? '#F44336' : '#5C4A3A',
            }}
          >
            {formatCurrency(spent)}
          </div>
          <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
            of {formatCurrency(budget.limit)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          background: '#E8DCC8',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: isOverBudget
              ? 'linear-gradient(90deg, #F44336 0%, #D32F2F 100%)'
              : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Status */}
      <div
        style={{
          fontSize: '12px',
          color: isOverBudget ? '#F44336' : '#4CAF50',
          fontWeight: 600,
          marginTop: '8px',
        }}
      >
        {isOverBudget
          ? `Over by ${formatCurrency(spent - budget.limit)}`
          : `${formatCurrency(budget.limit - spent)} remaining`}
      </div>
    </div>
  );
};
