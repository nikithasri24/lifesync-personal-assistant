/**
 * QuickActionsV2 Component
 * 2x2 grid of quick action buttons
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsV2Props {
  onAddTask?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({ onAddTask }) => {
  const navigate = useNavigate();

  const actions = [
    { icon: '✓', label: 'Add Task', onClick: onAddTask || (() => navigate('/todos')) },
    { icon: '📝', label: 'New Note', onClick: () => navigate('/notes') },
    { icon: '📔', label: 'Journal', onClick: () => navigate('/journal') },
    { icon: '⏱️', label: 'Focus', onClick: () => navigate('/focus') },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="bg-white border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:border-[#D4A574] hover:bg-[#FEF3E8]"
          aria-label={action.label}
        >
          <div className="text-2xl">{action.icon}</div>
          <div className="text-sm font-semibold text-gray-700">{action.label}</div>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsV2;
