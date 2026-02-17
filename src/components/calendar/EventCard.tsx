/**
 * EventCard Component
 * Displays a calendar event in the calendar grid
 * Supports both all-day and timed events with drag & drop
 */

import React from 'react';
import type { CalendarEvent } from '@/services/types';

interface EventCardProps {
  event: CalendarEvent;
  isAllDay?: boolean;
  isDragging?: boolean;
  timeLabel?: string;
  onDragStart?: (event: CalendarEvent, e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClick?: (event: CalendarEvent) => void;
  spanInfo?: {
    isFirst: boolean;
    isLast: boolean;
    position: number;
    totalDays: number;
  };
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isAllDay = false,
  isDragging = false,
  timeLabel,
  onDragStart,
  onDragEnd,
  onClick,
  spanInfo,
}) => {
  // Color mapping for event types
  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-purple-500 dark:bg-purple-600 border-purple-600 text-white';
      case 'event':
        return 'bg-teal-500 dark:bg-teal-600 border-teal-600 text-white';
      case 'reminder':
        return 'bg-amber-500 dark:bg-amber-600 border-amber-600 text-white';
      case 'birthday':
        return 'bg-pink-500 dark:bg-pink-600 border-pink-600 text-white';
      case 'holiday':
        return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 text-white';
      default:
        return 'bg-[#C18B5E] dark:bg-[#C18B5E] border-[#C18B5E] text-white';
    }
  };

  const colorClasses = getEventColor(event.type);
  const isMultiDay = spanInfo && spanInfo.totalDays > 1;

  // All-day event rendering
  if (isAllDay) {
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart?.(event, e);
        }}
        onDragEnd={(e) => onDragEnd?.(e)}
        onClick={() => onClick?.(event)}
        className={`
          text-[10px] px-1.5 py-0.5 truncate flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity
          ${colorClasses}
          ${spanInfo?.isFirst ? 'rounded-l' : ''}
          ${spanInfo?.isLast ? 'rounded-r' : ''}
          ${isDragging ? 'opacity-50' : ''}
        `}
        title={isMultiDay ? `${event.title} (Day ${spanInfo!.position + 1}/${spanInfo!.totalDays})` : event.title}
      >
        {spanInfo && !spanInfo.isFirst && <span className="text-[8px]">←</span>}
        <span className="truncate">{event.title}</span>
        {spanInfo && !spanInfo.isLast && <span className="text-[8px]">→</span>}
      </div>
    );
  }

  // Timed event rendering
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart?.(event, e);
      }}
      onDragEnd={(e) => onDragEnd?.(e)}
      onClick={() => onClick?.(event)}
      style={{ pointerEvents: 'auto' }}
      className={`
        text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity
        ${colorClasses}
        ${isDragging ? 'opacity-50' : ''}
      `}
      title={`${timeLabel || event.start_time || ''} - ${event.title}${event.location ? ` @ ${event.location}` : ''}`}
    >
      <div className="truncate">
        {timeLabel && <span className="font-medium">{timeLabel.replace(' ', '')}</span>}
        {event.start_time && !timeLabel && <span className="font-medium">{event.start_time}</span>}
        {' '}{event.title}
        {event.location && <span className="text-[9px] opacity-75"> @ {event.location}</span>}
      </div>
    </div>
  );
};
