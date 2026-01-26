/**
 * Calendar View Component
 * Month-view calendar for scheduling one personal care item per day
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, SkipForward, X } from 'lucide-react';
import { useMonthSchedule, useScheduleItem, useUpdateScheduleStatus, useRemoveScheduledItem } from '@/hooks/usePersonalCareQuery';
import type { PersonalCareItem, PersonalCareScheduleWithItem, ScheduleStatus } from '../personalCareTypes';

interface CalendarViewProps {
  items: PersonalCareItem[];
  getCategoryInfo: (categoryId: string) => { name: string; icon: string; color?: string } | undefined;
}

export function CalendarView({ items, getCategoryInfo }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: scheduleData = [], isLoading } = useMonthSchedule(year, month);
  const scheduleItemMutation = useScheduleItem();
  const updateStatusMutation = useUpdateScheduleStatus();
  const removeItemMutation = useRemoveScheduledItem();

  // Create a map of date -> schedule entries (multiple items per day)
  const scheduleMap = useMemo(() => {
    const map = new Map<string, PersonalCareScheduleWithItem[]>();
    scheduleData.forEach(entry => {
      const existing = map.get(entry.scheduledDate) || [];
      map.set(entry.scheduledDate, [...existing, entry]);
    });
    return map;
  }, [scheduleData]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const formatDateKey = (day: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(day);
    setSelectedDate(dateKey);
    setShowItemPicker(true);
  };

  const handleSelectItem = async (itemId: string) => {
    if (!selectedDate) return;
    await scheduleItemMutation.mutateAsync({ itemId, scheduledDate: selectedDate });
    setShowItemPicker(false);
    setSelectedDate(null);
  };

  const handleUpdateStatus = async (scheduleId: string, status: ScheduleStatus) => {
    await updateStatusMutation.mutateAsync({ scheduleId, status });
  };

  // handleRemoveItem is now called directly via removeItemMutation.mutate(scheduleId)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get only active items for the picker
  const activeItems = items.filter(item => item.isActive);

  // Categorize items into "Ready" and "Recently Done" based on selected date
  // Use schedule data to find completed items (since lastCompletedAt on item may not be updated)
  const categorizedItems = useMemo(() => {
    // Use selected date if available, otherwise use today
    const referenceDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
    const ready: (typeof activeItems[0] & { daysSince: number | null })[] = [];
    const recentlyDone: (typeof activeItems[0] & { daysSince: number })[] = [];

    // Build a map of item ID -> most recent done date from schedule data
    // Include both 'completed' and 'scheduled' entries (scheduled = assumed done)
    // Only count entries on or before the reference date
    const lastCompletedMap = new Map<string, Date>();
    scheduleData.forEach(entry => {
      // Skip 'skipped' entries - they don't count as done
      if (entry.status === 'skipped') return;

      const entryDate = entry.completedAt
        ? new Date(entry.completedAt)
        : new Date(entry.scheduledDate + 'T12:00:00');

      // Only count if the entry date is on or before the reference date
      if (entryDate <= referenceDate) {
        const existing = lastCompletedMap.get(entry.itemId);
        if (!existing || entryDate > existing) {
          lastCompletedMap.set(entry.itemId, entryDate);
        }
      }
    });

    activeItems.forEach(item => {
      // Check schedule data first, then fall back to item.lastCompletedAt
      const lastDoneFromSchedule = lastCompletedMap.get(item.id);
      const lastDoneFromItem = item.lastCompletedAt ? new Date(item.lastCompletedAt) : null;

      // Use the most recent of the two
      let lastDone: Date | null = null;
      if (lastDoneFromSchedule && lastDoneFromItem) {
        lastDone = lastDoneFromSchedule > lastDoneFromItem ? lastDoneFromSchedule : lastDoneFromItem;
      } else {
        lastDone = lastDoneFromSchedule || lastDoneFromItem;
      }

      if (!lastDone) {
        // Never done - ready to schedule
        ready.push({ ...item, daysSince: null });
      } else {
        const daysSince = Math.floor((referenceDate.getTime() - lastDone.getTime()) / (1000 * 60 * 60 * 24));

        // Use scheduleIntervalDays if available, otherwise default to 7 days
        const intervalDays = item.scheduleIntervalDays || 7;

        if (daysSince >= intervalDays) {
          // Past the interval as of selected date - ready to schedule
          ready.push({ ...item, daysSince });
        } else {
          // Recently done - still within interval as of selected date
          recentlyDone.push({ ...item, daysSince });
        }
      }
    });

    // Sort ready items by overdue first (if they have nextDueDate)
    ready.sort((a, b) => {
      if (a.nextDueDate && b.nextDueDate) {
        return a.nextDueDate.localeCompare(b.nextDueDate);
      }
      if (a.nextDueDate) return -1;
      if (b.nextDueDate) return 1;
      return 0;
    });

    // Sort recently done by most recent first
    recentlyDone.sort((a, b) => a.daysSince - b.daysSince);

    return { ready, recentlyDone };
  }, [activeItems, selectedDate, scheduleData]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[month - 1]} {year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
        {/* Week day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }} className="bg-gray-800/80">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r border-gray-700/30 bg-gray-900/20" />;
            }

            const dateKey = formatDateKey(day);
            const schedules = scheduleMap.get(dateKey) || [];
            const isToday = dateKey === todayKey;
            const isPast = dateKey < todayKey;

            return (
              <CalendarDay
                key={day}
                day={day}
                dateKey={dateKey}
                schedules={schedules}
                isToday={isToday}
                isPast={isPast}
                getCategoryInfo={getCategoryInfo}
                onClick={() => handleDayClick(day)}
                onComplete={(id) => handleUpdateStatus(id, 'completed')}
                onSkip={(id) => handleUpdateStatus(id, 'skipped')}
                onRemove={(id) => removeItemMutation.mutate(id)}
              />
            );
          })}
        </div>
      </div>

      {/* Item Picker Modal */}
      {showItemPicker && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full"
            style={{ maxWidth: '28rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Fixed Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between" style={{ flexShrink: 0 }}>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Schedule for {selectedDate}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pick one item to focus on
                </p>
              </div>
              <button
                onClick={() => { setShowItemPicker(false); setSelectedDate(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="p-4" style={{ overflowY: 'auto', flex: 1 }}>
              {activeItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No active items. Go to Setup to enable some items.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Ready Section */}
                  {categorizedItems.ready.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#374151' }}>
                        <span>✅</span> Ready
                      </h4>
                      <div className="space-y-2">
                        {categorizedItems.ready.map(item => {
                          const category = getCategoryInfo(item.categoryId);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectItem(item.id)}
                              disabled={scheduleItemMutation.isPending}
                              className="w-full p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl flex-shrink-0">{item.icon || category?.icon || '✨'}</span>
                                <div className="flex-1 overflow-hidden">
                                  <div className="font-semibold text-sm truncate" style={{ color: '#1f2937' }}>
                                    {item.name}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                    {category?.name}
                                    {item.daysSince !== null && ` • ${item.daysSince} day${item.daysSince !== 1 ? 's' : ''} ago`}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recently Done Section */}
                  {categorizedItems.recentlyDone.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#6b7280' }}>
                        <span>⏱️</span> Recently Done
                      </h4>
                      <div className="space-y-2">
                        {categorizedItems.recentlyDone.map(item => {
                          const category = getCategoryInfo(item.categoryId);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectItem(item.id)}
                              disabled={scheduleItemMutation.isPending}
                              className="w-full p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700 transition-colors text-left opacity-60 hover:opacity-100"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl flex-shrink-0">{item.icon || category?.icon || '✨'}</span>
                                <div className="flex-1 overflow-hidden">
                                  <div className="font-semibold text-sm truncate" style={{ color: '#1f2937' }}>
                                    {item.name}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                                    {category?.name} • Done {item.daysSince} day{item.daysSince !== 1 ? 's' : ''} ago
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state if all items are recently done */}
                  {categorizedItems.ready.length === 0 && categorizedItems.recentlyDone.length > 0 && (
                    <p className="text-xs text-center py-2" style={{ color: '#9ca3af' }}>
                      All items were recently done. You can still schedule them if needed.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          Loading schedule...
        </div>
      )}
    </div>
  );
}

// =====================================================
// SCHEDULE ITEM COMPONENT (with hover for actions)
// =====================================================

interface ScheduleItemProps {
  schedule: PersonalCareScheduleWithItem;
  getCategoryInfo: (categoryId: string) => { name: string; icon: string; color?: string } | undefined;
  getItemColors: (status: string) => { bg: string; color: string };
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onRemove: (id: string) => void;
}

function ScheduleItem({ schedule, getCategoryInfo, getItemColors, onComplete, onSkip, onRemove }: ScheduleItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const category = getCategoryInfo(schedule.item.categoryId);
  const isSkipped = schedule.status === 'skipped';
  const colors = getItemColors(schedule.status);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 4px',
        borderRadius: '4px',
        backgroundColor: colors.bg,
        textDecoration: isSkipped ? 'line-through' : undefined,
      }}
    >
      <span style={{ fontSize: '10px', flexShrink: 0 }}>{schedule.item.icon || category?.icon || '✨'}</span>
      <span style={{
        fontSize: '11px',
        color: colors.color,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {schedule.item.name}
      </span>

      {/* Action buttons - show on hover */}
      {isHovered && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {schedule.status === 'scheduled' && (
            <>
              <button
                onClick={() => onComplete(schedule.id)}
                style={{ padding: '2px', color: '#4ade80', borderRadius: '4px' }}
                title="Complete"
              >
                <Check style={{ width: '12px', height: '12px' }} />
              </button>
              <button
                onClick={() => onSkip(schedule.id)}
                style={{ padding: '2px', color: '#9ca3af', borderRadius: '4px' }}
                title="Skip"
              >
                <SkipForward style={{ width: '12px', height: '12px' }} />
              </button>
            </>
          )}
          <button
            onClick={() => onRemove(schedule.id)}
            style={{ padding: '2px', color: '#f87171', borderRadius: '4px' }}
            title="Remove"
          >
            <X style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CALENDAR DAY COMPONENT
// =====================================================

interface CalendarDayProps {
  day: number;
  dateKey: string;
  schedules: PersonalCareScheduleWithItem[];
  isToday: boolean;
  isPast: boolean;
  getCategoryInfo: (categoryId: string) => { name: string; icon: string; color?: string } | undefined;
  onClick: () => void;
  onComplete: (scheduleId: string) => void;
  onSkip: (scheduleId: string) => void;
  onRemove: (scheduleId: string) => void;
}

function CalendarDay({
  day,
  schedules,
  isToday,
  isPast,
  getCategoryInfo,
  onClick,
  onComplete,
  onSkip,
  onRemove,
}: CalendarDayProps) {
  // Determine cell background based on schedules
  const getCellStyles = () => {
    if (schedules.length === 0) return '';
    const allCompleted = schedules.every(s => s.status === 'completed');
    const allSkipped = schedules.every(s => s.status === 'skipped');
    const hasOverdue = schedules.some(s => s.status === 'scheduled') && isPast;

    if (allCompleted) return 'bg-green-50 dark:bg-green-900/20';
    if (allSkipped) return 'bg-gray-100 dark:bg-gray-700/50';
    if (hasOverdue) return 'bg-red-50 dark:bg-red-900/20';
    return '';
  };

  const maxVisible = 3; // Show max 3 items, then "+X more"
  const visibleSchedules = schedules.slice(0, maxVisible);
  const hiddenCount = schedules.length - maxVisible;

  // Get background and text colors based on status
  const getItemColors = (status: string) => {
    if (status === 'completed') {
      return { bg: 'rgba(34, 197, 94, 0.25)', color: '#86efac' }; // green
    }
    if (status === 'skipped') {
      return { bg: 'rgba(107, 114, 128, 0.25)', color: '#9ca3af' }; // gray
    }
    return { bg: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff' }; // purple
  };

  return (
    <div
      style={{
        minHeight: '100px',
        padding: '6px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        borderRight: '1px solid rgba(75, 85, 99, 0.3)',
        backgroundColor: isToday ? 'rgba(147, 51, 234, 0.2)' : undefined,
        outline: isToday ? '2px solid #a855f7' : undefined,
        outlineOffset: isToday ? '-2px' : undefined,
      }}
      onClick={onClick}
    >
      {/* Day number */}
      <div style={{ marginBottom: '4px' }}>
        {isToday ? (
          <span style={{
            backgroundColor: '#a855f7',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {day}
          </span>
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '500' }}>
            {day}
          </span>
        )}
      </div>

      {/* Stacked items - clean display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {visibleSchedules.map(schedule => (
          <ScheduleItem
            key={schedule.id}
            schedule={schedule}
            getCategoryInfo={getCategoryInfo}
            getItemColors={getItemColors}
            onComplete={onComplete}
            onSkip={onSkip}
            onRemove={onRemove}
          />
        ))}
        {hiddenCount > 0 && (
          <div style={{ fontSize: '10px', color: '#c4b5fd', fontWeight: '500', paddingLeft: '4px' }}>
            +{hiddenCount} more
          </div>
        )}
      </div>
    </div>
  );
}
