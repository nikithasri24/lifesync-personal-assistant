/**
 * TaskCardV2 Component
 * Self care task card with left border, title, status badge, and action button
 * Matches selfcare-design-spec.html exactly
 */

import React from 'react';

type TaskStatus = 'due' | 'upcoming' | 'completed';

interface TaskCardV2Props {
  id: string;
  title: string;
  emoji: string;
  status: TaskStatus;
  dueDate: string; // e.g., "Today", "Tomorrow", "In 3 days"
  categoryName?: string;
  onComplete?: () => void;
  onClick?: () => void;
}

export const TaskCardV2: React.FC<TaskCardV2Props> = ({
  id,
  title,
  emoji,
  status,
  dueDate,
  categoryName,
  onComplete,
  onClick,
}) => {
  const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
      case 'due':
        return { background: '#FFE8CC', color: '#EA580C', label: 'DUE' };
      case 'upcoming':
        return { background: '#D1FAE5', color: '#059669', label: 'UPCOMING' };
      case 'completed':
        return { background: '#E9D5FF', color: '#9333EA', label: 'COMPLETED' };
    }
  };

  const statusStyle = getStatusStyles(status);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        borderLeft: '4px solid #D4A574',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '700',
            color: '#5C4A3A',
          }}
        >
          <span style={{ fontSize: '20px' }}>{emoji}</span>
          <span>{title}</span>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            background: statusStyle.background,
            color: statusStyle.color,
          }}
        >
          {statusStyle.label}
        </div>
      </div>

      {/* Meta */}
      <div
        style={{
          fontSize: '12px',
          color: '#9B8B7A',
          marginBottom: '8px',
        }}
      >
        {dueDate}
        {categoryName && ` • ${categoryName}`}
      </div>

      {/* Action Button */}
      {status !== 'completed' && onComplete && (
        <button
          onClick={onComplete}
          className="w-full transition-all hover:opacity-90"
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {status === 'due' ? 'Complete Now' : 'Mark as Done'}
        </button>
      )}
    </div>
  );
};
