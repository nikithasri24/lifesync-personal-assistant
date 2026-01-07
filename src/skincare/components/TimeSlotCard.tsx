/**
 * TimeSlotCard - Displays AM or PM routine for a specific day
 * Shows completion status and product list
 */

import React from 'react';
import { Sun, Moon, Check, MoreVertical } from 'lucide-react';
import type { SkincareRoutine, SkincareProduct, SkincareLog } from '../types';

interface TimeSlotCardProps {
  timeSlot: 'AM' | 'PM';
  routine?: SkincareRoutine;
  products: SkincareProduct[];
  log?: SkincareLog;
  date: string;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  timeSlot,
  routine,
  products,
  log,
  date,
  onClick,
  onEdit,
  className = '',
}) => {
  const isCompleted = log?.completed ?? false;
  const isToday = date === new Date().toISOString().split('T')[0];

  // Get colors based on time slot
  const colors =
    timeSlot === 'AM'
      ? {
          icon: 'text-amber-600',
          bg: isCompleted ? 'bg-amber-50' : 'bg-white',
          border: isCompleted ? 'border-amber-300' : 'border-gray-200',
          badge: 'bg-amber-100 text-amber-700',
        }
      : {
          icon: 'text-indigo-600',
          bg: isCompleted ? 'bg-indigo-50' : 'bg-white',
          border: isCompleted ? 'border-indigo-300' : 'border-gray-200',
          badge: 'bg-indigo-100 text-indigo-700',
        };

  if (!routine || products.length === 0) {
    return (
      <div
        className={`${colors.bg} rounded-lg p-3 border ${colors.border} ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {timeSlot === 'AM' ? (
              <Sun className={`h-4 w-4 ${colors.icon}`} />
            ) : (
              <Moon className={`h-4 w-4 ${colors.icon}`} />
            )}
            <span className="text-xs font-medium text-gray-700">{timeSlot}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 italic">No routine</p>
      </div>
    );
  }

  return (
    <div
      className={`${colors.bg} rounded-lg p-3 border ${colors.border} cursor-pointer hover:shadow-md transition-all ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {timeSlot === 'AM' ? (
            <Sun className={`h-4 w-4 ${colors.icon}`} />
          ) : (
            <Moon className={`h-4 w-4 ${colors.icon}`} />
          )}
          <span className="text-xs font-medium text-gray-700">{timeSlot}</span>
          {isCompleted && (
            <div className="flex items-center gap-1 ml-1">
              <Check className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Done</span>
            </div>
          )}
        </div>

        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Edit routine"
          >
            <MoreVertical className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Product Count */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isCompleted
                ? 'bg-green-500 border-green-600'
                : 'border-gray-300 bg-white'
            }`}
          >
            {isCompleted && <Check className="h-3 w-3 text-white" />}
          </div>
          <span className="text-xs text-gray-600">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Show first 2 products */}
        {products.slice(0, 2).map((product) => (
          <p key={product.id} className="text-xs text-gray-500 truncate ml-6">
            {product.name}
          </p>
        ))}
        {products.length > 2 && (
          <p className="text-xs text-gray-400 italic ml-6">
            +{products.length - 2} more
          </p>
        )}
      </div>

      {/* Today indicator */}
      {isToday && !isCompleted && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className={`text-xs font-medium ${colors.badge} px-2 py-0.5 rounded`}>
            Today
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeSlotCard;
