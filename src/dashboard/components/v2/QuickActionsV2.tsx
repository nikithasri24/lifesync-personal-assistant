/**
 * QuickActionsV2 Component
 * 2x2 grid of quick action buttons
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '@/hooks/useThemeColors';

interface QuickActionsV2Props {
  onAddTask?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({ onAddTask }) => {
  const colors = useThemeColors();
  const navigate = useNavigate();

  const actions = [
    { icon: '➕', label: 'Add Task', onClick: onAddTask || (() => navigate('/todos')), primary: true },
    { icon: '📝', label: 'New Note', onClick: () => navigate('/notes'), primary: false },
    { icon: '📔', label: 'Journal', onClick: () => navigate('/journal'), primary: false },
    { icon: '⏱️', label: 'Focus', onClick: () => navigate('/focus'), primary: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
            action.primary
              ? 'shadow-md hover:shadow-lg'
              : 'border hover:border-terracotta-300 hover:bg-gray-50'
          }`}
          style={{
            backgroundColor: action.primary
              ? 'transparent'
              : colors.bg.white,
            background: action.primary
              ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)'
              : undefined,
            borderColor: action.primary ? undefined : colors.border.light,
          }}
          aria-label={action.label}
        >
          <div className="text-2xl">{action.icon}</div>
          <div
            className="text-sm font-semibold"
            style={{ color: action.primary ? '#FFFFFF' : colors.text.primary }}
          >
            {action.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsV2;
