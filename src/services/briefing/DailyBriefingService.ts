/**
 * Daily Briefing Service
 * Generates personalized morning briefings with schedule, tasks, habits, and weather
 *
 * ARCHITECTURE: Uses cache accessor for data access (benefits from React Query cache)
 */

import { cacheAccessor } from '@/lib/cacheAccessor';
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

// Get user's current location via browser geolocation
async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Silently handle location errors - briefing works without location
        // Only log permission errors for debugging
        if (error.code === error.PERMISSION_DENIED) {
          logger.debug('Briefing', 'Location permission denied');
        }
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 300000, // 5s timeout, cache for 5 min
        enableHighAccuracy: false, // Use low accuracy for briefing to avoid errors
      }
    );
  });
}

export async function generateDailyBriefing(
  options: Partial<BriefingOptions> = {}
): Promise<DailyBriefing> {
  const opts = { ...DEFAULT_BRIEFING_OPTIONS, ...options };

  // Auto-detect location if not provided and weather is enabled
  let weatherLocation = opts.weatherLocation;
  if (opts.includeWeather && !weatherLocation) {
    weatherLocation = await getCurrentLocation() ?? undefined;
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch all data in parallel using cache accessor (benefits from React Query cache)
  const [allEvents, allTasks, allHabits, habitEntries, weatherResult] =
    await Promise.all([
      // Calendar events for today
      cacheAccessor.getCalendarEvents(),

      // All tasks (we'll filter for today/overdue)
      cacheAccessor.getTasks(),

      // Active habits
      cacheAccessor.getHabits(),

      // Today's habit entries
      cacheAccessor.getHabitEntriesForDate(today),

      // Weather (if location available)
      opts.includeWeather && weatherLocation
        ? fetchWeather(weatherLocation.lat, weatherLocation.lng, opts.temperatureUnit)
        : Promise.resolve(null),
    ]);

  // Filter events for today
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;
  const todayEvents = (allEvents || []).filter((e) =>
    e.start_date >= todayStart && e.start_date <= todayEnd
  );

  // Process events
  const events: BriefingEvent[] = todayEvents
    .slice(0, opts.maxEvents)
    .map((e) => {
      // Map event types to briefing types
      // CalendarEvent has: 'event' | 'meeting' | 'reminder' | 'birthday' | 'holiday'
      // BriefingEvent has: 'meeting' | 'appointment' | 'event' | 'reminder'
      let briefingType: 'meeting' | 'appointment' | 'event' | 'reminder' = 'event';
      if (e.type === 'meeting' || e.type === 'reminder') {
        briefingType = e.type;
      } else if (e.type === 'birthday' || e.type === 'holiday') {
        briefingType = 'event';
      }

      return {
        id: e.id,
        title: e.title,
        startTime: e.start_date,
        endTime: e.end_date,
        location: e.location || undefined,
        isAllDay: e.all_day || false,
        type: briefingType,
      };
    });

  const totalEvents = todayEvents.length;
  const firstEventTime = events[0]?.startTime;
  const busyHours = events.reduce((sum, e) => {
    if (e.isAllDay) return sum;
    return sum + differenceInHours(parseISO(e.endTime), parseISO(e.startTime));
  }, 0);

  // Filter tasks for today or overdue (not done, not deleted, with id)
  const tasksForBriefing = (allTasks || []).filter((t) =>
    t.id &&
    t.status !== 'done' &&
    !t.deleted &&
    t.due_date &&
    (t.due_date === today || isBefore(parseISO(t.due_date), new Date()))
  );

  // Process tasks
  const priorityTasks: BriefingTask[] = tasksForBriefing
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
    })
    .slice(0, opts.maxTasks)
    .map((t) => {
      // Map priority: 'important' -> 'high' for briefing compatibility
      let briefingPriority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high' || t.priority === 'urgent') {
        briefingPriority = t.priority;
      } else if (t.priority === 'important') {
        briefingPriority = 'high';
      }

      return {
        id: t.id!,
        title: t.title,
        priority: briefingPriority,
        dueTime: t.due_date || undefined,
        estimatedMinutes: t.estimated_time || undefined,
        isOverdue: t.due_date ? isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date)) : false,
      };
    });

  const overdueTasks = tasksForBriefing.filter(
    (t) => t.due_date && isBefore(parseISO(t.due_date), new Date()) && !isToday(parseISO(t.due_date))
  ).length;

  // Process habits (filter for active only)
  const activeHabits = (allHabits || []).filter((h) => h.is_active && h.id);
  const completedHabitIds = new Set((habitEntries || []).map((e) => e.habit_id));
  const habitsToComplete: BriefingHabit[] = activeHabits
    .map((h) => ({
      id: h.id!,
      name: h.name,
      currentStreak: h.streak_count || 0,
      isAtRisk: (h.streak_count || 0) > 0 && !completedHabitIds.has(h.id!),
      isCompleted: completedHabitIds.has(h.id!),
    }))
    .filter((h) => !h.isCompleted)
    .slice(0, opts.maxHabits);

  const streaksAtRisk = habitsToComplete.filter((h) => h.isAtRisk).length;

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
    totalTasksDue: tasksForBriefing.length,
    overdueTasks,
    habitsToComplete,
    streaksAtRisk,
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

