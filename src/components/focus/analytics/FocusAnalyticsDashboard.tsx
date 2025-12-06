/**
 * Focus Analytics Dashboard
 *
 * Comprehensive analytics and insights dashboard showing productivity metrics,
 * trends, achievements, goals progress, and personalized recommendations.
 */

/* eslint-disable max-lines */
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../../../services/apiClient'
import {
  _BarChart3,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Brain,
  Coffee,
  Eye,
  Heart,
  Download,
  Filter,
  ChevronRight,
  Star,
  Flame,
  Trophy,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns'
import { useAppStore } from '../../../stores/useAppStore'
import { logger } from '../../../services/logger';

// Types for focus session data from API
interface FocusSession {
  start_time?: string;
  startTime?: string;
  actual_duration?: number;
  duration?: number;
  status?: string;
  preset?: string;
}

type InsightType = 'positive' | 'suggestion' | 'warning'
type InsightPriority = 'low' | 'medium' | 'high'
type GoalStatus = 'active' | 'paused' | 'completed'
type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  productivityScore: number;
  focusQuality: number;
  weeklyStats: Array<{ day: string; sessions: number; focusTime: number; productivity: number }>;
  monthlyTrends: Array<{ week: string; sessions: number; focusTime: number }>;
  hourlyHeatmap: Array<{ hour: number; value: number }>;
  categoryBreakdown: Array<{ category: string; time: number; sessions: number }>;
  achievements: Array<{ id: string; name: string; icon: string; unlockedAt: Date; rarity: AchievementRarity }>;
  insights: Array<{ type: InsightType; title: string; description: string; priority: InsightPriority }>;
  goals: Array<{ id: string; title: string; progress: number; target: number; status: GoalStatus }>;
  distractions: {
    total: number;
    sources: Array<{ source: string; count: number }>;
    timeOfDay: Record<number, number>;
  };
  wellness: {
    moodAvg: number;
    energyAvg: number;
    eyeStrainEvents: number;
    hydrationReminders: number;
  };
}

interface Props {
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange: (period: string) => void;
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
}

export const FocusAnalyticsDashboard: React.FC<Props> = ({ 
  period, 
  onPeriodChange, 
  onExport 
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Define defaultAnalytics as a useCallback to avoid re-creating on every render
  const defaultAnalytics = useCallback((): AnalyticsData => ({
    totalSessions: 0,
    totalFocusTime: 0,
    averageSessionLength: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    productivityScore: 0,
    focusQuality: 0,
    weeklyStats: [],
    monthlyTrends: [],
    hourlyHeatmap: Array.from({ length: 24 }, (_: unknown, hour: number) => ({ hour, value: 0 })),
    categoryBreakdown: [],
    achievements: [],
    insights: [],
    goals: [],
    distractions: {
      total: 0,
      sources: [],
      timeOfDay: {},
    },
    wellness: {
      moodAvg: 0,
      energyAvg: 0,
      eyeStrainEvents: 0,
      hydrationReminders: 0,
    },
  }), []);

  const calculateStreaks = useCallback((sessions: FocusSession[]): { current: number; longest: number } => {
    if (sessions.length === 0) {
      return { current: 0, longest: 0 }
    }

    const uniqueDays = Array.from(
      new Set(
        sessions.map((session) =>
          format(new Date(session.start_time ?? session.startTime ?? Date.now()), 'yyyy-MM-dd'),
        ),
      ),
    )
      .map((day) => new Date(day))
      .sort((a, b) => a.getTime() - b.getTime())

    let current = 1
    let longest = 1

    for (let i = 1; i < uniqueDays.length; i += 1) {
      const prev = uniqueDays[i - 1]
      const currentDay = uniqueDays[i]
      const diff = (currentDay.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        current += 1
        longest = Math.max(longest, current)
      } else {
        current = 1
      }
    }

    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const lastKey = format(uniqueDays[uniqueDays.length - 1], 'yyyy-MM-dd')
    if (todayKey !== lastKey) {
      current = 0
    }

    return { current, longest }
  }, []);

  const generateAnalyticsFromSessions = useCallback((sessions: FocusSession[]): AnalyticsData => {
    if (sessions.length === 0) {
      return defaultAnalytics()
    }

    const sorted = [...sessions].sort((a, b) => new Date(a.start_time ?? a.startTime ?? 0).getTime() - new Date(b.start_time ?? b.startTime ?? 0).getTime())
    const totalSessions = sorted.length
    const totalFocusTime = sorted.reduce((sum: number, session) => sum + (session.actual_duration ?? session.duration ?? 0), 0)
    const averageSessionLength = totalSessions ? Math.round(totalFocusTime / totalSessions) : 0

    const completedSessions = sorted.filter((session) => session.status === 'completed').length
    const completionRate = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0

    const dayMap = new Map<string, { sessions: number; focusTime: number }>()
    sorted.forEach((session) => {
      const date = new Date(session.start_time ?? session.startTime ?? Date.now())
      const dayKey = format(date, 'EEE')
      const entry = dayMap.get(dayKey) ?? { sessions: 0, focusTime: 0 }
      entry.sessions += 1
      entry.focusTime += session.actual_duration ?? session.duration ?? 0
      dayMap.set(dayKey, entry)
    })

    const { weekStartsOn } = useAppStore.getState()
    const weekStart = startOfWeek(new Date(), { weekStartsOn })
    const orderedDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn }) })
    const weeklyStats = orderedDays.map((date) => {
      const key = format(date, 'EEE')
      const entry = dayMap.get(key) ?? { sessions: 0, focusTime: 0 }
      const productivity = entry.sessions ? Math.min(100, Math.round((entry.focusTime / (entry.sessions * 60)) * 100)) : 0
      return {
        day: key,
        sessions: entry.sessions,
        focusTime: entry.focusTime,
        productivity,
      }
    })

    const hourlyHeatmap = Array.from({ length: 24 }, (_: unknown, hour: number) => ({ hour, value: 0 }))
    sorted.forEach((session) => {
      const date = new Date(session.start_time ?? session.startTime ?? Date.now())
      const hour = date.getHours()
      hourlyHeatmap[hour].value += session.actual_duration ?? session.duration ?? 0
    })

    const categoryMap = new Map<string, { time: number; sessions: number }>()
    sorted.forEach((session) => {
      const category = session.preset ?? 'General'
      const entry = categoryMap.get(category) ?? { time: 0, sessions: 0 }
      entry.time += session.actual_duration ?? session.duration ?? 0
      entry.sessions += 1
      categoryMap.set(category, entry)
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      time: value.time,
      sessions: value.sessions,
    }))

    const insights: AnalyticsData['insights'] = categoryBreakdown.length
      ? [
          {
            type: 'positive' as const,
            title: 'Consistent Focus Detected',
            description: `You completed ${completionRate}% of your sessions this week.`,
            priority: 'medium' as const,
          },
        ]
      : []

    const goals: AnalyticsData['goals'] = [
      {
        id: 'weekly-sessions',
        title: 'Weekly Sessions',
        progress: totalSessions,
        target: 25,
        status: totalSessions >= 25 ? ('completed' as const) : ('active' as const),
      },
    ]

    const distractions: AnalyticsData['distractions'] = {
      total: 0,
      sources: [],
      timeOfDay: {},
    }

    const wellness: AnalyticsData['wellness'] = {
      moodAvg: 0,
      energyAvg: 0,
      eyeStrainEvents: 0,
      hydrationReminders: 0,
    }

    const streaks = calculateStreaks(sorted)

    return {
      totalSessions,
      totalFocusTime,
      averageSessionLength,
      completionRate,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      productivityScore: Math.min(100, Math.round(averageSessionLength / 40 * 100)),
      focusQuality: Math.min(100, completionRate),
      weeklyStats,
      monthlyTrends: [
        {
          week: format(startOfWeek(new Date(), { weekStartsOn }), 'MMM d'),
          sessions: totalSessions,
          focusTime: totalFocusTime,
        },
      ],
      hourlyHeatmap,
      categoryBreakdown,
      achievements: [],
      insights,
      goals,
      distractions,
      wellness,
    }
  }, [calculateStreaks, defaultAnalytics]);

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalytics = async (): Promise<void> => {
      setIsLoading(true);

      try {
        // Load real focus session data from Supabase
        const sessions = await apiClient.getFocusSessions() as FocusSession[];

        // Generate analytics from real session data
        const generated = generateAnalyticsFromSessions(sessions);
        setAnalyticsData(generated);
      } catch (error) {
        logger.error('Failed to load focus analytics:', { error });
        setAnalyticsData(defaultAnalytics());
      }
      setIsLoading(false);
    };

    void loadAnalytics();
  }, [period, generateAnalyticsFromSessions, defaultAnalytics]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getInsightIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getGoalProgress = (progress: number, target: number): number => {
    return Math.min((progress / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }, (_: unknown, i: number) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }, (_: unknown, i: number) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Focus Analytics</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Insights and trends for your productivity journey
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {['day', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <div className="relative group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
              <Download size={16} />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => onExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
              >
                CSV
              </button>
              <button
                onClick={() => onExport('json')}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
              >
                JSON
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {formatTime(analyticsData.totalFocusTime)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Focus Time
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Rate</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {analyticsData.completionRate}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Completion Rate
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Days</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {analyticsData.currentStreak}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Current Streak
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Score</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {analyticsData.productivityScore}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Productivity
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Weekly Progress</h3>
          <div className="space-y-4">
            {analyticsData.weeklyStats.map((day, _index) => (
              <div key={day.day} className="flex items-center space-x-4">
                <div className="w-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {day.day}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{day.sessions} sessions</span>
                    <span>{formatTime(day.focusTime)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(day.productivity / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-white w-12 text-right">
                  {day.productivity}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Focus Categories</h3>
          <div className="space-y-4">
            {analyticsData.categoryBreakdown.map((category, index) => {
              const percentage = (category.time / analyticsData.totalFocusTime) * 100;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
              
              return (
                <div key={category.category} className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-900 dark:text-white">{category.category}</span>
                      <span className="text-slate-600 dark:text-slate-300">{formatTime(category.time)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${colors[index % colors.length]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
                    {Math.round(percentage)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Goal Progress</h3>
          <div className="space-y-4">
            {analyticsData.goals.map((goal) => {
              const progress = getGoalProgress(goal.progress, goal.target);
              const isCompleted = progress >= 100;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{goal.title}</span>
                    <div className="flex items-center space-x-2">
                      {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {goal.progress}/{goal.target}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Achievements</h3>
          <div className="space-y-3">
            {analyticsData.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{achievement.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {format(achievement.unlockedAt, 'MMM d, yyyy')}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {achievement.rarity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {showInsights && analyticsData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Insights</h3>
            <button
              onClick={() => setShowInsights(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ×
            </button>
          </div>
          <div className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {insight.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {insight.description}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  insight.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {insight.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wellness Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Mood</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analyticsData.wellness.moodAvg.toFixed(1)}/5
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Average this week</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Energy</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analyticsData.wellness.energyAvg.toFixed(1)}/5
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Average this week</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Eye Care</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analyticsData.wellness.eyeStrainEvents}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Reminders completed</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Coffee className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Hydration</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {analyticsData.wellness.hydrationReminders}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Glasses completed</div>
        </div>
      </div>
    </div>
  );
};
