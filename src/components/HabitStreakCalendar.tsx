/**
 * HabitStreakCalendar Component
 * GitHub-style calendar heatmap for habit tracking
 */

import React, { useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Flame, Trophy, Target, TrendingUp } from 'lucide-react';

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
}

const WEEKS_TO_SHOW = 12; // Show last 12 weeks (84 days)

export const HabitStreakCalendar: React.FC<HabitStreakCalendarProps> = ({
  entries,
  habitColor = '#10b981',
  habitName,
  currentStreak,
  bestStreak,
  targetCount = 1,
}) => {
  // Generate calendar data
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, WEEKS_TO_SHOW * 7 - 1);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 }); // Start on Sunday

    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Create entry map for quick lookup
    const entryMap = new Map<string, number>(
      entries.map(e => [e.date, (e.value as number) || 1])
    );

    // Generate 12 weeks of data
    for (let i = 0; i < WEEKS_TO_SHOW * 7; i++) {
      const date = addDays(weekStart, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = entryMap.get(dateKey) || 0;
      const isCompleted = count >= targetCount;

      currentWeek.push({
        date,
        count,
        isToday: isSameDay(date, today),
        isCompleted,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  }, [entries, targetCount]);

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

  // Get intensity class based on completion
  const getIntensityClass = (day: DayData) => {
    if (!day.isCompleted) {
      return 'bg-gray-100 border-gray-200';
    }

    // Use multiple completions for darker shades
    const intensity = Math.min(day.count / targetCount, 4);
    if (intensity >= 3) return 'border-transparent';
    if (intensity >= 2) return 'border-transparent opacity-80';
    if (intensity >= 1) return 'border-transparent opacity-60';
    return 'bg-gray-100 border-gray-200';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{habitName} - Activity</h3>
          <p className="text-sm text-gray-600 mt-1">{motivationalMessage}</p>
        </div>

        {milestone && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 animate-pulse`}>
            <milestone.icon className={`w-5 h-5 ${milestone.color}`} />
            <span className={`text-sm font-semibold ${milestone.color}`}>
              {milestone.text}
            </span>
          </div>
        )}
      </div>

      {/* Stats Row */}
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

        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-900">This Week</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {calendarData.slice(-1)[0]?.filter(d => d.isCompleted).length || 0}
          </p>
          <p className="text-xs text-green-700">completed</p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{WEEKS_TO_SHOW} weeks ago</span>
          <span>Today</span>
        </div>

        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS_TO_SHOW}, minmax(0, 1fr))` }}>
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    aspect-square rounded-sm border transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer
                    ${getIntensityClass(day)}
                    ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  `}
                  style={{
                    backgroundColor: day.isCompleted ? habitColor : undefined,
                  }}
                  title={`${format(day.date, 'MMM d, yyyy')}${day.isCompleted ? ` - Completed (${day.count}x)` : ' - Not completed'}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Day labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
            <div className="w-3 h-3 rounded-sm opacity-40" style={{ backgroundColor: habitColor }}></div>
            <div className="w-3 h-3 rounded-sm opacity-60" style={{ backgroundColor: habitColor }}></div>
            <div className="w-3 h-3 rounded-sm opacity-80" style={{ backgroundColor: habitColor }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habitColor }}></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Motivational Footer */}
      {currentStreak > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-sm text-center font-medium text-gray-800">
            🔗 Don't break the chain! Come back tomorrow to keep your {currentStreak}-day streak alive!
          </p>
        </div>
      )}
    </div>
  );
};

export default HabitStreakCalendar;
