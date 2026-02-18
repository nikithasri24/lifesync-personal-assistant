/**
 * CalendarPageHeaderV2 Component
 * Calendar header with terracotta gradient and view toggle
 */

import React from 'react';

interface CalendarPageHeaderV2Props {
  currentView: 'month' | 'week' | 'day';
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  currentMonth: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarPageHeaderV2: React.FC<CalendarPageHeaderV2Props> = ({
  currentView,
  onViewChange,
  currentMonth,
  onPrevious,
  onNext,
  onToday,
}) => {
  return (
    <div
      className="px-5 py-4"
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
      }}
    >
      {/* Title and View Toggle */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-white">📅 Calendar</h1>

        {/* View Toggle */}
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          {(['month', 'week', 'day'] as const).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentView === view ? 'bg-white' : ''
              }`}
              style={{
                color: currentView === view ? '#D4A574' : 'white',
              }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Previous"
        >
          <span className="text-white text-lg">‹</span>
        </button>

        <div className="text-white text-base font-semibold">{currentMonth}</div>

        <button
          onClick={onNext}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Next"
        >
          <span className="text-white text-lg">›</span>
        </button>
      </div>

      {/* Today Button */}
      <button
        onClick={onToday}
        className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
      >
        Today
      </button>
    </div>
  );
};

export default CalendarPageHeaderV2;
