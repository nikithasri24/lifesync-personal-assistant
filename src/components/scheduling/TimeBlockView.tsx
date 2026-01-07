/**
 * TimeBlockView - Visual timeline for time blocking
 * Shows the day as a timeline with draggable time blocks
 */

import React, { useState, useRef, useCallback } from 'react';
import { format, addMinutes, setHours, setMinutes, startOfDay, differenceInMinutes } from 'date-fns';
import { Clock, Zap, Battery, BatteryLow, GripVertical, X } from 'lucide-react';
import { useDaySchedule, useScheduleFreeSlots, useSchedulingPreferences } from '../../hooks/useSchedulingQuery';
import { getEnergyLevel, DEFAULT_SCHEDULING_PREFS } from '../../services/scheduling';
import type { EnergyLevel, TimeSlot } from '../../services/scheduling';

interface TimeBlock {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'event' | 'task' | 'scheduled';
  color?: string;
}

interface TimeBlockViewProps {
  date: Date;
  blocks?: TimeBlock[];
  onBlockMove?: (blockId: string, newStart: Date, newEnd: Date) => void;
  onBlockRemove?: (blockId: string) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  startHour?: number;
  endHour?: number;
  className?: string;
}

const HOUR_HEIGHT = 60; // pixels per hour
const MIN_BLOCK_MINUTES = 15;

const energyColors: Record<EnergyLevel, string> = {
  peak: 'bg-yellow-100 dark:bg-yellow-900/30',
  moderate: 'bg-blue-50 dark:bg-blue-900/20',
  low: 'bg-gray-100 dark:bg-gray-800/50',
};

const energyIcons: Record<EnergyLevel, React.ReactNode> = {
  peak: <Zap className="w-3 h-3 text-yellow-500" />,
  moderate: <Battery className="w-3 h-3 text-blue-500" />,
  low: <BatteryLow className="w-3 h-3 text-gray-400" />,
};

export function TimeBlockView({
  date,
  blocks = [],
  onBlockMove,
  onBlockRemove,
  onSlotClick,
  startHour = 6,
  endHour = 22,
  className = '',
}: TimeBlockViewProps) {
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();
  const { data: freeSlots = [] } = useScheduleFreeSlots(date, 15);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [hoverTime, setHoverTime] = useState<Date | null>(null);

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  // Convert time to Y position
  const timeToY = useCallback((time: Date): number => {
    const dayStart = setMinutes(setHours(startOfDay(date), startHour), 0);
    const minutes = differenceInMinutes(time, dayStart);
    return (minutes / 60) * HOUR_HEIGHT;
  }, [date, startHour]);

  // Convert Y position to time
  const yToTime = useCallback((y: number): Date => {
    const dayStart = setMinutes(setHours(startOfDay(date), startHour), 0);
    const minutes = Math.round((y / HOUR_HEIGHT) * 60 / MIN_BLOCK_MINUTES) * MIN_BLOCK_MINUTES;
    return addMinutes(dayStart, minutes);
  }, [date, startHour]);

  // Handle mouse move for hover time
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setHoverTime(yToTime(y));
  }, [yToTime]);

  // Handle click on timeline
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const start = yToTime(y);
    const end = addMinutes(start, 30);
    onSlotClick(start, end);
  }, [onSlotClick, yToTime]);

  // Get energy level for an hour
  const getHourEnergy = useCallback((hour: number): EnergyLevel => {
    const time = setHours(date, hour);
    return getEnergyLevel(time, prefs);
  }, [date, prefs]);

  // Check if a slot is free
  const isSlotFree = useCallback((hour: number): boolean => {
    const slotStart = setMinutes(setHours(startOfDay(date), hour), 0);
    return freeSlots.some(slot => 
      slot.start <= slotStart && slot.end > slotStart
    );
  }, [date, freeSlots]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900 dark:text-white">
          {format(date, 'EEEE, MMMM d')}
        </span>
        {hoverTime && (
          <span className="ml-auto text-sm text-gray-500">
            {format(hoverTime, 'h:mm a')}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="flex overflow-y-auto max-h-[500px]">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          {hours.map(hour => (
            <div
              key={hour}
              className="h-[60px] px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/50"
            >
              {format(setHours(date, hour), 'h a')}
            </div>
          ))}
        </div>

        {/* Timeline area */}
        <div
          ref={timelineRef}
          className="flex-1 relative cursor-crosshair"
          style={{ height: totalHeight }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onClick={handleTimelineClick}
        >
          {/* Hour rows with energy background */}
          {hours.map(hour => {
            const energy = getHourEnergy(hour);
            const isFree = isSlotFree(hour);
            return (
              <div
                key={hour}
                className={`h-[60px] border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-end pr-2 ${energyColors[energy]}`}
              >
                {energyIcons[energy]}
                {isFree && (
                  <span className="ml-1 text-[10px] text-green-600 dark:text-green-400 font-medium">FREE</span>
                )}
              </div>
            );
          })}

          {/* Existing blocks */}
          {blocks.map(block => {
            const top = timeToY(block.start);
            const height = Math.max(
              (differenceInMinutes(block.end, block.start) / 60) * HOUR_HEIGHT,
              20
            );
            const isBeingDragged = draggingBlock === block.id;

            return (
              <div
                key={block.id}
                className={`absolute left-1 right-1 rounded-lg shadow-sm border-l-4 px-2 py-1 cursor-move transition-shadow ${
                  isBeingDragged ? 'shadow-lg z-20 opacity-75' : 'hover:shadow-md z-10'
                } ${
                  block.type === 'event'
                    ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500'
                    : block.type === 'task'
                    ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-500'
                    : 'bg-green-100 dark:bg-green-900/50 border-green-500'
                }`}
                style={{ top: `${top}px`, height: `${height}px` }}
                draggable
                onDragStart={(e) => {
                  setDraggingBlock(block.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragOffset(e.clientY - rect.top);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => setDraggingBlock(null)}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {block.title}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {format(block.start, 'h:mm')} - {format(block.end, 'h:mm a')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <GripVertical className="w-3 h-3 text-gray-400" />
                    {onBlockRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockRemove(block.id);
                        }}
                        className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Hover indicator */}
          {hoverTime && !draggingBlock && (
            <div
              className="absolute left-1 right-1 h-0.5 bg-purple-500 pointer-events-none z-30"
              style={{ top: `${timeToY(hoverTime)}px` }}
            >
              <div className="absolute -top-3 -left-1 bg-purple-500 text-white text-[10px] px-1 rounded">
                {format(hoverTime, 'h:mm a')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span>Peak</span>
        </div>
        <div className="flex items-center gap-1">
          <Battery className="w-3 h-3 text-blue-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <BatteryLow className="w-3 h-3 text-gray-400" />
          <span>Low</span>
        </div>
        <div className="ml-auto text-gray-400">Click to schedule</div>
      </div>
    </div>
  );
}

export default TimeBlockView;

