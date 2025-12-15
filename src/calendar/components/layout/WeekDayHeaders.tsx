import React from 'react';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

interface WeekDayHeadersProps {
  weekDays: WeekDay[];
}

/**
 * Day headers row for week view showing day names and numbers
 */
export function WeekDayHeaders({ weekDays }: WeekDayHeadersProps): React.ReactElement {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex">
        <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className="flex-1 min-w-[140px] max-w-[140px] text-center py-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {day.dayName}
            </div>
            <div
              className={`text-2xl font-semibold mx-auto w-12 h-12 flex items-center justify-center rounded-full ${
                day.isToday ? 'bg-blue-500 text-white' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
