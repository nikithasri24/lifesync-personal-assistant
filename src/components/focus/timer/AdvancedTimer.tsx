/**
 * Advanced Focus Timer
 * 
 * Enhanced timer with session templates, Pomodoro cycles, auto-breaks,
 * session queuing, and advanced controls for power users.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  SkipForward,
  Timer,
  Coffee,
  Brain,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  Clock,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Calendar,
  Book,
  Star
} from 'lucide-react';

interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  sessions: Array<{
    type: 'focus' | 'break' | 'long-break';
    duration: number; // in minutes
    preset?: string;
    name?: string;
  }>;
  totalDuration: number;
  isDefault: boolean;
  usageCount: number;
}

interface TimerState {
  currentSession: {
    type: 'focus' | 'break' | 'long-break';
    duration: number;
    name?: string;
    preset?: string;
  } | null;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  sessionIndex: number;
  cycleCount: number;
  template: SessionTemplate | null;
  queue: Array<any>;
  startTime: Date | null;
  totalElapsed: number;
  autoStart: boolean;
  strictMode: boolean;
}

interface Props {
  onSessionComplete: (session: any) => void;
  onBreakComplete: (breakData: any) => void;
  onTemplateComplete: (template: SessionTemplate) => void;
  backgroundMusic: boolean;
  musicType: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export const AdvancedTimer: React.FC<Props> = ({
  onSessionComplete,
  onBreakComplete,
  onTemplateComplete,
  backgroundMusic,
  musicType,
  soundEnabled,
  notificationsEnabled
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    currentSession: null,
    timeRemaining: 0,
    isRunning: false,
    isPaused: false,
    sessionIndex: 0,
    cycleCount: 0,
    template: null,
    queue: [],
    startTime: null,
    totalElapsed: 0,
    autoStart: false,
    strictMode: false
  });

  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<SessionTemplate>>({
    name: '',
    sessions: [{ type: 'focus', duration: 25 }]
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load default templates
  useEffect(() => {
    const defaultTemplates: SessionTemplate[] = [
      {
        id: 'classic-pomodoro',
        name: 'Classic Pomodoro',
        description: '25min focus + 5min break cycles with long breaks',
        sessions: [
          { type: 'focus', duration: 25, name: 'Focus Session 1' },
          { type: 'break', duration: 5, name: 'Short Break' },
          { type: 'focus', duration: 25, name: 'Focus Session 2' },
          { type: 'break', duration: 5, name: 'Short Break' },
          { type: 'focus', duration: 25, name: 'Focus Session 3' },
          { type: 'break', duration: 5, name: 'Short Break' },
          { type: 'focus', duration: 25, name: 'Focus Session 4' },
          { type: 'long-break', duration: 15, name: 'Long Break' }
        ],
        totalDuration: 160,
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'deep-work',
        name: 'Deep Work Block',
        description: 'Extended focus sessions for complex tasks',
        sessions: [
          { type: 'focus', duration: 90, name: 'Deep Work Session' },
          { type: 'break', duration: 20, name: 'Recovery Break' },
          { type: 'focus', duration: 90, name: 'Deep Work Session' },
          { type: 'long-break', duration: 30, name: 'Long Break' }
        ],
        totalDuration: 230,
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'study-session',
        name: 'Study Session',
        description: 'Optimized for learning and retention',
        sessions: [
          { type: 'focus', duration: 45, name: 'Study Block 1' },
          { type: 'break', duration: 10, name: 'Quick Break' },
          { type: 'focus', duration: 45, name: 'Study Block 2' },
          { type: 'break', duration: 15, name: 'Review Break' },
          { type: 'focus', duration: 30, name: 'Practice Session' }
        ],
        totalDuration: 145,
        isDefault: true,
        usageCount: 0
      },
      {
        id: 'creative-flow',
        name: 'Creative Flow',
        description: 'Longer blocks for creative work',
        sessions: [
          { type: 'focus', duration: 60, name: 'Creative Session 1' },
          { type: 'break', duration: 10, name: 'Inspiration Break' },
          { type: 'focus', duration: 60, name: 'Creative Session 2' },
          { type: 'break', duration: 20, name: 'Refresh Break' },
          { type: 'focus', duration: 45, name: 'Refinement Session' }
        ],
        totalDuration: 195,
        isDefault: true,
        usageCount: 0
      }
    ];

    setTemplates(defaultTemplates);
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          totalElapsed: prev.totalElapsed + 1
        }));
      }, 1000);
    } else if (timerState.timeRemaining === 0 && timerState.isRunning && timerState.currentSession) {
      handleSessionComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.timeRemaining]);

  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create completion chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(523.25, now, 0.2); // C5
      playTone(659.25, now + 0.2, 0.2); // E5
      playTone(783.99, now + 0.4, 0.4); // G5
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (!notificationsEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '🎯'
      });
    }
  };

  const handleSessionComplete = () => {
    const currentSession = timerState.currentSession;
    if (!currentSession) return;

    playNotificationSound();

    if (currentSession.type === 'focus') {
      showNotification('Focus Session Complete! 🎉', `Great work on your ${currentSession.name || 'focus session'}!`);
      onSessionComplete({
        type: currentSession.type,
        duration: currentSession.duration,
        completedAt: new Date(),
        template: timerState.template?.name
      });
    } else {
      showNotification('Break Time Over! ⏰', 'Ready to get back to focused work?');
      onBreakComplete({
        type: currentSession.type,
        duration: currentSession.duration,
        completedAt: new Date()
      });
    }

    // Move to next session in template
    if (timerState.template && timerState.sessionIndex < timerState.template.sessions.length - 1) {
      const nextIndex = timerState.sessionIndex + 1;
      const nextSession = timerState.template.sessions[nextIndex];
      
      setTimerState(prev => ({
        ...prev,
        currentSession: nextSession,
        timeRemaining: nextSession.duration * 60,
        sessionIndex: nextIndex,
        isRunning: prev.autoStart,
        startTime: prev.autoStart ? new Date() : null
      }));
    } else if (timerState.template) {
      // Template complete
      onTemplateComplete(timerState.template);
      showNotification('Template Complete! 🏆', `You've completed the ${timerState.template.name} template!`);
      
      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        timeRemaining: 0,
        isRunning: false,
        sessionIndex: 0,
        template: null,
        startTime: null
      }));
    } else {
      // Single session complete
      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        timeRemaining: 0,
        isRunning: false,
        startTime: null
      }));
    }
  };

  const startTemplate = (template: SessionTemplate) => {
    const firstSession = template.sessions[0];
    
    setTimerState(prev => ({
      ...prev,
      template,
      currentSession: firstSession,
      timeRemaining: firstSession.duration * 60,
      sessionIndex: 0,
      isRunning: true,
      isPaused: false,
      startTime: new Date(),
      totalElapsed: 0
    }));

    // Update usage count
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    ));

    setShowTemplates(false);
  };

  const startSingleSession = (type: 'focus' | 'break', duration: number) => {
    setTimerState(prev => ({
      ...prev,
      currentSession: { type, duration, name: `${type} Session` },
      timeRemaining: duration * 60,
      isRunning: true,
      isPaused: false,
      startTime: new Date(),
      totalElapsed: 0,
      template: null,
      sessionIndex: 0
    }));
  };

  const pauseSession = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true
    }));
  };

  const resumeSession = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false
    }));
  };

  const stopSession = () => {
    setTimerState(prev => ({
      ...prev,
      currentSession: null,
      timeRemaining: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
      template: null,
      sessionIndex: 0
    }));
  };

  const skipToNext = () => {
    if (timerState.template && timerState.sessionIndex < timerState.template.sessions.length - 1) {
      const nextIndex = timerState.sessionIndex + 1;
      const nextSession = timerState.template.sessions[nextIndex];
      
      setTimerState(prev => ({
        ...prev,
        currentSession: nextSession,
        timeRemaining: nextSession.duration * 60,
        sessionIndex: nextIndex,
        isRunning: true,
        startTime: new Date()
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!timerState.currentSession) return 0;
    const totalSeconds = timerState.currentSession.duration * 60;
    const elapsed = totalSeconds - timerState.timeRemaining;
    return (elapsed / totalSeconds) * 100;
  };

  const getTemplateProgress = () => {
    if (!timerState.template) return 0;
    return ((timerState.sessionIndex + 1) / timerState.template.sessions.length) * 100;
  };

  const addSessionToTemplate = () => {
    setNewTemplate(prev => ({
      ...prev,
      sessions: [...(prev.sessions || []), { type: 'focus', duration: 25 }]
    }));
  };

  const removeSessionFromTemplate = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      sessions: prev.sessions?.filter((_, i) => i !== index) || []
    }));
  };

  const saveTemplate = () => {
    if (newTemplate.name && newTemplate.sessions && newTemplate.sessions.length > 0) {
      const template: SessionTemplate = {
        id: `custom_${Date.now()}`,
        name: newTemplate.name,
        description: newTemplate.description,
        sessions: newTemplate.sessions,
        totalDuration: newTemplate.sessions.reduce((total, session) => total + session.duration, 0),
        isDefault: false,
        usageCount: 0
      };

      setTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', sessions: [{ type: 'focus', duration: 25 }] });
      setShowCreateTemplate(false);
    }
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
      <div className="space-y-8">
        {/* Timer Display */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="text-center">
            {/* Session Info */}
            {timerState.currentSession && (
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  {timerState.currentSession.type === 'focus' ? (
                    <Brain className="w-6 h-6 text-indigo-500" />
                  ) : (
                    <Coffee className="w-6 h-6 text-orange-500" />
                  )}
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {timerState.currentSession.name || 
                     (timerState.currentSession.type === 'focus' ? 'Focus Session' : 
                      timerState.currentSession.type === 'long-break' ? 'Long Break' : 'Break')}
                  </h3>
                </div>
                
                {timerState.template && (
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {timerState.template.name} - Session {timerState.sessionIndex + 1} of {timerState.template.sessions.length}
                  </div>
                )}
              </div>
            )}

            {/* Main Timer */}
            <div className={`text-8xl font-black font-mono mb-6 tracking-wider ${
              timerState.currentSession?.type === 'focus' ? 'text-indigo-600' : 'text-orange-500'
            }`}>
              {formatTime(timerState.timeRemaining)}
            </div>

            {/* Progress Ring */}
            {timerState.currentSession && (
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={timerState.currentSession.type === 'focus' ? 'text-indigo-500' : 'text-orange-500'}
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - getProgress() / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {Math.round(getProgress())}%
                  </span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {timerState.currentSession ? (
                <>
                  <button
                    onClick={timerState.isRunning ? pauseSession : resumeSession}
                    disabled={timerState.strictMode && timerState.isRunning}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      timerState.isRunning
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } ${timerState.strictMode && timerState.isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {timerState.isRunning ? <Pause size={20} /> : <Play size={20} />}
                    <span>{timerState.isRunning ? 'Pause' : timerState.isPaused ? 'Resume' : 'Start'}</span>
                  </button>

                  <button
                    onClick={stopSession}
                    disabled={timerState.strictMode && timerState.isRunning}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                      timerState.strictMode && timerState.isRunning
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                    } text-white`}
                  >
                    <Square size={20} />
                    <span>Stop</span>
                  </button>

                  {timerState.template && timerState.sessionIndex < timerState.template.sessions.length - 1 && (
                    <button
                      onClick={skipToNext}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                    >
                      <SkipForward size={20} />
                      <span>Skip</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => startSingleSession('focus', 25)}
                    className="flex items-center space-x-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                  >
                    <Brain size={20} />
                    <span>Quick Focus</span>
                  </button>

                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                  >
                    <Timer size={20} />
                    <span>Templates</span>
                  </button>
                </div>
              )}
            </div>

            {/* Template Progress */}
            {timerState.template && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Template Progress</span>
                  <span>{timerState.sessionIndex + 1}/{timerState.template.sessions.length}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getTemplateProgress()}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Remaining: {Math.ceil((timerState.template.totalDuration - (timerState.totalElapsed / 60)))} min</span>
                  <span>Total: {timerState.template.totalDuration} min</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => startSingleSession('focus', 25)}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
          >
            <Clock className="w-6 h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-slate-900 dark:text-white">25 min Focus</div>
          </button>

          <button
            onClick={() => startSingleSession('focus', 45)}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
          >
            <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-slate-900 dark:text-white">45 min Deep</div>
          </button>

          <button
            onClick={() => startSingleSession('break', 5)}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all group"
          >
            <Coffee className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-slate-900 dark:text-white">5 min Break</div>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
          >
            <Settings className="w-6 h-6 text-slate-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-slate-900 dark:text-white">Settings</div>
          </button>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Session Templates</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateTemplate(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Create</span>
                </button>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>{template.sessions.length} sessions</span>
                        <span>{template.totalDuration} min total</span>
                        <span>Used {template.usageCount} times</span>
                      </div>
                    </div>
                    
                    {!template.isDefault && (
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {template.sessions.map((session, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {session.type === 'focus' ? (
                          <Brain className="w-4 h-4 text-indigo-500" />
                        ) : session.type === 'long-break' ? (
                          <Coffee className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Coffee className="w-4 h-4 text-orange-400" />
                        )}
                        <span className="text-slate-900 dark:text-white">
                          {session.name || `${session.type} (${session.duration}m)`}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => startTemplate(template)}
                    className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                  >
                    Start Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Template</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="My Custom Template"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={2}
                  placeholder="Describe your template..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sessions
                  </label>
                  <button
                    onClick={addSessionToTemplate}
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <Plus size={16} />
                    <span className="text-sm">Add Session</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newTemplate.sessions?.map((session, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <select
                        value={session.type}
                        onChange={(e) => {
                          const updatedSessions = [...(newTemplate.sessions || [])];
                          updatedSessions[index] = { ...session, type: e.target.value as any };
                          setNewTemplate({ ...newTemplate, sessions: updatedSessions });
                        }}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      >
                        <option value="focus">Focus</option>
                        <option value="break">Break</option>
                        <option value="long-break">Long Break</option>
                      </select>
                      
                      <input
                        type="number"
                        value={session.duration}
                        onChange={(e) => {
                          const updatedSessions = [...(newTemplate.sessions || [])];
                          updatedSessions[index] = { ...session, duration: parseInt(e.target.value) || 0 };
                          setNewTemplate({ ...newTemplate, sessions: updatedSessions });
                        }}
                        className="w-20 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        min="1"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">min</span>
                      
                      <input
                        type="text"
                        value={session.name || ''}
                        onChange={(e) => {
                          const updatedSessions = [...(newTemplate.sessions || [])];
                          updatedSessions[index] = { ...session, name: e.target.value };
                          setNewTemplate({ ...newTemplate, sessions: updatedSessions });
                        }}
                        className="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        placeholder="Session name (optional)"
                      />
                      
                      {(newTemplate.sessions?.length || 0) > 1 && (
                        <button
                          onClick={() => removeSessionFromTemplate(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCreateTemplate(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!newTemplate.name || !newTemplate.sessions?.length}
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};