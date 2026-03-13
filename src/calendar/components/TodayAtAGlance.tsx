/**
 * TodayAtAGlance
 * Collapsible summary card at the top of the Calendar page.
 * Shows today's events and due tasks in a simple timeline.
 * Data comes from the parent (Calendar.tsx) — no additional queries needed.
 */

import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CalendarEvent } from '@/services/types';

interface TodayTask {
  id?: string;
  title: string;
  due_date?: string | null;
  status?: string;
}

interface TodayAtAGlanceProps {
  events: CalendarEvent[];
  tasks: TodayTask[];
  onAddEvent?: () => void;
}

const STORAGE_KEY = 'calendar_today_glance_expanded';

interface TimelineItem {
  key: string;
  time: string | null;
  sortMinute: number;
  emoji: string;
  label: string;
  subtitle?: string;
  color: string;
}

function formatTime(event: CalendarEvent): string | null {
  if (event.all_day) return null;
  if (event.start_time) {
    const [h, m] = event.start_time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
  }
  try {
    return format(new Date(event.start_date.replace('Z', '')), 'h:mm a');
  } catch {
    return null;
  }
}

function timeToMinutes(event: CalendarEvent): number {
  if (event.all_day) return 24 * 60; // all-day events sort last
  if (event.start_time) {
    const [h, m] = event.start_time.split(':').map(Number);
    return h * 60 + m;
  }
  try {
    const d = new Date(event.start_date.replace('Z', ''));
    return d.getHours() * 60 + d.getMinutes();
  } catch {
    return 24 * 60;
  }
}

const EVENT_COLORS: Record<string, string> = {
  event: '#4F46E5',
  meeting: '#3B82F6',
  reminder: '#F59E0B',
  birthday: '#EC4899',
  holiday: '#10B981',
};

export const TodayAtAGlance: React.FC<TodayAtAGlanceProps> = ({
  events,
  tasks,
  onAddEvent,
}) => {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(isExpanded)); } catch { /* ignore */ }
  }, [isExpanded]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayEvents = events.filter((e) => {
    const dateStr = e.start_date.replace('Z', '').substring(0, 10);
    return dateStr === todayStr;
  });

  const todayTasks = tasks.filter(
    (t) => t.due_date?.substring(0, 10) === todayStr && t.status !== 'done'
  );

  const totalItems = todayEvents.length + todayTasks.length;

  // Build unified timeline items
  const items: TimelineItem[] = [
    ...todayEvents.map((e): TimelineItem => ({
      key: `event-${e.id}`,
      time: formatTime(e),
      sortMinute: timeToMinutes(e),
      emoji: e.all_day ? '📅' : '🗓️',
      label: e.title,
      color: EVENT_COLORS[e.type ?? 'event'] ?? EVENT_COLORS.event,
    })),
    ...todayTasks.map((t): TimelineItem => ({
      key: `task-${t.id}`,
      time: null,
      sortMinute: 25 * 60, // tasks sort after timed events
      emoji: '✅',
      label: t.title,
      color: '#6B7280',
    })),
  ].sort((a, b) => a.sortMinute - b.sortMinute);

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{ backgroundColor: colors.bg.white, border: `1px solid ${colors.border.light}` }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
        aria-label={isExpanded ? 'Collapse today summary' : 'Expand today summary'}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: colors.text.primary }}>
            Today at a Glance
          </span>
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            {format(new Date(), 'EEE, MMM d')}
          </span>
          {totalItems > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
            >
              {totalItems}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.tertiary }} />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.tertiary }} />
        )}
      </button>

      {isExpanded && (
        <div style={{ borderTop: `1px solid ${colors.border.light}` }}>
          {totalItems === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Nothing scheduled today
              </p>
              <p className="text-xs mb-3" style={{ color: colors.text.tertiary }}>
                Your calendar is clear — enjoy the day!
              </p>
              {onAddEvent && (
                <button
                  type="button"
                  onClick={onAddEvent}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
                  aria-label="Add event"
                >
                  + Add Event
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 space-y-0">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: `1px solid ${colors.border.light}` }}
                >
                  <span
                    className="text-xs font-medium w-16 flex-shrink-0 mt-0.5"
                    style={{ color: colors.text.tertiary }}
                  >
                    {item.time ?? 'All day'}
                  </span>
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  <span
                    className="text-sm font-medium flex-1 min-w-0"
                    style={{ color: colors.text.primary }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TodayAtAGlance;
