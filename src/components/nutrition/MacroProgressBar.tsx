/**
 * Macro Progress Bar Component
 * Visual progress indicator for calories and macros
 */

import React from 'react';

interface MacroProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon?: React.ReactNode;
}

export function MacroProgressBar({
  label,
  current,
  target,
  unit,
  color,
  icon,
}: MacroProgressBarProps): React.ReactElement {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOver = current > target;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? 'bg-red-500' : ''
          }`}
          style={{
            width: `${percentage}%`,
            backgroundColor: isOver ? undefined : color,
          }}
        />
      </div>
    </div>
  );
}

