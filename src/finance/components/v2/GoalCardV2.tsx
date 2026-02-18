/**
 * GoalCardV2 Component
 * Display financial goal cards with progress tracking
 */

import React from 'react';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
}

interface GoalCardV2Props {
  goal: Goal;
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

const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    vacation: '✈️',
    home: '🏠',
    car: '🚗',
    education: '🎓',
    emergency: '🛟',
    retirement: '🌴',
    investment: '📈',
    other: '🎯',
  };
  return icons[category?.toLowerCase() || 'other'] || '🎯';
};

export const GoalCardV2: React.FC<GoalCardV2Props> = ({ goal, onClick }) => {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = goal.targetAmount - goal.currentAmount;

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
        borderLeft: '4px solid #D4A574',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>{getCategoryIcon(goal.category)}</span>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
              {goal.name}
            </div>
          </div>
          {goal.deadline && (
            <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
              Target: {new Date(goal.deadline).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '2px' }}>Saved</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#4CAF50' }}>
            {formatCurrency(goal.currentAmount)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '2px' }}>Target</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#5C4A3A' }}>
            {formatCurrency(goal.targetAmount)}
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
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50 0%, #388E3C 100%)',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#4CAF50' }}>
          {Math.round(percentage)}% Complete
        </div>
        {remaining > 0 && (
          <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
            {formatCurrency(remaining)} to go
          </div>
        )}
      </div>
    </div>
  );
};
