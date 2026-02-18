/**
 * WeekNavigatorV2 Component
 * Week navigation controls with previous/next/today buttons
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';

interface WeekNavigatorV2Props {
  currentDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export const WeekNavigatorV2: React.FC<WeekNavigatorV2Props> = ({
  currentDate,
  onPreviousWeek,
  onNextWeek,
  onToday,
}) => {
  const colors = useThemeColors();
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  return (
    <div className="mb-6 flex items-center justify-between">
      {/* Week Range Display */}
      <div>
        <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex gap-2">
        <button
          onClick={onPreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: colors.text.secondary }} />
        </button>
        <button
          onClick={onToday}
          className="px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#C18B5E',
            color: '#C18B5E',
          }}
        >
          Today
        </button>
        <button
          onClick={onNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" style={{ color: colors.text.secondary }} />
        </button>
      </div>
    </div>
  );
};

export default WeekNavigatorV2;
