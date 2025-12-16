/**
 * Morning Briefing Component
 * Displays daily summary with weather, schedule, tasks, and habits
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { useDailyBriefing } from '@/hooks/useBriefingQuery';
import { getWeatherEmoji } from '@/services/briefing';
import type { DailyBriefing, BriefingEvent, BriefingTask, BriefingHabit } from '@/services/briefing';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Flame,
  ListTodo,
  AlertTriangle,
  Volume2,
  Loader2,
} from 'lucide-react';

interface MorningBriefingProps {
  className?: string;
  onSpeak?: (text: string) => void;
}

export function MorningBriefing({ className = '', onSpeak }: MorningBriefingProps) {
  const { data: briefing, isLoading, error } = useDailyBriefing();

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
    <div className={`bg-blue-600 rounded-xl p-6 text-white shadow-2xl border-4 border-blue-800 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-black text-white drop-shadow-lg">{briefing.greeting}!</h2>
          <p className="text-blue-100 font-bold text-lg">
            {briefing.dayOfWeek}, {format(new Date(), 'MMMM d')}
          </p>
        </div>
        {onSpeak && (
          <button
            onClick={() => onSpeak(briefing.voiceScript)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Read briefing aloud"
          >
            <Volume2 className="w-5 h-5" />
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

      {/* Priority Tasks */}
      {briefing.priorityTasks.length > 0 && (
        <Section title="Top Priorities" icon={<ListTodo className="w-5 h-5" />}>
          {briefing.priorityTasks.slice(0, 3).map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </Section>
      )}

      {/* Streaks at Risk */}
      {briefing.streaksAtRisk > 0 && (
        <div className="flex items-center gap-2 mt-4 bg-orange-500 rounded-lg p-3 border-2 border-orange-700">
          <AlertTriangle className="w-6 h-6 text-white" />
          <span className="text-base text-white font-bold">
            {briefing.streaksAtRisk} habit streak{briefing.streaksAtRisk > 1 ? 's' : ''} at risk!
          </span>
        </div>
      )}

      {/* Current Streak */}
      {briefing.currentStreak > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t-2 border-blue-800">
          <Flame className="w-6 h-6 text-orange-300" />
          <span className="font-black text-white text-lg">{briefing.currentStreak} day streak</span>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-blue-700 rounded-lg p-3 text-center border-2 border-blue-900">
      <div className="flex items-center justify-center gap-1 mb-1 text-white">
        {icon}
        <span className="text-2xl font-black text-white">{value}</span>
      </div>
      <p className="text-sm text-blue-100 font-bold">{label}</p>
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
    <div className="flex items-center gap-3 bg-blue-700 rounded-lg p-2 border-2 border-blue-900">
      <div className="w-14 text-sm text-center font-black text-white">{time}</div>
      <div className="flex-1 truncate text-sm text-white font-bold">{event.title}</div>
      {event.location && <span className="text-xs text-blue-100 font-semibold truncate max-w-20">{event.location}</span>}
    </div>
  );
}

function TaskItem({ task }: { task: BriefingTask }) {
  const priorityColors = {
    urgent: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-green-400',
  };
  return (
    <div className="flex items-center gap-3 bg-blue-700 rounded-lg p-2 border-2 border-blue-900">
      <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`} />
      <div className="flex-1 truncate text-sm text-white font-bold">
        {task.isOverdue && <span className="text-red-300 mr-1">⚠️</span>}
        {task.title}
      </div>
      {task.estimatedMinutes && (
        <span className="text-sm text-blue-100 font-semibold">{task.estimatedMinutes}m</span>
      )}
    </div>
  );
}

