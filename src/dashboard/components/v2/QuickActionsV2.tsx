/**
 * QuickActionsV2 Component
 * 2x2 grid of quick action buttons
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '@/hooks/useThemeColors';

interface QuickActionsV2Props {
  onAddTask?: () => void;
  onAddNote?: () => void;
  onAddJournal?: () => void;
  onStartFocus?: () => void;
  onLogHabit?: () => void;
  onLogMeal?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({
  onAddTask,
  onAddNote,
  onAddJournal,
  onStartFocus,
  onLogHabit,
  onLogMeal,
}) => {
  const colors = useThemeColors();
  const navigate = useNavigate();

  const actions = [
    { icon: '➕', label: 'Add Task', onClick: onAddTask || (() => navigate('/todos')), primary: true },
    { icon: '📝', label: 'New Note', onClick: onAddNote || (() => navigate('/notes')), primary: false },
    { icon: '📔', label: 'Journal', onClick: onAddJournal || (() => navigate('/journal')), primary: false },
    { icon: '⏱️', label: 'Focus', onClick: onStartFocus || (() => navigate('/focus')), primary: false },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
              action.primary
                ? 'shadow-md hover:shadow-lg hover:scale-105'
                : 'border-2 shadow-sm hover:shadow-md hover:scale-105'
            }`}
            style={{
              backgroundColor: action.primary
                ? 'transparent'
                : colors.bg.white,
              background: action.primary
                ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)'
                : undefined,
              borderColor: action.primary ? undefined : colors.border.medium,
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

      {/* Log Habit + Log Meal — full-width row */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onLogHabit || (() => navigate('/habits'))}
          className="px-4 py-3 rounded-xl border-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: colors.bg.white, borderColor: colors.border.medium }}
          aria-label="Log habit"
        >
          <span className="text-xl">🎯</span>
          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>Log Habit</span>
        </button>
        <button
          onClick={onLogMeal || (() => navigate('/meals'))}
          className="px-4 py-3 rounded-xl border-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: colors.bg.white, borderColor: colors.border.medium }}
          aria-label="Log meal"
        >
          <span className="text-xl">🍽️</span>
          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>Log Meal</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsV2;
