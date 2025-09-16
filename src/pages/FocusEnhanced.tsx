/**
 * Enhanced Focus Application
 * 
 * Complete focus productivity app with all advanced features:
 * - Analytics & Insights Dashboard
 * - Gamification with achievements, goals, and levels
 * - Advanced Timer with templates and Pomodoro cycles
 * - Task Management Integration
 * - Wellness & Health Tracking
 * - Social Features & Challenges
 * - Personalization & Settings
 * - Background Music & Sounds
 * - Smart Notifications
 */

import { useState, useEffect } from 'react';
import { 
  Timer,
  BarChart3,
  Trophy,
  CheckSquare,
  Heart,
  Users,
  Settings,
  Zap,
  Target,
  Sparkles,
  Crown,
  Brain,
  Coffee,
  Music,
  Bell,
  Calendar,
  Bookmark
} from 'lucide-react';

// Import all our enhanced components
import { FocusAnalyticsDashboard } from '../components/focus/analytics/FocusAnalyticsDashboard';
import { GamificationHub } from '../components/focus/gamification/GamificationHub';
import { AdvancedTimer } from '../components/focus/timer/AdvancedTimer';
import { TaskFocusIntegration } from '../components/focus/tasks/TaskFocusIntegration';
import { WellnessCenter } from '../components/focus/wellness/WellnessCenter';
import { FocusIntegrations } from '../components/focus/FocusIntegrations';

// Types
import { UserProfile, FocusSession, Achievement, Goal, Task, WellnessEvent } from '../types/focusEnhanced';

export default function FocusEnhanced() {
  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'gamification' | 'tasks' | 'wellness' | 'social' | 'settings'>('timer');
  const [activeFocusSession, setActiveFocusSession] = useState<FocusSession | null>(null);
  const [backgroundMusic, setBackgroundMusic] = useState(false);
  const [musicType, setMusicType] = useState('rain');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // User profile and progress
  const [userProfile] = useState<UserProfile>({
    id: 'user1',
    username: 'FocusWarrior',
    level: 12,
    xp: 8450,
    xpToNextLevel: 1550,
    totalXP: 8450,
    rank: 'Focus Master',
    currentStreak: 7,
    longestStreak: 21,
    joinDate: new Date('2024-01-15'),
    avatar: '🧠'
  });

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Enhanced navigation with feature indicators
  const navigationTabs = [
    { 
      key: 'timer', 
      label: 'Focus Timer', 
      icon: Timer, 
      color: 'from-indigo-500 to-purple-500',
      description: 'Advanced timer with templates'
    },
    { 
      key: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      color: 'from-blue-500 to-cyan-500',
      description: 'Insights and productivity metrics'
    },
    { 
      key: 'gamification', 
      label: 'Progress', 
      icon: Trophy, 
      color: 'from-yellow-500 to-orange-500',
      description: 'Achievements, goals, and levels'
    },
    { 
      key: 'tasks', 
      label: 'Tasks', 
      icon: CheckSquare, 
      color: 'from-green-500 to-emerald-500',
      description: 'Task management and time tracking'
    },
    { 
      key: 'wellness', 
      label: 'Wellness', 
      icon: Heart, 
      color: 'from-pink-500 to-rose-500',
      description: 'Health reminders and tracking'
    },
    { 
      key: 'social', 
      label: 'Social', 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      description: 'Teams, challenges, and leaderboards'
    },
    { 
      key: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      color: 'from-slate-500 to-gray-500',
      description: 'Integrations and preferences'
    }
  ];

  // Session management
  const handleSessionComplete = (session: any) => {
    console.log('Session completed:', session);
    setActiveFocusSession(null);
    
    // Award XP and update profile
    // This would typically update your state management store
  };

  const handleBreakComplete = (breakData: any) => {
    console.log('Break completed:', breakData);
  };

  const handleTemplateComplete = (template: any) => {
    console.log('Template completed:', template);
    setActiveFocusSession(null);
  };

  const handleStartFocusSession = (taskId: string, estimatedDuration: number) => {
    const session: FocusSession = {
      id: `session_${Date.now()}`,
      taskId,
      duration: estimatedDuration * 60, // Convert to seconds
      actualDuration: 0,
      startTime: new Date(),
      endTime: new Date(),
      productivity: 0
    };
    
    setActiveFocusSession(session);
    console.log('Started focus session for task:', taskId);
  };

  const handleTaskComplete = (taskId: string) => {
    console.log('Task completed:', taskId);
    // Award bonus XP for task completion
  };

  const handleCreateGoal = (goal: any) => {
    console.log('Created new goal:', goal);
    // Add to goals state
  };

  const handleJoinChallenge = (challengeId: string) => {
    console.log('Joined challenge:', challengeId);
    // Update challenge participation
  };

  const handleWellnessEvent = (event: Omit<WellnessEvent, 'id' | 'timestamp'>) => {
    console.log('Wellness event:', event);
    // Log wellness activity and potentially award XP
  };

  const handleUpdateWellnessSettings = (settings: any) => {
    console.log('Updated wellness settings:', settings);
    // Save wellness preferences
  };

  const handleAnalyticsExport = (format: 'csv' | 'json' | 'pdf') => {
    console.log('Exporting analytics as:', format);
    // Implement export functionality
  };

  const handleAnalyticsPeriodChange = (period: string) => {
    console.log('Changed analytics period to:', period);
    // Update analytics view
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  FocusMax Pro
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  The ultimate productivity companion
                </p>
              </div>
            </div>

            {/* User Profile Summary */}
            <div className="flex items-center space-x-6">
              {/* Active Session Indicator */}
              {activeFocusSession && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Focus Active</span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{userProfile.xp.toLocaleString()}</span>
                  <span className="text-slate-600 dark:text-slate-300">XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-slate-900 dark:text-white">{userProfile.currentStreak}</span>
                  <span className="text-slate-600 dark:text-slate-300">day streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-slate-900 dark:text-white">Level {userProfile.level}</span>
                </div>
              </div>

              {/* User Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {userProfile.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-2 shadow-xl border border-white/20 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {navigationTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative p-4 rounded-xl transition-all duration-200 group ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <tab.icon size={24} className={`${activeTab === tab.key ? 'text-white' : ''} group-hover:scale-110 transition-transform`} />
                  <div className="text-center">
                    <div className={`text-sm font-medium ${activeTab === tab.key ? 'text-white' : ''}`}>
                      {tab.label}
                    </div>
                    <div className={`text-xs ${activeTab === tab.key ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'} hidden md:block`}>
                      {tab.description}
                    </div>
                  </div>
                </div>
                
                {/* Active indicator */}
                {activeTab === tab.key && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'timer' && (
            <AdvancedTimer
              onSessionComplete={handleSessionComplete}
              onBreakComplete={handleBreakComplete}
              onTemplateComplete={handleTemplateComplete}
              backgroundMusic={backgroundMusic}
              musicType={musicType}
              soundEnabled={soundEnabled}
              notificationsEnabled={notificationsEnabled}
            />
          )}

          {activeTab === 'analytics' && (
            <FocusAnalyticsDashboard
              period="week"
              onPeriodChange={handleAnalyticsPeriodChange}
              onExport={handleAnalyticsExport}
            />
          )}

          {activeTab === 'gamification' && (
            <GamificationHub
              userProfile={userProfile}
              onCreateGoal={handleCreateGoal}
              onJoinChallenge={handleJoinChallenge}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskFocusIntegration
              onStartFocusSession={handleStartFocusSession}
              onTaskComplete={handleTaskComplete}
              activeFocusSession={activeFocusSession}
            />
          )}

          {activeTab === 'wellness' && (
            <WellnessCenter
              activeFocusSession={activeFocusSession}
              onWellnessEvent={handleWellnessEvent}
              onUpdateSettings={handleUpdateWellnessSettings}
            />
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Coming Soon - Social Features */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">Social Features Coming Soon!</h3>
                <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
                  Connect with friends, join team challenges, compete on leaderboards, and share your productivity achievements.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">👥 Team Challenges</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">🏆 Leaderboards</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">🤝 Focus Buddies</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">🎯 Group Goals</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <FocusIntegrations />
              
              {/* Additional Settings Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audio Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Music className="w-5 h-5" />
                    <span>Audio Settings</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Background Music</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Play ambient sounds during focus sessions</div>
                      </div>
                      <button
                        onClick={() => setBackgroundMusic(!backgroundMusic)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all ${
                          backgroundMusic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            backgroundMusic ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Sound Effects</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Completion sounds and notifications</div>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all ${
                          soundEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            soundEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">Desktop Notifications</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Session completions and reminders</div>
                      </div>
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-all ${
                          notificationsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Quick Actions */}
      {activeFocusSession && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 shadow-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.floor(activeFocusSession.duration / 60)}:{(activeFocusSession.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-indigo-200">Active Session</div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                  <Timer size={20} />
                </button>
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
                  <Heart size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}