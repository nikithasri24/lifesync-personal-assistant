/**
 * Daily Briefing Service
 * Generates personalized morning briefings with schedule, tasks, habits, and weather
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format, isToday, isBefore, parseISO, differenceInHours } from 'date-fns';
import { fetchWeather, getWeatherEmoji } from './weatherService';
import type {
  DailyBriefing,
  BriefingEvent,
  BriefingTask,
  BriefingHabit,
  BriefingOptions,
  WeatherData,
} from './types';
import { DEFAULT_BRIEFING_OPTIONS } from './types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDayOfWeek(): string {
  return format(new Date(), 'EEEE');
}

export async function generateDailyBriefing(
  options: Partial<BriefingOptions> = {}
): Promise<DailyBriefing> {
  const opts = { ...DEFAULT_BRIEFING_OPTIONS, ...options };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;

  // Fetch all data in parallel
  const [eventsResult, tasksResult, habitsResult, entriesResult, gamificationResult, weatherResult] = 
    await Promise.all([
      // Calendar events for today
      supabase
        .from('calendar_events')
        .select('id, title, start_date, end_date, location, all_day, type')
        .eq('user_id', user.id)
        .gte('start_date', todayStart)
        .lte('start_date', todayEnd)
        .order('start_date'),

      // Tasks due today or overdue
      supabase
        .from('tasks')
        .select('id, title, priority, due_date, estimated_time, status')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .eq('deleted', false)
        .or(`due_date.eq.${today},due_date.lt.${today}`),

      // Active habits
      supabase
        .from('habits')
        .select('id, name, current_streak')
        .eq('user_id', user.id)
        .eq('is_active', true),

      // Today's habit entries
      supabase
        .from('habit_entries')
        .select('habit_id')
        .eq('date', today),

      // Gamification stats
      supabase
        .from('user_gamification')
        .select('total_xp, level, current_streak')
        .eq('user_id', user.id)
        .single(),

      // Weather (if location provided)
      opts.includeWeather && opts.weatherLocation
        ? fetchWeather(opts.weatherLocation.lat, opts.weatherLocation.lng, opts.temperatureUnit)
        : Promise.resolve(null),
    ]);

  // Process events
  const events: BriefingEvent[] = (eventsResult.data || [])
    .slice(0, opts.maxEvents)
    .map((e) => ({
      id: e.id,
      title: e.title,
      startTime: e.start_date,
      endTime: e.end_date,
      location: e.location,
      isAllDay: e.all_day || false,
      type: e.type || 'event',
    }));

  const totalEvents = eventsResult.data?.length || 0;
  const firstEventTime = events[0]?.startTime;
  const busyHours = events.reduce((sum, e) => {
    if (e.isAllDay) return sum;
    return sum + differenceInHours(parseISO(e.endTime), parseISO(e.startTime));
  }, 0);

  // Process tasks
  const allTasks = tasksResult.data || [];
  const priorityTasks: BriefingTask[] = allTasks
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
    })
    .slice(0, opts.maxTasks)
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority || 'medium',
      dueTime: t.due_date,
      estimatedMinutes: t.estimated_time,
      isOverdue: t.due_date ? isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date)) : false,
    }));

  const overdueTasks = allTasks.filter(
    (t) => t.due_date && isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date))
  ).length;

  // Process habits
  const completedHabitIds = new Set((entriesResult.data || []).map((e) => e.habit_id));
  const allHabits = habitsResult.data || [];
  const habitsToComplete: BriefingHabit[] = allHabits
    .map((h) => ({
      id: h.id,
      name: h.name,
      currentStreak: h.current_streak || 0,
      isAtRisk: (h.current_streak || 0) > 0 && !completedHabitIds.has(h.id),
      isCompleted: completedHabitIds.has(h.id),
    }))
    .filter((h) => !h.isCompleted)
    .slice(0, opts.maxHabits);

  const streaksAtRisk = habitsToComplete.filter((h) => h.isAtRisk).length;

  // Gamification
  const gamification = gamificationResult.data || { total_xp: 0, level: 1, current_streak: 0 };

  // Generate voice script
  const voiceScript = generateVoiceScript({
    greeting: getGreeting(),
    weather: weatherResult,
    events,
    totalEvents,
    priorityTasks,
    overdueTasks,
    habitsToComplete,
    streaksAtRisk,
  });

  return {
    date: today,
    greeting: getGreeting(),
    dayOfWeek: getDayOfWeek(),
    weather: weatherResult || undefined,
    events,
    totalEvents,
    firstEventTime,
    busyHours,
    priorityTasks,
    totalTasksDue: allTasks.length,
    overdueTasks,
    habitsToComplete,
    streaksAtRisk,
    currentStreak: gamification.current_streak || 0,
    xpToday: 0, // Would need to query today's transactions
    level: gamification.level || 1,
    voiceScript,
  };
}

interface VoiceScriptParams {
  greeting: string;
  weather: WeatherData | null;
  events: BriefingEvent[];
  totalEvents: number;
  priorityTasks: BriefingTask[];
  overdueTasks: number;
  habitsToComplete: BriefingHabit[];
  streaksAtRisk: number;
}

function generateVoiceScript(params: VoiceScriptParams): string {
  const { greeting, weather, events, totalEvents, priorityTasks, overdueTasks, habitsToComplete, streaksAtRisk } = params;
  const parts: string[] = [];

  // Greeting
  parts.push(`${greeting}!`);

  // Weather
  if (weather) {
    const emoji = getWeatherEmoji(weather.condition);
    parts.push(`It's ${weather.temperature}°${weather.temperatureUnit} and ${weather.conditionText} in ${weather.location}. ${emoji}`);
  }

  // Schedule overview
  if (totalEvents === 0) {
    parts.push("You have a clear schedule today.");
  } else if (totalEvents === 1) {
    const firstEvent = events[0];
    const time = format(parseISO(firstEvent.startTime), 'h:mm a');
    parts.push(`You have 1 event today: ${firstEvent.title} at ${time}.`);
  } else {
    const firstEvent = events[0];
    const time = format(parseISO(firstEvent.startTime), 'h:mm a');
    parts.push(`You have ${totalEvents} events today. First up is ${firstEvent.title} at ${time}.`);
  }

  // Tasks
  if (overdueTasks > 0) {
    parts.push(`Heads up: you have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}.`);
  }

  if (priorityTasks.length > 0) {
    const highPriority = priorityTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    if (highPriority.length > 0) {
      parts.push(`Your top priority: ${highPriority[0].title}.`);
    } else {
      parts.push(`${priorityTasks.length} task${priorityTasks.length > 1 ? 's' : ''} due today.`);
    }
  }

  // Habits
  if (streaksAtRisk > 0) {
    parts.push(`⚠️ ${streaksAtRisk} habit streak${streaksAtRisk > 1 ? 's are' : ' is'} at risk!`);
  } else if (habitsToComplete.length > 0) {
    parts.push(`${habitsToComplete.length} habit${habitsToComplete.length > 1 ? 's' : ''} to complete today.`);
  }

  // Encouragement
  const encouragements = [
    "Let's make it a great day!",
    "You've got this!",
    "Time to crush it!",
    "Have a productive day!",
  ];
  parts.push(encouragements[Math.floor(Math.random() * encouragements.length)]);

  return parts.join(' ');
}

