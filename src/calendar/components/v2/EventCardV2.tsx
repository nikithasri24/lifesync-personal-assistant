/**
 * EventCardV2 Component
 * Terracotta-themed event display card with color coding
 * Matches calendar-design-spec.html
 */

import React from 'react';
import type { CalendarEvent } from '@/services/types';
import type { Task } from '@/lib/supabase';
import type { ScheduleBlock } from '@/services/types';

interface EventCardV2Props {
  // Type can be 'event', 'task', 'habit', or 'block'
  type: 'event' | 'task' | 'habit' | 'block';
  item: CalendarEvent | Task | ScheduleBlock;
  timeLabel?: string;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export const EventCardV2: React.FC<EventCardV2Props> = ({
  type,
  item,
  timeLabel,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
  style = {},
  className = '',
}) => {
  // Color mapping based on type
  const getColorClasses = () => {
    switch (type) {
      case 'event':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/40',
          border: 'border-l-purple-500',
          text: 'text-purple-900 dark:text-purple-100',
        };
      case 'task':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          border: 'border-l-blue-500',
          text: 'text-blue-900 dark:text-blue-100',
        };
      case 'habit':
        return {
          bg: 'bg-green-100 dark:bg-green-900/40',
          border: 'border-l-green-500',
          text: 'text-green-900 dark:text-green-100',
        };
      case 'block':
        return {
          bg: 'bg-red-100 dark:bg-red-900/40',
          border: 'border-l-red-500',
          text: 'text-red-900 dark:text-red-100',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/40',
          border: 'border-l-gray-500',
          text: 'text-gray-900 dark:text-gray-100',
        };
    }
  };

  const colors = getColorClasses();

  // Get title from item
  const getTitle = (): string => {
    if ('title' in item && typeof item.title === 'string') return item.title;
    if ('name' in item && typeof item.name === 'string') return item.name;
    return 'Untitled';
  };

  const title = getTitle();

  const itemId = 'id' in item ? (item.id as string) : undefined;

  return (
    <div
      data-testid={type === 'event' ? 'event-card' : type === 'task' ? 'calendar-task-chip' : `${type}-card`}
      data-item-id={itemId}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart?.(e);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd?.(e);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={style}
      className={`
        px-2 py-1 rounded border-l-3 cursor-pointer
        hover:opacity-90 transition-opacity
        ${colors.bg} ${colors.border} ${colors.text}
        ${isDragging ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {/* Time label if provided */}
      {timeLabel && (
        <div className="text-[10px] font-semibold mb-0.5">
          {timeLabel}
        </div>
      )}

      {/* Title */}
      <div className="text-xs font-medium truncate">
        {title}
      </div>
    </div>
  );
};
