/**
 * CalendarHeader - Header bar for calendar with navigation and view controls
 */

import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import type { CalendarView, WeekDay } from '../hooks/useCalendarState';
import { OwnerFilter, type OwnerFilterValue } from '../../components/common/OwnerFilter';

interface CalendarHeaderProps {
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

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
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
  const dateDisplay = view === 'day'
    ? format(currentDate, 'EEEE, MMMM d, yyyy')
    : format(view === 'week' ? weekDays[0]?.date || currentDate : currentDate, 'MMMM yyyy');

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <button
          onClick={onToday}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Today
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={onNext}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {dateDisplay}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Owner Filter */}
        {showOwnerFilter && ownerFilter && onOwnerFilterChange && (
          <OwnerFilter
            value={ownerFilter}
            onChange={onOwnerFilterChange}
            partnerName={partnerName}
          />
        )}

        {/* View selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onViewChange('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              view === 'day'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              view === 'week'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              view === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Month
          </button>
        </div>

        {/* New Event + Block Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewBlock}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Block
          </button>
          <button
            onClick={onNewEvent}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <CalendarIcon className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>
    </div>
  );
};
