/**
 * ViewSelectorV2 Component
 * View selector for Tasks with primary and advanced views
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export type TaskView = 'today' | 'inbox' | 'upcoming' | 'list';

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
    { value: 'list', label: '📋 List' },
  ];

  return (
    <div className="mb-6">
      {/* View Selector - Segmented Control Style */}
      <div className="p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
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
    </div>
  );
};

export default ViewSelectorV2;
