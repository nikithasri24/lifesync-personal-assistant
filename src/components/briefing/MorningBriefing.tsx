/**
 * Morning Briefing Component
 * Displays daily summary with weather, schedule, tasks, and habits
 */

import React, { useState, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useDailyBriefing } from '@/hooks/useBriefingQuery';
import { getWeatherEmoji } from '@/services/briefing';
import type { DailyBriefing, BriefingEvent, BriefingTask, BriefingHabit } from '@/services/briefing';
import { useVoice } from '@/hooks/useVoice';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  AlertTriangle,
  Volume2,
  VolumeX,
  Loader2,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Coffee,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';

interface MorningBriefingProps {
  className?: string;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onCompleteHabit?: (habitId: string) => Promise<void>;
}

// Generate productivity insights based on briefing data
function generateInsights(briefing: DailyBriefing): { icon: React.ReactNode; text: string; type: 'tip' | 'warning' | 'success' }[] {
  const insights: { icon: React.ReactNode; text: string; type: 'tip' | 'warning' | 'success' }[] = [];
  const hour = new Date().getHours();

  // Morning motivation
  if (hour < 12 && briefing.totalTasksDue > 0) {
    if (briefing.totalTasksDue <= 3) {
      insights.push({
        icon: <Sparkles className="w-4 h-4" />,
        text: "Light task day! Perfect for deep work or tackling that big project.",
        type: 'success'
      });
    } else if (briefing.totalTasksDue >= 7) {
      insights.push({
        icon: <Coffee className="w-4 h-4" />,
        text: "Busy day ahead! Consider time-blocking for focus.",
        type: 'tip'
      });
    }
  }

  // Overdue tasks warning
  if (briefing.overdueTasks > 0) {
    insights.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `${briefing.overdueTasks} overdue task${briefing.overdueTasks > 1 ? 's' : ''} need attention.`,
      type: 'warning'
    });
  }

  // Habit streak encouragement
  if (briefing.currentStreak >= 7) {
    insights.push({
      icon: <TrendingUp className="w-4 h-4" />,
      text: `Amazing ${briefing.currentStreak}-day streak! Keep it going!`,
      type: 'success'
    });
  }

  // Time-of-day suggestions
  if (hour >= 14 && hour <= 16 && briefing.habitsToComplete.length > 0) {
    insights.push({
      icon: <Zap className="w-4 h-4" />,
      text: "Afternoon slump? Complete a habit for an energy boost!",
      type: 'tip'
    });
  }

  // Evening wind-down
  if (hour >= 20 && briefing.habitsToComplete.some(h => h.isAtRisk)) {
    insights.push({
      icon: <Moon className="w-4 h-4" />,
      text: "Evening reminder: protect your streaks before bed!",
      type: 'warning'
    });
  }

  // Clear schedule encouragement
  if (briefing.totalEvents === 0 && briefing.totalTasksDue === 0) {
    insights.push({
      icon: <Sun className="w-4 h-4" />,
      text: "Clear schedule today! Great time for planning or self-care.",
      type: 'success'
    });
  }

  return insights.slice(0, 2); // Max 2 insights
}

export function MorningBriefing({ className = '', onCompleteTask, onCompleteHabit }: MorningBriefingProps) {
  const { data: briefing, isLoading, error } = useDailyBriefing();
  const { speak, supported: speechSupported } = useVoice();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());

  const insights = useMemo(() => briefing ? generateInsights(briefing) : [], [briefing]);

  const handleSpeak = useCallback(async () => {
    if (!briefing?.voiceScript) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    await speak(briefing.voiceScript, { rate: 1.1 });
    setIsSpeaking(false);
  }, [briefing?.voiceScript, isSpeaking, speak]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    if (!onCompleteTask || completingItems.has(taskId)) return;
    setCompletingItems(prev => new Set(prev).add(taskId));
    try {
      await onCompleteTask(taskId);
    } finally {
      setCompletingItems(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [onCompleteTask, completingItems]);

  const handleCompleteHabit = useCallback(async (habitId: string) => {
    if (!onCompleteHabit || completingItems.has(habitId)) return;
    setCompletingItems(prev => new Set(prev).add(habitId));
    try {
      await onCompleteHabit(habitId);
    } finally {
      setCompletingItems(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  }, [onCompleteHabit, completingItems]);

  if (isLoading) {
    return (
      <div className={`bg-blue-600 rounded-xl p-6 text-white border-4 border-blue-800 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className={`bg-red-600 rounded-xl p-6 text-white border-4 border-red-800 ${className}`}>
        <p className="text-center text-white font-bold text-lg">Unable to load briefing</p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-6 text-white shadow-2xl border-4 border-blue-800 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-lg animate-fade-in">
            {briefing.greeting}! ✨
          </h2>
          <p className="text-blue-100 font-bold text-lg">
            {briefing.dayOfWeek}, {format(new Date(), 'MMMM d')}
          </p>
        </div>
        {speechSupported && (
          <button
            onClick={handleSpeak}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              isSpeaking
                ? 'bg-white/30 animate-pulse'
                : 'hover:bg-white/20 hover:scale-110'
            }`}
            title={isSpeaking ? 'Stop reading' : 'Read briefing aloud'}
          >
            {isSpeaking ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Weather */}
      {briefing.weather && (
        <div className="flex items-center gap-3 mb-4 bg-blue-700 rounded-lg p-3 border-2 border-blue-900">
          <span className="text-4xl">{getWeatherEmoji(briefing.weather.condition)}</span>
          <div>
            <p className="font-black text-xl text-white">
              {briefing.weather.temperature}°{briefing.weather.temperatureUnit}
            </p>
            <p className="text-sm text-blue-100 font-semibold capitalize">{briefing.weather.conditionText}</p>
          </div>
          <div className="ml-auto text-right text-sm text-blue-100 font-semibold">
            <p>H: {briefing.weather.high}° L: {briefing.weather.low}°</p>
            <p>{briefing.weather.location}</p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard icon={<Calendar className="w-4 h-4" />} value={briefing.totalEvents} label="Events" />
        <StatCard icon={<ListTodo className="w-4 h-4" />} value={briefing.totalTasksDue} label="Tasks" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} value={briefing.habitsToComplete.length} label="Habits" />
      </div>

      {/* Productivity Insights */}
      {insights.length > 0 && (
        <div className="mb-4 space-y-2">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} {...insight} />
          ))}
        </div>
      )}

      {/* Events */}
      {briefing.events.length > 0 && (
        <Section title="Today's Schedule" icon={<Clock className="w-4 h-4" />}>
          {briefing.events.slice(0, 3).map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
          {briefing.events.length > 3 && (
            <p className="text-sm text-blue-100 font-bold">+{briefing.events.length - 3} more</p>
          )}
        </Section>
      )}

      {/* Priority Tasks with Quick Actions */}
      {briefing.priorityTasks.length > 0 && (
        <Section title="Top Priorities" icon={<ListTodo className="w-5 h-5" />}>
          {briefing.priorityTasks.slice(0, 3).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onCompleteTask ? () => handleCompleteTask(task.id) : undefined}
              isCompleting={completingItems.has(task.id)}
            />
          ))}
        </Section>
      )}

      {/* Habits at Risk with Quick Actions */}
      {briefing.habitsToComplete.filter(h => h.isAtRisk).length > 0 && (
        <Section title="🔥 Streaks at Risk" icon={<AlertTriangle className="w-4 h-4 text-orange-300" />}>
          {briefing.habitsToComplete.filter(h => h.isAtRisk).slice(0, 3).map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onComplete={onCompleteHabit ? () => handleCompleteHabit(habit.id) : undefined}
              isCompleting={completingItems.has(habit.id)}
            />
          ))}
        </Section>
      )}

      {/* Current Streak */}
      {briefing.currentStreak > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t-2 border-white/20">
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full">
            <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
            <span className="font-black text-white text-lg">{briefing.currentStreak} day streak</span>
            <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
          </div>
        </div>
      )}

      {/* Level Badge */}
      {briefing.level > 1 && (
        <div className="flex items-center justify-center mt-3">
          <span className="text-sm font-bold text-blue-200">
            Level {briefing.level} • Keep going! 🚀
          </span>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20 hover:bg-white/20 transition-colors">
      <div className="flex items-center justify-center gap-1 mb-1 text-white">
        {icon}
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="text-sm text-blue-100 font-bold">{label}</p>
    </div>
  );
}

function InsightCard({ icon, text, type }: { icon: React.ReactNode; text: string; type: 'tip' | 'warning' | 'success' }) {
  const bgColors = {
    tip: 'bg-indigo-500/30 border-indigo-400/50',
    warning: 'bg-orange-500/30 border-orange-400/50',
    success: 'bg-green-500/30 border-green-400/50',
  };
  const iconColors = {
    tip: 'text-indigo-200',
    warning: 'text-orange-200',
    success: 'text-green-200',
  };
  return (
    <div className={`flex items-center gap-3 rounded-lg p-3 border ${bgColors[type]} backdrop-blur-sm`}>
      <div className={iconColors[type]}>{icon}</div>
      <p className="text-sm text-white font-medium flex-1">{text}</p>
      <Lightbulb className="w-4 h-4 text-yellow-300 opacity-60" />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2 text-base font-black text-white">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EventItem({ event }: { event: BriefingEvent }) {
  const time = event.isAllDay ? 'All day' : format(parseISO(event.startTime), 'h:mm a');
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 hover:bg-white/20 transition-colors">
      <div className="w-14 text-sm text-center font-black text-white bg-white/10 rounded px-2 py-1">{time}</div>
      <div className="flex-1 truncate text-sm text-white font-bold">{event.title}</div>
      {event.location && <span className="text-xs text-blue-100 font-semibold truncate max-w-20">📍 {event.location}</span>}
    </div>
  );
}

interface TaskItemProps {
  task: BriefingTask;
  onComplete?: () => void;
  isCompleting?: boolean;
}

function TaskItem({ task, onComplete, isCompleting }: TaskItemProps) {
  const priorityColors = {
    urgent: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-green-400',
  };
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 hover:bg-white/20 transition-colors group">
      {onComplete ? (
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
        >
          {isCompleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ) : (
        <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`} />
      )}
      <div className="flex-1 truncate text-sm text-white font-bold">
        {task.isOverdue && <span className="text-red-300 mr-1">⚠️</span>}
        {task.title}
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} title={task.priority} />
        {task.estimatedMinutes && (
          <span className="text-xs text-blue-100 font-semibold">{task.estimatedMinutes}m</span>
        )}
      </div>
    </div>
  );
}

interface HabitItemProps {
  habit: BriefingHabit;
  onComplete?: () => void;
  isCompleting?: boolean;
}

function HabitItem({ habit, onComplete, isCompleting }: HabitItemProps) {
  return (
    <div className="flex items-center gap-3 bg-orange-500/20 backdrop-blur-sm rounded-lg p-2 border border-orange-400/30 hover:bg-orange-500/30 transition-colors group">
      {onComplete ? (
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-6 h-6 rounded-full border-2 border-orange-300 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
        >
          {isCompleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ) : (
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <Flame className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex-1 truncate text-sm text-white font-bold">{habit.name}</div>
      <div className="flex items-center gap-1 text-orange-200 text-xs font-semibold">
        <Flame className="w-3 h-3" />
        <span>{habit.currentStreak}</span>
      </div>
    </div>
  );
}

