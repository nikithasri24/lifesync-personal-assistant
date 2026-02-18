/**
 * ViewSelectorV2 Component
 * View selector for Tasks with primary and advanced views
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export type TaskView = 'today' | 'inbox' | 'upcoming' | 'list' | 'kanban' | 'matrix';

export interface ViewSelectorV2Props {
  activeView: TaskView;
  onChange: (view: TaskView) => void;
}

export const ViewSelectorV2: React.FC<ViewSelectorV2Props> = ({
  activeView,
  onChange,
}) => {
  const colors = useThemeColors();

  const primaryViews: { value: TaskView; label: string }[] = [
    { value: 'today', label: '📅 Today' },
    { value: 'inbox', label: '📥 Inbox' },
    { value: 'upcoming', label: '🗓️ Upcoming' },
  ];

  const advancedViews: { value: TaskView; label: string }[] = [
    { value: 'list', label: '📋 List' },
    { value: 'kanban', label: '📊 Kanban' },
    { value: 'matrix', label: '🎯 Matrix' },
  ];

  return (
    <div className="mb-6">
      {/* Primary Views - Segmented Control Style */}
      <div className="mb-3 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
        {primaryViews.map((view) => (
          <button
            key={view.value}
            onClick={() => onChange(view.value)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeView === view.value ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: activeView === view.value ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label={`${view.label} view`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Advanced Views - Pill Buttons */}
      <div className="flex gap-2 flex-wrap">
        {advancedViews.map((view) => (
          <button
            key={view.value}
            onClick={() => onChange(view.value)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeView === view.value
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                : colors.bg.secondary,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: activeView === view.value ? '#C18B5E' : 'transparent',
              color: activeView === view.value ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label={`${view.label} view`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewSelectorV2;
