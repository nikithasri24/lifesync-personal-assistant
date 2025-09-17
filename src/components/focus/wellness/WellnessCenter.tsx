/**
 * Wellness Center
 * 
 * Comprehensive wellness and health tracking integrated with focus sessions.
 * Eye strain reminders, posture checks, hydration tracking, mood logging,
 * breathing exercises, and health correlations.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Coffee,
  Heart,
  Activity,
  Brain,
  Moon,
  Sun,
  Droplets,
  Wind,
  Smile,
  Frown,
  Meh,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bell,
  Target,
  BarChart3,
  Zap,
  Shield,
  Timer,
  Award,
  Plus,
  ChevronRight,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface WellnessEvent {
  id: string;
  type: 'eye_strain' | 'posture' | 'hydration' | 'breathing' | 'mood' | 'energy' | 'break';
  timestamp: Date;
  completed: boolean;
  value?: number; // for mood/energy ratings
  notes?: string;
  sessionId?: string;
}

interface HealthMetrics {
  date: Date;
  sleepHours: number;
  sleepQuality: number; // 1-5
  stressLevel: number; // 1-5
  exerciseMinutes: number;
  waterIntake: number; // glasses
  screenTime: number; // minutes
  focusSessionsCount: number;
  focusQuality: number; // 1-5
  mood: number; // 1-5
  energy: number; // 1-5
}

interface WellnessSettings {
  eyeStrainReminders: boolean;
  eyeStrainInterval: number; // minutes
  postureReminders: boolean;
  postureInterval: number;
  hydrationReminders: boolean;
  hydrationInterval: number;
  breathingExercises: boolean;
  moodTracking: boolean;
  energyTracking: boolean;
  sleepCorrelation: boolean;
  maxDailyFocusTime: number; // minutes
  enforceBreaks: boolean;
  minBreakDuration: number; // minutes
}

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  pattern: Array<{ phase: 'inhale' | 'hold' | 'exhale' | 'rest'; duration: number }>;
  totalDuration: number;
  benefits: string[];
  icon: string;
}

interface Props {
  activeFocusSession?: any;
  onWellnessEvent: (event: Omit<WellnessEvent, 'id' | 'timestamp'>) => void;
  onUpdateSettings: (settings: Partial<WellnessSettings>) => void;
}

export const WellnessCenter: React.FC<Props> = ({
  activeFocusSession,
  onWellnessEvent,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reminders' | 'breathing' | 'tracking' | 'analytics'>('dashboard');
  const [wellnessEvents, setWellnessEvents] = useState<WellnessEvent[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [settings, setSettings] = useState<WellnessSettings>({
    eyeStrainReminders: true,
    eyeStrainInterval: 20,
    postureReminders: true,
    postureInterval: 30,
    hydrationReminders: true,
    hydrationInterval: 45,
    breathingExercises: true,
    moodTracking: true,
    energyTracking: true,
    sleepCorrelation: true,
    maxDailyFocusTime: 480,
    enforceBreaks: true,
    minBreakDuration: 5
  });

  const [activeBreathingExercise, setActiveBreathingExercise] = useState<BreathingExercise | null>(null);
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [currentEnergy, setCurrentEnergy] = useState<number>(3);
  const [todayWater, setTodayWater] = useState(0);
  const [showMoodLogger, setShowMoodLogger] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderTimeouts = useRef<NodeJS.Timeout[]>([]);

  const breathingExercises: BreathingExercise[] = [
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Equal counts for inhale, hold, exhale, hold',
      pattern: [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold', duration: 4 },
        { phase: 'exhale', duration: 4 },
        { phase: 'hold', duration: 4 }
      ],
      totalDuration: 300, // 5 minutes
      benefits: ['Reduces stress', 'Improves focus', 'Calms nervous system'],
      icon: '⬜'
    },
    {
      id: '4-7-8',
      name: '4-7-8 Breathing',
      description: 'Inhale 4, hold 7, exhale 8',
      pattern: [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold', duration: 7 },
        { phase: 'exhale', duration: 8 }
      ],
      totalDuration: 240, // 4 minutes
      benefits: ['Promotes sleep', 'Reduces anxiety', 'Lowers heart rate'],
      icon: '🌙'
    },
    {
      id: 'energizing',
      name: 'Energizing Breath',
      description: 'Quick inhale, slow exhale',
      pattern: [
        { phase: 'inhale', duration: 2 },
        { phase: 'exhale', duration: 6 }
      ],
      totalDuration: 180, // 3 minutes
      benefits: ['Increases energy', 'Improves alertness', 'Boosts concentration'],
      icon: '⚡'
    },
    {
      id: 'relaxing',
      name: 'Relaxing Breath',
      description: 'Long, slow breaths',
      pattern: [
        { phase: 'inhale', duration: 6 },
        { phase: 'exhale', duration: 8 }
      ],
      totalDuration: 420, // 7 minutes
      benefits: ['Deep relaxation', 'Stress relief', 'Mental clarity'],
      icon: '🧘'
    }
  ];

  // Generate mock data
  useEffect(() => {
    const generateMockData = () => {
      const events: WellnessEvent[] = [];
      const metrics: HealthMetrics[] = [];
      
      for (let i = 7; i >= 0; i--) {
        const date = subDays(new Date(), i);
        
        // Generate wellness events for the day
        const dayEvents: WellnessEvent[] = [
          {
            id: `eye_${i}_1`,
            type: 'eye_strain',
            timestamp: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
            completed: Math.random() > 0.3,
          },
          {
            id: `eye_${i}_2`,
            type: 'eye_strain',
            timestamp: new Date(date.getTime() + 14 * 60 * 60 * 1000), // 2 PM
            completed: Math.random() > 0.3,
          },
          {
            id: `hydration_${i}_1`,
            type: 'hydration',
            timestamp: new Date(date.getTime() + 10 * 60 * 60 * 1000), // 10 AM
            completed: Math.random() > 0.2,
            value: Math.floor(Math.random() * 3) + 1
          },
          {
            id: `mood_${i}`,
            type: 'mood',
            timestamp: new Date(date.getTime() + 18 * 60 * 60 * 1000), // 6 PM
            completed: true,
            value: Math.floor(Math.random() * 5) + 1
          }
        ];
        
        events.push(...dayEvents);
        
        // Generate health metrics for the day
        metrics.push({
          date,
          sleepHours: Math.random() * 3 + 6, // 6-9 hours
          sleepQuality: Math.floor(Math.random() * 5) + 1,
          stressLevel: Math.floor(Math.random() * 5) + 1,
          exerciseMinutes: Math.random() * 60,
          waterIntake: Math.floor(Math.random() * 8) + 2, // 2-10 glasses
          screenTime: Math.random() * 120 + 300, // 5-7 hours
          focusSessionsCount: Math.floor(Math.random() * 8) + 2,
          focusQuality: Math.floor(Math.random() * 5) + 1,
          mood: Math.floor(Math.random() * 5) + 1,
          energy: Math.floor(Math.random() * 5) + 1
        });
      }
      
      setWellnessEvents(events);
      setHealthMetrics(metrics);
    };

    generateMockData();
  }, []);

  // Set up wellness reminders
  useEffect(() => {
    // Clear existing timeouts
    reminderTimeouts.current.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts.current = [];

    if (!activeFocusSession) return;

    const scheduleReminder = (type: string, interval: number) => {
      const timeout = setTimeout(() => {
        showWellnessReminder(type);
      }, interval * 60 * 1000);
      
      reminderTimeouts.current.push(timeout);
    };

    if (settings.eyeStrainReminders) {
      scheduleReminder('eye_strain', settings.eyeStrainInterval);
    }
    
    if (settings.postureReminders) {
      scheduleReminder('posture', settings.postureInterval);
    }
    
    if (settings.hydrationReminders) {
      scheduleReminder('hydration', settings.hydrationInterval);
    }

    return () => {
      reminderTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [activeFocusSession, settings]);

  const showWellnessReminder = (type: string) => {
    const messages = {
      eye_strain: {
        title: 'Eye Care Reminder 👁️',
        message: 'Time for the 20-20-20 rule: Look at something 20 feet away for 20 seconds!'
      },
      posture: {
        title: 'Posture Check 🧍',
        message: 'Check your posture! Sit up straight, shoulders relaxed, feet flat on the floor.'
      },
      hydration: {
        title: 'Hydration Break 💧',
        message: 'Time to drink some water! Staying hydrated improves focus and energy.'
      }
    };

    const reminder = messages[type as keyof typeof messages];
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: '🎯'
      });
    }

    // Add visual reminder (you could implement a toast notification here)
    console.log(`Wellness reminder: ${reminder.title} - ${reminder.message}`);
  };

  const startBreathingExercise = (exercise: BreathingExercise) => {
    setActiveBreathingExercise(exercise);
    setBreathingTimer(0);
    setBreathingPhase(0);
    setIsBreathing(true);

    breathingIntervalRef.current = setInterval(() => {
      setBreathingTimer(prev => {
        const newTime = prev + 1;
        const currentPattern = exercise.pattern[breathingPhase % exercise.pattern.length];
        
        if (newTime >= currentPattern.duration) {
          setBreathingPhase(prevPhase => prevPhase + 1);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  };

  const stopBreathingExercise = () => {
    setIsBreathing(false);
    setActiveBreathingExercise(null);
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }
    
    // Log breathing exercise completion
    onWellnessEvent({
      type: 'breathing',
      completed: true,
      notes: activeBreathingExercise?.name
    });
  };

  const logMoodAndEnergy = () => {
    onWellnessEvent({
      type: 'mood',
      completed: true,
      value: currentMood
    });
    
    onWellnessEvent({
      type: 'energy',
      completed: true,
      value: currentEnergy
    });
    
    setShowMoodLogger(false);
  };

  const addWaterIntake = () => {
    setTodayWater(prev => prev + 1);
    onWellnessEvent({
      type: 'hydration',
      completed: true,
      value: 1
    });
  };

  const completeEyeStrainExercise = () => {
    onWellnessEvent({
      type: 'eye_strain',
      completed: true
    });
  };

  const getTodayMetrics = () => {
    const today = startOfDay(new Date());
    return healthMetrics.find(m => startOfDay(m.date).getTime() === today.getTime());
  };

  const getTodayEvents = () => {
    const today = new Date();
    return wellnessEvents.filter(event => 
      startOfDay(event.timestamp).getTime() === startOfDay(today).getTime()
    );
  };

  const getWellnessScore = () => {
    const todayEvents = getTodayEvents();
    const completed = todayEvents.filter(e => e.completed).length;
    const total = todayEvents.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getMoodIcon = (mood: number) => {
    if (mood <= 2) return <Frown className="w-6 h-6 text-red-500" />;
    if (mood <= 3) return <Meh className="w-6 h-6 text-yellow-500" />;
    return <Smile className="w-6 h-6 text-green-500" />;
  };

  const getCurrentBreathingPhase = () => {
    if (!activeBreathingExercise) return null;
    return activeBreathingExercise.pattern[breathingPhase % activeBreathingExercise.pattern.length];
  };

  const todayMetrics = getTodayMetrics();
  const todayEvents = getTodayEvents();
  const wellnessScore = getWellnessScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Wellness Center</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Take care of your health while staying productive
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-slate-600 dark:text-slate-300">Today's Wellness Score</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{wellnessScore}%</div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: Activity },
          { key: 'reminders', label: 'Reminders', icon: Bell },
          { key: 'breathing', label: 'Breathing', icon: Wind },
          { key: 'tracking', label: 'Tracking', icon: Target },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={completeEyeStrainExercise}
              className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:shadow-lg transition-all group"
            >
              <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Eye Care</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">20-20-20 Rule</div>
            </button>

            <button
              onClick={addWaterIntake}
              className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl hover:shadow-lg transition-all group"
            >
              <Droplets className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Hydration</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">{todayWater} glasses today</div>
            </button>

            <button
              onClick={() => setShowMoodLogger(true)}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl hover:shadow-lg transition-all group"
            >
              <Heart className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Mood</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Log feelings</div>
            </button>

            <button
              onClick={() => setActiveTab('breathing')}
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl hover:shadow-lg transition-all group"
            >
              <Wind className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Breathing</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Guided exercises</div>
            </button>
          </div>

          {/* Today's Wellness */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Wellness</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Completed Activities</h4>
                <div className="space-y-2">
                  {todayEvents.filter(e => e.completed).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                        {event.type.replace('_', ' ')} at {format(event.timestamp, 'HH:mm')}
                      </span>
                    </div>
                  ))}
                  {todayEvents.filter(e => e.completed).length === 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      No activities completed yet today
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Pending Reminders</h4>
                <div className="space-y-2">
                  {todayEvents.filter(e => !e.completed).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {todayEvents.filter(e => !e.completed).length === 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      All reminders completed! 🎉
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Health Snapshot</h4>
                {todayMetrics && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Sleep Quality</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {todayMetrics.sleepQuality}/5
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Water Intake</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {todayWater} glasses
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Mood</span>
                      <span className="flex items-center space-x-1">
                        {getMoodIcon(todayMetrics.mood)}
                        <span className="font-medium text-slate-900 dark:text-white">
                          {todayMetrics.mood}/5
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Focus Session Health */}
          {activeFocusSession && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Focus Session Health</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.floor(activeFocusSession.duration / 60)}</div>
                  <div className="text-sm text-indigo-100">Minutes Focused</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {todayEvents.filter(e => e.completed && e.type === 'eye_strain').length}
                  </div>
                  <div className="text-sm text-indigo-100">Eye Breaks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{todayWater}</div>
                  <div className="text-sm text-indigo-100">Water Glasses</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breathing Tab */}
      {activeTab === 'breathing' && (
        <div className="space-y-6">
          {activeBreathingExercise ? (
            <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">{activeBreathingExercise.name}</h3>
              <p className="text-purple-100 mb-8">{activeBreathingExercise.description}</p>
              
              <div className="relative w-48 h-48 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-white/30"></div>
                <div 
                  className="absolute inset-4 rounded-full bg-white/20 transition-all duration-1000 flex items-center justify-center"
                  style={{
                    transform: getCurrentBreathingPhase()?.phase === 'inhale' ? 'scale(1.2)' :
                               getCurrentBreathingPhase()?.phase === 'exhale' ? 'scale(0.8)' : 'scale(1)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getCurrentBreathingPhase()?.duration - breathingTimer}</div>
                    <div className="text-sm capitalize">{getCurrentBreathingPhase()?.phase}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={stopBreathingExercise}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                >
                  <Square size={20} />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {breathingExercises.map((exercise) => (
                <div key={exercise.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">{exercise.icon}</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {exercise.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      {exercise.description}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {Math.floor(exercise.totalDuration / 60)} minutes
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Benefits:</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      {exercise.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => startBreathingExercise(exercise)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all"
                  >
                    Start Exercise
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mood Logger Modal */}
      {showMoodLogger && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              How are you feeling?
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Mood
                </label>
                <div className="flex justify-between items-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setCurrentMood(value)}
                      className={`p-3 rounded-full transition-all ${
                        currentMood === value
                          ? 'bg-blue-500 text-white scale-110'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {value <= 2 ? <Frown size={24} /> : value <= 3 ? <Meh size={24} /> : <Smile size={24} />}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Very Bad</span>
                  <span>Great</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Energy Level
                </label>
                <div className="flex justify-between items-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setCurrentEnergy(value)}
                      className={`p-3 rounded-full transition-all ${
                        currentEnergy === value
                          ? 'bg-orange-500 text-white scale-110'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <Zap size={24} />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Exhausted</span>
                  <span>Energized</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowMoodLogger(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={logMoodAndEnergy}
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Log Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};