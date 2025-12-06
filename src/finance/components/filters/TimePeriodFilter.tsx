/**
 * TimePeriodFilter Component
 *
 * Dropdown filter for selecting time periods in financial reports.
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { getTimePeriodOptions, type TimePeriod } from '../../utils/timePeriodUtils';

export interface TimePeriodFilterProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  label?: string;
  className?: string;
}

const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({
  value,
  onChange,
  label = 'Time Period',
  className = '',
}) => {
  const options = getTimePeriodOptions();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-primary flex items-center gap-1">
        <Calendar className="h-4 w-4" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimePeriod)}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-primary shadow-sm hover:bg-slate-50 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimePeriodFilter;
