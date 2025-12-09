/**
 * HabitStreakCalendar Component
 * GitHub-style calendar heatmap for habit tracking
 */

import React, { useMemo, useState } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay, getMonth, startOfMonth, startOfDay, isAfter } from 'date-fns';
import { Flame, Trophy, Target, TrendingUp, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface HabitEntry {
  date: string;
  value?: number;
}

interface HabitStreakCalendarProps {
  entries: HabitEntry[];
  habitColor?: string;
  habitName: string;
  currentStreak: number;
  bestStreak: number;
  targetCount?: number;
}

interface DayData {
  date: Date;
  count: number;
  isToday: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  month: number;
}

const WEEKS_TO_SHOW = 26; // Show last 26 weeks (about 6 months)
const FUTURE_WEEKS = 4; // Show 4 weeks into the future

const RECENT_DAYS = 14; // Show last 14 days in quick view

export const HabitStreakCalendar: React.FC<HabitStreakCalendarProps> = ({
  entries,
  habitColor = '#10b981',
  habitName,
  currentStreak,
  bestStreak,
  targetCount = 1,
}) => {
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  // Generate calendar data (GitHub style: horizontal weeks, vertical days)
  const { calendarData, monthLabels } = useMemo(() => {
    const today = startOfDay(new Date()); // Normalize to start of day

    const startDate = subDays(today, WEEKS_TO_SHOW * 7 - 1);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Start on Monday

    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Create entry map for quick lookup
    const entryMap = new Map<string, number>(
      entries.map(e => [e.date, (e.value as number) || 1])
    );

    // Generate weeks of data (past + future)
    const totalDays = (WEEKS_TO_SHOW + FUTURE_WEEKS) * 7;
    for (let i = 0; i < totalDays; i++) {
      const date = startOfDay(addDays(weekStart, i)); // Normalize to start of day
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = entryMap.get(dateKey) || 0;
      const isCompleted = count >= targetCount;
      const isFuture = isAfter(date, today); // Use date-fns for comparison

      currentWeek.push({
        date,
        count,
        isToday: isSameDay(date, today),
        isCompleted,
        isFuture,
        month: getMonth(date),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Generate month labels for the top
    const labels: Array<{ label: string; span: number }> = [];
    let currentMonth = -1;
    let span = 0;

    weeks.forEach((week, index) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek && firstDayOfWeek.month !== currentMonth) {
        if (span > 0) {
          labels.push({ label: format(weeks[index - 1][0].date, 'MMM'), span });
        }
        currentMonth = firstDayOfWeek.month;
        span = 1;
      } else {
        span++;
      }
    });

    if (span > 0 && weeks.length > 0) {
      labels.push({ label: format(weeks[weeks.length - 1][0].date, 'MMM'), span });
    }

    return { calendarData: weeks, monthLabels: labels };
  }, [entries, targetCount]);

  // Generate recent days data (last 14 days)
  const recentDays = useMemo(() => {
    const today = startOfDay(new Date()); // Normalize to start of day

    const entryMap = new Map<string, number>(
      entries.map(e => [e.date, (e.value as number) || 1])
    );

    const days: DayData[] = [];
    for (let i = RECENT_DAYS - 1; i >= 0; i--) {
      const date = startOfDay(subDays(today, i)); // Normalize to start of day
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = entryMap.get(dateKey) || 0;
      const isCompleted = count >= targetCount;
      const isFuture = isAfter(date, today); // Use date-fns for comparison

      days.push({
        date,
        count,
        isToday: isSameDay(date, today),
        isCompleted,
        isFuture,
        month: getMonth(date),
      });
    }

    return days;
  }, [entries, targetCount]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthStartKey = format(monthStart, 'yyyy-MM-dd');
    const todayKey = format(today, 'yyyy-MM-dd');

    // Count completions this month
    const thisMonthCompletions = entries.filter(
      e => e.date >= monthStartKey && e.date <= todayKey
    ).length;

    // Calculate total days since first entry or 30 days, whichever is less
    const firstEntry = entries.length > 0
      ? new Date(Math.min(...entries.map(e => new Date(e.date).getTime())))
      : today;
    const daysSinceStart = Math.min(
      Math.floor((today.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      30
    );

    // Completion rate (last 30 days)
    const last30Days = subDays(today, 29);
    const last30DaysKey = format(last30Days, 'yyyy-MM-dd');
    const completionsLast30 = entries.filter(e => e.date >= last30DaysKey).length;
    const completionRate = daysSinceStart > 0 ? Math.round((completionsLast30 / daysSinceStart) * 100) : 0;

    return {
      thisMonthCompletions,
      completionRate,
    };
  }, [entries]);

  // Calculate streak milestone
  const getStreakMilestone = (streak: number) => {
    if (streak >= 100) return { icon: Trophy, text: 'Century!', color: 'text-yellow-500' };
    if (streak >= 50) return { icon: Flame, text: 'On Fire!', color: 'text-orange-500' };
    if (streak >= 30) return { icon: TrendingUp, text: 'Unstoppable!', color: 'text-red-500' };
    if (streak >= 21) return { icon: Target, text: 'Habit Formed!', color: 'text-green-500' };
    if (streak >= 7) return { icon: Flame, text: 'Week Strong!', color: 'text-blue-500' };
    return null;
  };

  const milestone = getStreakMilestone(currentStreak);

  // Get color based on completion (GitHub style)
  const getSquareStyle = (day: DayData): React.CSSProperties => {
    // Future dates - grayed out and clearly distinguished
    if (day.isFuture) {
      return {
        backgroundColor: '#374151', // Medium dark gray for future dates
        border: '1px solid #4b5563',
        opacity: 0.4,
      };
    }

    // Past/today - not completed
    if (!day.isCompleted) {
      return {
        backgroundColor: '#e5e7eb', // Light gray
        border: '2px solid #d1d5db',
      };
    }

    // Past/today - completed
    // GitHub-style intensity levels based on completion count
    const intensity = Math.min(day.count / targetCount, 4);
    let opacity = 0.6; // Increased minimum opacity for better visibility
    if (intensity >= 3) opacity = 1.0;
    else if (intensity >= 2) opacity = 0.85;
    else if (intensity >= 1) opacity = 0.7;

    return {
      backgroundColor: habitColor,
      opacity,
      border: '2px solid rgba(0,0,0,0.15)',
    };
  };

  const motivationalMessage = useMemo(() => {
    if (currentStreak === 0) {
      return "Start your streak today! 🎯";
    }
    if (currentStreak === 1) {
      return "Great start! Keep it going tomorrow 💪";
    }
    if (currentStreak < 7) {
      return `${7 - currentStreak} days until a full week! 🔥`;
    }
    if (currentStreak < 21) {
      return `${21 - currentStreak} days until habit formation! 🌟`;
    }
    if (currentStreak < 30) {
      return `Almost a month! ${30 - currentStreak} days to go 🚀`;
    }
    if (currentStreak === bestStreak) {
      return "Personal record! Don't break the chain! 🏆";
    }
    return "Amazing dedication! Keep going! 💎";
  }, [currentStreak, bestStreak]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{habitName} - Activity</h3>
          <p className="text-sm text-gray-600 mt-1">Last {RECENT_DAYS} days</p>
        </div>

        {milestone && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200`}>
            <milestone.icon className={`w-5 h-5 ${milestone.color}`} />
            <span className={`text-sm font-semibold ${milestone.color}`}>
              {milestone.text}
            </span>
          </div>
        )}
      </div>

      {/* Recent Activity Bar - Last 14 Days */}
      <div className="mb-6">
        {/* Squares row */}
        <div className="flex items-center gap-1.5 mb-1 flex-nowrap">
          {recentDays.map((day, index) => (
            <div
              key={index}
              className={`
                w-6 h-6 rounded-sm transition-all duration-200 hover:scale-150 cursor-pointer flex-shrink-0
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              `}
              style={getSquareStyle(day)}
              title={`${format(day.date, 'EEE, MMM d')}${day.isFuture ? ' - Future date' : day.isCompleted ? ` - Completed (${day.count}x)` : ' - Not completed'}`}
            />
          ))}
        </div>

        {/* Date labels below */}
        <div className="flex items-center justify-between text-[8px] text-gray-500 px-0.5">
          <span>{format(recentDays[0]?.date || new Date(), 'MMM d')}</span>
          <span className="text-blue-600 font-medium">Today</span>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-medium text-orange-900">Current Streak</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
          <p className="text-xs text-orange-700">days</p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <p className="text-xs font-medium text-yellow-900">Best Streak</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{bestStreak}</p>
          <p className="text-xs text-yellow-700">days</p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-medium text-purple-900">Completion Rate</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.completionRate}%
          </p>
          <p className="text-xs text-purple-700">last 30 days</p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-900">This Month</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.thisMonthCompletions}
          </p>
          <p className="text-xs text-green-700">completions</p>
        </div>
      </div>

      {/* Show Full History Button */}
      <button
        onClick={() => setShowFullCalendar(!showFullCalendar)}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors mb-4"
      >
        {showFullCalendar ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide full history
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show full history
          </>
        )}
      </button>

      {/* Calendar Heatmap - GitHub Style (Collapsible) */}
      {showFullCalendar && (
        <div className="overflow-x-auto border-t pt-4">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1">
            <div className="w-8"></div>
            <div className="flex flex-1 text-xs text-gray-600">
              {monthLabels.map((month, idx) => (
                <div key={idx} style={{ width: `${month.span * 14}px` }} className="text-left">
                  {month.label}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-between mr-2 text-xs text-gray-600 pr-2">
              <div className="h-3"></div>
              <div>Mon</div>
              <div className="h-3"></div>
              <div>Wed</div>
              <div className="h-3"></div>
              <div>Fri</div>
              <div className="h-3"></div>
            </div>

            {/* Weeks container */}
            <div className="flex gap-1">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`
                        w-3 h-3 rounded-sm transition-all duration-200 hover:ring-2 hover:ring-blue-400 cursor-pointer
                        ${day.isToday ? 'ring-2 ring-blue-600' : ''}
                      `}
                      style={getSquareStyle(day)}
                      title={`${format(day.date, 'EEE, MMM d, yyyy')}${day.isFuture ? ' - Future date' : day.isCompleted ? ` - Completed (${day.count}x)` : ' - Not completed'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ebedf0', border: '1px solid #d1d5da' }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habitColor, opacity: 0.3 }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habitColor, opacity: 0.5 }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habitColor, opacity: 0.75 }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habitColor, opacity: 1.0 }}></div>
            </div>
            <span>More</span>
          </div>
        </div>
        </div>
      )}

      {/* Motivational Message */}
      {motivationalMessage && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-center font-medium text-gray-800">
            {motivationalMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default HabitStreakCalendar;
