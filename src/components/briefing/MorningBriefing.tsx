/**
 * Morning Briefing Component
 * Displays daily summary with weather, schedule, tasks, habits, and Plan Today
 */

import React, { useState, useCallback, useMemo } from 'react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { useDailyBriefing } from '@/hooks/useBriefingQuery';
import { getWeatherEmoji } from '@/services/briefing';
import type { DailyBriefing, BriefingEvent, BriefingTask, BriefingHabit } from '@/services/briefing';
import { useVoice } from '@/hooks/useVoice';
import { useTasks } from '@/hooks/useTasksQuery';
import { useAutoScheduleMutation } from '@/hooks/useSchedulingQuery';
import type { Task } from '@/types/task';
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
  Play,
  Check,
  Target,
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
  const { data: allTasks = [] } = useTasks();
  const autoScheduleMutation = useAutoScheduleMutation();
  const { speak, supported: speechSupported } = useVoice();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
  const [selectedForPlan, setSelectedForPlan] = useState<Set<string>>(new Set());
  const [planResult, setPlanResult] = useState<{ scheduled: number; failed: number } | null>(null);

  const insights = useMemo(() => briefing ? generateInsights(briefing) : [], [briefing]);

  // Get tasks that need planning today: due today OR overdue (not scheduled, not done)
  const tasksNeedingPlan = useMemo(() => {
    const today = startOfDay(new Date());
    return (allTasks as Task[]).filter(task => {
      if (task.deleted || task.archived) return false;
      if (task.status === 'done' || task.status === 'scheduled') return false;
      if (!task.dueDate) return false; // Only tasks WITH a due date

      const dueDate = startOfDay(new Date(task.dueDate));
      return isToday(dueDate) || isBefore(dueDate, today); // Due today or overdue
    }).slice(0, 5); // Max 5 tasks to show
  }, [allTasks]);

  // Toggle task selection for planning
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedForPlan(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
    setPlanResult(null); // Clear previous result
  }, []);

  // Handle Plan My Day action
  const handlePlanToday = useCallback(async () => {
    if (selectedForPlan.size === 0) return;

    const tasksToSchedule = tasksNeedingPlan
      .filter(t => selectedForPlan.has(t.id))
      .map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority as 'urgent' | 'high' | 'medium' | 'low',
        estimatedMinutes: task.estimatedTime || 30,
        complexity: task.priority === 'urgent' || task.priority === 'high' ? 'deep_work' as const : 'shallow' as const,
      }));

    try {
      const result = await autoScheduleMutation.mutateAsync({
        tasks: tasksToSchedule,
        date: new Date(),
      });
      setPlanResult({
        scheduled: result.totalScheduled,
        failed: result.totalUnscheduled,
      });
      setSelectedForPlan(new Set()); // Clear selections after scheduling
    } catch (err) {
      console.error('Failed to plan day:', err);
    }
  }, [selectedForPlan, tasksNeedingPlan, autoScheduleMutation]);

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
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className={`card border-2 border-red-300 ${className}`}>
        <p className="text-center text-primary font-bold text-lg">Unable to load briefing</p>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-primary font-display animate-fade-in">
            {briefing.greeting}! ✨
          </h2>
          <p className="text-secondary font-medium text-base">
            {briefing.dayOfWeek}, {format(new Date(), 'MMMM d')}
          </p>
        </div>
        {speechSupported && (
          <button
            onClick={handleSpeak}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              isSpeaking
                ? 'bg-blue-500 text-white animate-pulse'
                : 'bg-tertiary hover:bg-blue-100 text-primary'
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
        <div className="flex items-center gap-3 mb-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
          <span className="text-4xl">{getWeatherEmoji(briefing.weather.condition)}</span>
          <div>
            <p className="font-bold text-xl text-primary">
              {briefing.weather.temperature}°{briefing.weather.temperatureUnit}
            </p>
            <p className="text-sm text-secondary font-medium capitalize">{briefing.weather.conditionText}</p>
          </div>
          <div className="ml-auto text-right text-sm text-secondary font-medium">
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

      {/* Plan Today Section */}
      {tasksNeedingPlan.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Plan Today</h4>
            </div>
            <button
              onClick={handlePlanToday}
              disabled={selectedForPlan.size === 0 || autoScheduleMutation.isPending}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                selectedForPlan.size === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
              }`}
            >
              {autoScheduleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Schedule {selectedForPlan.size > 0 ? `(${selectedForPlan.size})` : ''}
            </button>
          </div>

          <p className="text-xs text-purple-700 mb-3">
            Select tasks to auto-schedule into your free time slots:
          </p>

          <div className="space-y-2">
            {tasksNeedingPlan.map(task => {
              const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date()));
              const isSelected = selectedForPlan.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTaskSelection(task.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-white border border-purple-200 hover:border-purple-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    isSelected ? 'bg-purple-600' : 'border-2 border-purple-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">Overdue</span>
                      )}
                      <span className="text-xs text-slate-500">~{task.estimatedTime || 30}m</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {planResult && (
            <div className={`mt-3 p-2 rounded-lg text-sm font-medium ${
              planResult.failed === 0
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              ✓ {planResult.scheduled} task{planResult.scheduled !== 1 ? 's' : ''} scheduled
              {planResult.failed > 0 && ` • ${planResult.failed} couldn't fit`}
            </div>
          )}
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
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full shadow-lg">
            <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
            <span className="font-bold text-white text-lg">{briefing.currentStreak} day streak</span>
            <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
          </div>
        </div>
      )}

      {/* Level Badge */}
      {briefing.level > 1 && (
        <div className="flex items-center justify-center mt-3">
          <span className="text-sm font-medium text-secondary">
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
    <div className="bg-tertiary rounded-xl p-3 text-center hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-center gap-1 mb-1 text-accent">
        {icon}
        <span className="text-2xl font-bold text-primary">{value}</span>
      </div>
      <p className="text-sm text-secondary font-medium">{label}</p>
    </div>
  );
}

function InsightCard({ icon, text, type }: { icon: React.ReactNode; text: string; type: 'tip' | 'warning' | 'success' }) {
  const styles = {
    tip: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  };
  const iconColors = {
    tip: 'text-blue-500',
    warning: 'text-amber-500',
    success: 'text-green-500',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 border ${styles[type]}`}>
      <div className={iconColors[type]}>{icon}</div>
      <p className="text-sm font-medium flex-1">{text}</p>
      <Lightbulb className="w-4 h-4 text-yellow-500" />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2 text-base font-semibold text-primary">
        <span className="text-accent">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EventItem({ event }: { event: BriefingEvent }) {
  const time = event.isAllDay ? 'All day' : format(parseISO(event.startTime), 'h:mm a');
  return (
    <div className="flex items-center gap-3 bg-tertiary rounded-xl p-3 hover:shadow-md transition-all duration-200">
      <div className="w-16 text-xs text-center font-semibold text-blue-700 bg-blue-100 rounded-lg px-2 py-1.5 border border-blue-200">{time}</div>
      <div className="flex-1 truncate text-sm text-primary font-medium">{event.title}</div>
      {event.location && <span className="text-xs text-secondary truncate max-w-24">📍 {event.location}</span>}
    </div>
  );
}

interface TaskItemProps {
  task: BriefingTask;
  onComplete?: () => void;
  isCompleting?: boolean;
}

function TaskItem({ task, onComplete, isCompleting }: TaskItemProps) {
  const priorityBadges = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  const priorityDots = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  return (
    <div className="flex items-center gap-3 bg-tertiary rounded-xl p-3 hover:shadow-md transition-all duration-200 group">
      {onComplete ? (
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
        >
          {isCompleting ? (
            <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ) : (
        <div className={`w-3 h-3 rounded-full ${priorityDots[task.priority]}`} />
      )}
      <div className="flex-1 truncate text-sm text-primary font-medium">
        {task.isOverdue && <span className="text-red-500 mr-1">⚠️</span>}
        {task.title}
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${priorityBadges[task.priority]}`}>
          {task.priority}
        </span>
        {task.estimatedMinutes && (
          <span className="text-xs text-secondary font-medium">{task.estimatedMinutes}m</span>
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
    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-200 hover:shadow-md transition-all duration-200 group">
      {onComplete ? (
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-6 h-6 rounded-full border-2 border-orange-300 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-colors disabled:opacity-50"
        >
          {isCompleting ? (
            <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      ) : (
        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
          <Flame className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex-1 truncate text-sm text-primary font-medium">{habit.name}</div>
      <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 border border-orange-200">
        <Flame className="w-3 h-3" />
        <span>{habit.currentStreak}</span>
      </div>
    </div>
  );
}

