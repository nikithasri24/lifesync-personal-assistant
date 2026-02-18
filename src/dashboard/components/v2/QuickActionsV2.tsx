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
    { icon: '✓', label: 'Add Task', onClick: onAddTask || (() => navigate('/todos')) },
    { icon: '📝', label: 'New Note', onClick: () => navigate('/notes') },
    { icon: '📔', label: 'Journal', onClick: () => navigate('/journal') },
    { icon: '⏱️', label: 'Focus', onClick: () => navigate('/focus') },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:border-terracotta-400 hover:bg-terracotta-50"
          style={{
            backgroundColor: colors.bg.white,
            borderColor: colors.border.light,
          }}
          aria-label={action.label}
        >
          <div className="text-2xl">{action.icon}</div>
          <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            {action.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsV2;
