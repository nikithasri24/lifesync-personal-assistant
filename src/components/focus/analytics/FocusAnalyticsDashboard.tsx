/**
 * Focus Analytics Dashboard
 * 
 * Comprehensive analytics and insights dashboard showing productivity metrics,
 * trends, achievements, goals progress, and personalized recommendations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
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
  Fire,
  Trophy,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { format, subDays, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
  achievements: Array<{ id: string; name: string; icon: string; unlockedAt: Date; rarity: string }>;
  insights: Array<{ type: string; title: string; description: string; priority: string }>;
  goals: Array<{ id: string; title: string; progress: number; target: number; status: string }>;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInsights, setShowInsights] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        totalSessions: 47,
        totalFocusTime: 1240, // minutes
        averageSessionLength: 26.4,
        completionRate: 87,
        currentStreak: 5,
        longestStreak: 12,
        productivityScore: 85,
        focusQuality: 78,
        weeklyStats: [
          { day: 'Mon', sessions: 8, focusTime: 180, productivity: 85 },
          { day: 'Tue', sessions: 6, focusTime: 145, productivity: 90 },
          { day: 'Wed', sessions: 9, focusTime: 220, productivity: 88 },
          { day: 'Thu', sessions: 7, focusTime: 165, productivity: 82 },
          { day: 'Fri', sessions: 5, focusTime: 120, productivity: 75 },
          { day: 'Sat', sessions: 6, focusTime: 180, productivity: 92 },
          { day: 'Sun', sessions: 6, focusTime: 230, productivity: 95 }
        ],
        monthlyTrends: [
          { week: 'Week 1', sessions: 35, focusTime: 850 },
          { week: 'Week 2', sessions: 42, focusTime: 1020 },
          { week: 'Week 3', sessions: 38, focusTime: 920 },
          { week: 'Week 4', sessions: 47, focusTime: 1240 }
        ],
        hourlyHeatmap: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: Math.random() * 10
        })),
        categoryBreakdown: [
          { category: 'Deep Work', time: 420, sessions: 15 },
          { category: 'Creative', time: 280, sessions: 12 },
          { category: 'Learning', time: 310, sessions: 14 },
          { category: 'Planning', time: 150, sessions: 6 },
          { category: 'Breaks', time: 80, sessions: 8 }
        ],
        achievements: [
          { id: '1', name: 'First Week', icon: '🏆', unlockedAt: new Date(), rarity: 'common' },
          { id: '2', name: 'Focus Master', icon: '🧠', unlockedAt: new Date(), rarity: 'rare' },
          { id: '3', name: 'Streak Champion', icon: '🔥', unlockedAt: new Date(), rarity: 'epic' }
        ],
        insights: [
          {
            type: 'positive',
            title: 'Great Morning Focus!',
            description: 'You\'re 23% more productive in the morning hours (9-11 AM)',
            priority: 'high'
          },
          {
            type: 'suggestion',
            title: 'Break Optimization',
            description: 'Consider shorter 5-minute breaks for better flow maintenance',
            priority: 'medium'
          },
          {
            type: 'warning',
            title: 'Afternoon Dip',
            description: 'Your focus quality drops 15% after 2 PM. Try a power nap!',
            priority: 'medium'
          }
        ],
        goals: [
          { id: '1', title: 'Daily Focus Goal', progress: 85, target: 120, status: 'active' },
          { id: '2', title: 'Weekly Sessions', progress: 23, target: 30, status: 'active' },
          { id: '3', title: 'Productivity Score', progress: 85, target: 90, status: 'active' }
        ],
        distractions: {
          total: 23,
          sources: [
            { source: 'Social Media', count: 8 },
            { source: 'Email', count: 5 },
            { source: 'Phone', count: 4 },
            { source: 'Other', count: 6 }
          ],
          timeOfDay: {
            9: 2, 10: 1, 11: 3, 14: 4, 15: 5, 16: 3, 17: 2, 19: 3
          }
        },
        wellness: {
          moodAvg: 4.2,
          energyAvg: 3.8,
          eyeStrainEvents: 12,
          hydrationReminders: 8
        }
      };
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [period]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getGoalProgress = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
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
              <Fire className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
            {analyticsData.weeklyStats.map((day, index) => (
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