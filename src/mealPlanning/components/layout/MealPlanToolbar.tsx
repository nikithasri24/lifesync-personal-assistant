import React from 'react';
import DatePickerPopover from '../../../components/DatePickerPopover';

interface MealPlanToolbarProps {
  currentWeekStart: Date;
  weekStartsOn: 0 | 1;
  onWeekChange: (date: Date) => void;
  onPreviousWeek: () => void;
  onThisWeek: () => void;
  onNextWeek: () => void;
  onCopyWeek: () => void;
  onShowGroceryList: () => void;
}

/**
 * Toolbar with week navigation and action buttons
 */
export const MealPlanToolbar: React.FC<MealPlanToolbarProps> = ({
  currentWeekStart,
  weekStartsOn,
  onWeekChange,
  onPreviousWeek,
  onThisWeek,
  onNextWeek,
  onCopyWeek,
  onShowGroceryList,
}) => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Meal planning</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Plan your week, import recipes, and keep dinner decisions simple.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DatePickerPopover
          value={currentWeekStart}
          onChange={onWeekChange}
          weekStartsOn={weekStartsOn}
        />
        <button
          type="button"
          onClick={onPreviousWeek}
          className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>
        <button
          type="button"
          onClick={onThisWeek}
          className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <span className="hidden sm:inline">This week</span>
          <span className="sm:hidden">Today</span>
        </button>
        <button
          type="button"
          onClick={onNextWeek}
          className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onCopyWeek}
          className="rounded-full border border-[#E5B88A] bg-[#F5EBE0] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#8B6F47] transition hover:bg-[#F9F3ED]"
          title="Copy this week's meals to another week"
        >
          <span className="hidden sm:inline">Copy Week</span>
          <span className="sm:hidden">Copy</span>
        </button>
        <button
          type="button"
          onClick={onShowGroceryList}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          title="Generate grocery list from recipes"
        >
          <span className="hidden sm:inline">Grocery List</span>
          <span className="sm:hidden">List</span>
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          title="Print weekly plan"
        >
          Print
        </button>
      </div>
    </header>
  );
};
