/**
 * CalendarHeaderV2 Component
 * Terracotta-themed header for calendar with view toggle and navigation
 * Matches calendar-design-spec.html
 */

import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import type { CalendarView, WeekDay } from '../../hooks/useCalendarState';

interface CalendarHeaderV2Props {
  currentDate: Date;
  view: CalendarView;
  weekDays: WeekDay[];
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarView) => void;
  onNewEvent: () => void;
  onNewBlock: () => void;
  ownerFilter?: OwnerFilterValue;
  onOwnerFilterChange?: (value: OwnerFilterValue) => void;
  partnerName?: string;
  showOwnerFilter?: boolean;
}

export const CalendarHeaderV2: React.FC<CalendarHeaderV2Props> = ({
  currentDate,
  view,
  weekDays,
  onToday,
  onPrevious,
  onNext,
  onViewChange,
  onNewEvent,
  onNewBlock,
  ownerFilter,
  onOwnerFilterChange,
  partnerName,
  showOwnerFilter = false,
}) => {
  const colors = useThemeColors();

  // Date display logic
  const dateDisplay = view === 'day'
    ? format(currentDate, 'EEEE, MMM d')
    : view === 'week'
    ? format(currentDate, 'MMMM yyyy')
    : format(currentDate, 'MMMM yyyy');

  // View segments for SegmentedControlV2
  const viewSegments = [
    { value: 'month' as CalendarView, label: 'Month' },
    { value: 'week' as CalendarView, label: 'Week' },
    { value: 'day' as CalendarView, label: 'Day' },
  ];

  return (
    <div
      className="px-5 py-4"
      style={{
        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
      }}
    >
      {/* First Row: Title and View Toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-white" />
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
        </div>

        {/* View Toggle */}
        <SegmentedControlV2
          segments={viewSegments}
          value={view}
          onChange={onViewChange}
          size="sm"
          className="bg-white/20"
          aria-label="Calendar view selector"
        />
      </div>

      {/* Second Row: Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label={`Previous ${view}`}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="text-white text-base font-semibold min-w-[140px] text-center">
            {dateDisplay}
          </div>

          <button
            onClick={onNext}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label={`Next ${view}`}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Today Button */}
          <button
            onClick={onToday}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Go to today"
          >
            Today
          </button>

          {/* Owner Filter (if merged mode) */}
          {showOwnerFilter && ownerFilter && onOwnerFilterChange && (
            <OwnerFilter
              value={ownerFilter}
              onChange={onOwnerFilterChange}
              partnerName={partnerName}
            />
          )}

          {/* Action Buttons */}
          <button
            onClick={onNewBlock}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
            aria-label="Create new schedule block"
          >
            <Plus className="w-4 h-4" />
            Block
          </button>

          <button
            onClick={onNewEvent}
            className="px-3 py-2 bg-white hover:bg-white/90 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
            style={{ color: colors.accent.end }}
            aria-label="Create new event"
          >
            <Plus className="w-4 h-4" />
            Event
          </button>
        </div>
      </div>
    </div>
  );
};
