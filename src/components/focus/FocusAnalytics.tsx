/**
 * Focus Analytics Component
 * 
 * Displays detailed analytics and insights for focus sessions including
 * charts, trends, productivity metrics, and personalized recommendations.
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  Calendar,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Filter
} from 'lucide-react';
import { useFocusAnalytics } from '../../hooks/useFocus';

interface FocusAnalyticsProps {
  period?: 'day' | 'week' | 'month' | 'year';
  showDetailed?: boolean;
}

export const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ 
  period = 'week',
  showDetailed = true 
}) => {
  const { analytics, isLoading, error, refresh, exportData } = useFocusAnalytics(period);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Analytics Data
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            Start some focus sessions to see your analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Focus Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={refresh}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Refresh Data"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportData('csv')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Focus Time</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatDuration(analytics.totalFocusTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Completion Rate</p>
                <p className={`text-xl font-bold ${getScoreColor(analytics.completionRate)}`}>
                  {Math.round(analytics.completionRate)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Avg Focus Score</p>
                <p className={`text-xl font-bold ${getScoreColor(analytics.averageProductivityScore)}`}>
                  {Math.round(analytics.averageProductivityScore)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Sessions</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {analytics.totalSessions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <button
            onClick={() => toggleSection('insights')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              💡 Insights & Recommendations
            </h3>
            {expandedSections.includes('insights') ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections.includes('insights') && (
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'celebration' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    insight.type === 'recommendation' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                    'border-slate-500 bg-slate-50 dark:bg-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {insight.description}
                      </p>
                    </div>
                    {insight.actionable && (
                      <button className="ml-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goals Progress */}
      {analytics.goals.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <button
            onClick={() => toggleSection('goals')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              🎯 Goals Progress
            </h3>
            {expandedSections.includes('goals') ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections.includes('goals') && (
            <div className="space-y-4">
              {analytics.goals.map((goal, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {goal.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {goal.current} / {goal.target}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Distractions */}
      {analytics.topDistractions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <button
            onClick={() => toggleSection('distractions')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              🚨 Top Distractions
            </h3>
            {expandedSections.includes('distractions') ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections.includes('distractions') && (
            <div className="space-y-3">
              {analytics.topDistractions.slice(0, 5).map((distraction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {distraction.source}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {distraction.count} interruptions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {Math.round(distraction.totalTime / 60)}m
                    </p>
                    <p className="text-xs text-slate-500">
                      total time
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      {analytics.achievements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <button
            onClick={() => toggleSection('achievements')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              🏆 Recent Achievements
            </h3>
            {expandedSections.includes('achievements') ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections.includes('achievements') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-2 ${
                    achievement.unlockedAt 
                      ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  
                  {!achievement.unlockedAt && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-300">Progress</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {achievement.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                        <div 
                          className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};