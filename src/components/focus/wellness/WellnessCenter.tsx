import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Settings,
  Bell,
  Target,
  BarChart3,
  Wind
} from 'lucide-react';
import { logger } from '../../../services/logger';
import { type WellnessEvent, type HealthMetrics, type WellnessSettings, type BreathingExercise, type FocusSessionType } from './types';
import { breathingExercises } from './constants';
import { generateMockData, getTodayMetrics, getTodayEvents, getWellnessScore } from './utils';
import { BreathingExerciseCard } from './BreathingExerciseCard';
import { ActiveBreathingExercise } from './ActiveBreathingExercise';
import { MoodLoggerModal } from './MoodLoggerModal';
import { DashboardTab } from './DashboardTab';

interface Props {
  activeFocusSession?: FocusSessionType;
  onWellnessEvent: (event: Omit<WellnessEvent, 'id' | 'timestamp'>) => void;
  _onUpdateSettings: (settings: Partial<WellnessSettings>) => void;
}

export const WellnessCenter: React.FC<Props> = ({
  activeFocusSession,
  onWellnessEvent,
  _onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reminders' | 'breathing' | 'tracking' | 'analytics'>('dashboard');
  const [wellnessEvents, setWellnessEvents] = useState<WellnessEvent[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [settings, _setSettings] = useState<WellnessSettings>({
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
  const [_isBreathing, setIsBreathing] = useState(false);
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [currentEnergy, setCurrentEnergy] = useState<number>(3);
  const [todayWater, setTodayWater] = useState(0);
  const [showMoodLogger, setShowMoodLogger] = useState(false);
  const [_showSettings, setShowSettings] = useState(false);

  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reminderTimeouts = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const data = generateMockData();
    setWellnessEvents(data.events);
    setHealthMetrics(data.metrics);
  }, []);

  useEffect(() => {
    reminderTimeouts.current.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts.current = [];

    if (!activeFocusSession) return;

    const scheduleReminder = (type: string, interval: number): void => {
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

  const showWellnessReminder = (type: string): void => {
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

    logger.debug('WellnessCenter', `Wellness reminder: ${reminder.title} - ${reminder.message}`);
  };

  const startBreathingExercise = (exercise: BreathingExercise): void => {
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

  const stopBreathingExercise = (): void => {
    setIsBreathing(false);
    setActiveBreathingExercise(null);
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }

    onWellnessEvent({
      type: 'breathing',
      completed: true,
      notes: activeBreathingExercise?.name
    });
  };

  const logMoodAndEnergy = (): void => {
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

  const addWaterIntake = (): void => {
    setTodayWater(prev => prev + 1);
    onWellnessEvent({
      type: 'hydration',
      completed: true,
      value: 1
    });
  };

  const completeEyeStrainExercise = (): void => {
    onWellnessEvent({
      type: 'eye_strain',
      completed: true
    });
  };

  const todayMetrics = getTodayMetrics(healthMetrics);
  const todayEvents = getTodayEvents(wellnessEvents);
  const wellnessScore = getWellnessScore(todayEvents);

  return (
    <div className="space-y-6">
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
            onClick={() => {
              const validKey = ['dashboard', 'reminders', 'breathing', 'tracking', 'analytics'].includes(tab.key);
              if (validKey) {
                setActiveTab(tab.key as 'dashboard' | 'reminders' | 'breathing' | 'tracking' | 'analytics');
              }
            }}
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

      {activeTab === 'dashboard' && (
        <DashboardTab
          todayEvents={todayEvents}
          todayMetrics={todayMetrics}
          todayWater={todayWater}
          activeFocusSession={activeFocusSession}
          onEyeStrainExercise={completeEyeStrainExercise}
          onAddWater={addWaterIntake}
          onShowMoodLogger={() => setShowMoodLogger(true)}
          onShowBreathing={() => setActiveTab('breathing')}
        />
      )}

      {activeTab === 'breathing' && (
        <div className="space-y-6">
          {activeBreathingExercise ? (
            <ActiveBreathingExercise
              exercise={activeBreathingExercise}
              breathingTimer={breathingTimer}
              breathingPhase={breathingPhase}
              onStop={stopBreathingExercise}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {breathingExercises.map((exercise) => (
                <BreathingExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onStart={startBreathingExercise}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showMoodLogger && (
        <MoodLoggerModal
          currentMood={currentMood}
          currentEnergy={currentEnergy}
          onMoodChange={setCurrentMood}
          onEnergyChange={setCurrentEnergy}
          onSave={logMoodAndEnergy}
          onCancel={() => setShowMoodLogger(false)}
        />
      )}
    </div>
  );
};
