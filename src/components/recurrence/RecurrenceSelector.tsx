/**
 * RecurrenceSelector Component
 * UI for selecting task recurrence pattern (daily, weekly, monthly, etc.)
 */

import React, { useState } from 'react';
import { Repeat, Calendar, ChevronDown, X } from 'lucide-react';

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number;
  days: number[]; // For weekly: 0-6 (Sun-Sat), for monthly: 1-31
  endDate?: string;
  count?: number;
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];

const PATTERN_LABELS: Record<RecurrencePattern, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [showDetails, setShowDetails] = useState(value.pattern !== 'none');

  const handlePatternChange = (pattern: RecurrencePattern) => {
    const newConfig: RecurrenceConfig = {
      ...value,
      pattern,
      interval: pattern === 'none' ? 1 : value.interval || 1,
      days: pattern === 'weekly' ? (value.days.length > 0 ? value.days : [1]) : [], // Default to Monday
    };
    onChange(newConfig);
    setShowDetails(pattern !== 'none');
  };

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const toggleDay = (day: number) => {
    const newDays = value.days.includes(day)
      ? value.days.filter(d => d !== day)
      : [...value.days, day].sort((a, b) => a - b);
    onChange({ ...value, days: newDays.length > 0 ? newDays : [day] }); // Keep at least one day
  };

  const getRecurrenceLabel = () => {
    if (value.pattern === 'none') return 'Does not repeat';
    
    const intervalStr = value.interval > 1 ? `Every ${value.interval} ` : 'Every ';
    const unitMap: Record<string, string> = {
      daily: value.interval > 1 ? 'days' : 'day',
      weekly: value.interval > 1 ? 'weeks' : 'week',
      monthly: value.interval > 1 ? 'months' : 'month',
      yearly: value.interval > 1 ? 'years' : 'year',
    };

    if (value.pattern === 'weekly' && value.days.length > 0) {
      const dayLabels = value.days.map(d => DAYS_OF_WEEK[d]?.label).join(', ');
      return `${intervalStr}${unitMap[value.pattern]} on ${dayLabels}`;
    }

    return `${intervalStr}${unitMap[value.pattern] || value.pattern}`;
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Repeat className="w-4 h-4" />
        Repeat
      </label>

      {/* Pattern Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PATTERN_LABELS) as RecurrencePattern[])
          .filter(p => p !== 'custom') // Hide custom for now
          .map(pattern => (
            <button
              key={pattern}
              type="button"
              disabled={disabled}
              onClick={() => handlePatternChange(pattern)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                value.pattern === pattern
                  ? 'bg-[#F5EBE0] dark:bg-[#8B6F47]/40 border-[#D4A574] text-[#8B6F47] dark:text-[#E5B88A]'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-[#E5B88A]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {PATTERN_LABELS[pattern]}
            </button>
          ))}
      </div>

      {/* Details Panel */}
      {showDetails && value.pattern !== 'none' && (
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
          {/* Interval */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Every</span>
            <input
              type="number"
              min={1}
              max={99}
              value={value.interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded 
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {value.pattern === 'daily' && (value.interval > 1 ? 'days' : 'day')}
              {value.pattern === 'weekly' && (value.interval > 1 ? 'weeks' : 'week')}
              {value.pattern === 'monthly' && (value.interval > 1 ? 'months' : 'month')}
              {value.pattern === 'yearly' && (value.interval > 1 ? 'years' : 'year')}
            </span>
          </div>

          {/* Weekly: Day Selector */}
          {value.pattern === 'weekly' && (
            <div className="space-y-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">On days:</span>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleDay(day.value)}
                    className={`w-8 h-8 text-xs font-medium rounded-full transition-colors ${
                      value.days.includes(day.value)
                        ? 'bg-[#C18B5E] text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                    title={day.label}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurrenceSelector;

