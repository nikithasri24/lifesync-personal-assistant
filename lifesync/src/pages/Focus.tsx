import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useApiFocus } from '../hooks/useApiFocus';
import TodosWorkingFollowUp from './TodosWorkingFollowUp';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  Target,
  Coffee,
  Clock,
  CheckSquare,
  Brain,
  BarChart3,
  Zap,
  Volume2,
  Trophy,
  Heart,
  Crown,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function Focus() {
  const { 
    activeFocusSession,
    focusSessions,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    todos
  } = useAppStore();

  // API hook for focus data
  const {
    userProfile,
    achievements,
    analyticsData,
    focusSessions: apiFocusSessions,
    loading: focusLoading,
    error: focusError,
    updateUserProfile,
    createFocusSession,
    updateFocusSession,
    refreshData
  } = useApiFocus();

  // Enhanced state
  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'gamification' | 'tasks' | 'wellness'>('tasks');
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [backgroundMusic, setBackgroundMusic] = useState(false);
  const [selectedMusicType, setSelectedMusicType] = useState('rain');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);


  // Enhanced features state - now using API data

  // Focus presets with enhanced colors
  const focusPresets = [
    { id: 'pomodoro', name: 'Pomodoro', duration: 25, icon: '🍅', color: 'from-red-400 to-red-500' },
    { id: 'deep-work', name: 'Deep Work', duration: 90, icon: '🧠', color: 'from-purple-400 to-purple-500' },
    { id: 'creative', name: 'Creative', duration: 60, icon: '🎨', color: 'from-pink-400 to-pink-500' },
    { id: 'learning', name: 'Learning', duration: 45, icon: '📚', color: 'from-blue-400 to-blue-500' },
    { id: 'break', name: 'Break', duration: 15, icon: '☕', color: 'from-orange-400 to-orange-500' }
  ];

  const musicTypes = [
    { id: 'rain', name: 'Rain Sounds', icon: '🌧️' },
    { id: 'forest', name: 'Forest Birds', icon: '🌲' },
    { id: 'ocean', name: 'Ocean Waves', icon: '🌊' },
    { id: 'whitenoise', name: 'White Noise', icon: '📻' },
    { id: 'brownnoise', name: 'Brown Noise', icon: '🎵' },
    { id: 'binaural', name: 'Focus Beats', icon: '🧠' }
  ];


  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Timer logic with enhanced features
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playCompletionSound();
      showNotification();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Background music logic
  useEffect(() => {
    if (isRunning && backgroundMusic && !isPlayingMusic) {
      startBackgroundMusic();
    } else if ((!isRunning || !backgroundMusic) && isPlayingMusic) {
      stopBackgroundMusic();
    }
  }, [isRunning, backgroundMusic, isPlayingMusic, selectedMusicType]);

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
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
      playTone(523.25, now, 0.2);
      playTone(659.25, now + 0.2, 0.2);
      playTone(783.99, now + 0.4, 0.4);
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete! 🎉', {
        body: `Your ${selectedPreset ? selectedPreset.name : 'focus'} session is finished. Great work!`,
        icon: '🎯'
      });
    }
  };

  const startBackgroundMusic = () => {
    if (!audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      
      setAudioContext(context);
      generateAmbientSound(selectedMusicType, context, gainNode);
      setIsPlayingMusic(true);
    }
  };

  const stopBackgroundMusic = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setIsPlayingMusic(false);
    }
  };

  const generateAmbientSound = (type: string, context: AudioContext, gainNode: GainNode) => {
    // Generate different ambient sounds
    switch (type) {
      case 'rain':
        for (let i = 0; i < 3; i++) {
          const osc = context.createOscillator();
          const filter = context.createBiquadFilter();
          const gain = context.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(Math.random() * 2000 + 1000, context.currentTime);
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2000 + Math.random() * 1000, context.currentTime);
          gain.gain.setValueAtTime(0.02, context.currentTime);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(gainNode);
          osc.start();
        }
        break;
      case 'ocean':
        for (let i = 0; i < 2; i++) {
          const osc = context.createOscillator();
          const lfo = context.createOscillator();
          const gain = context.createGain();
          const lfoGain = context.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100 + i * 50, context.currentTime);
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.1 + i * 0.05, context.currentTime);
          lfoGain.gain.setValueAtTime(20, context.currentTime);
          gain.gain.setValueAtTime(0.1, context.currentTime);
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          osc.connect(gain);
          gain.connect(gainNode);
          
          osc.start();
          lfo.start();
        }
        break;
      default:
        // White noise fallback
        const bufferSize = context.sampleRate * 2;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        gain.gain.setValueAtTime(0.05, context.currentTime);
        
        source.connect(gain);
        gain.connect(gainNode);
        source.start();
        break;
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWithPreset = (preset: any) => {
    setSelectedPreset(preset);
    setTimeLeft(preset.duration * 60);
    setIsRunning(false);
    setShowCustomTimer(false);
  };

  const setCustomTime = () => {
    const totalSeconds = (customMinutes * 60) + customSeconds;
    setTimeLeft(totalSeconds);
    setSelectedPreset({ id: 'custom', name: 'Custom', duration: customMinutes, icon: '⏱️' });
    setShowCustomTimer(false);
    setIsRunning(false);
  };

  // Helper function to check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const todaysSessions = apiFocusSessions.filter(session => 
    isToday(new Date(session.startTime))
  );

  const totalFocusTime = todaysSessions.reduce((total, session) => 
    total + (session.actualDuration || session.duration), 0
  );

  const navigationTabs = [
    { key: 'timer', label: 'Timer', icon: Timer },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'gamification', label: 'Progress', icon: Trophy },
    { key: 'wellness', label: 'Wellness', icon: Heart }
  ];

  // Show loading state
  if (focusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading focus data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (focusError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">Error loading focus data: {focusError}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Enhanced Header */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase font-display leading-none tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FOCUS MAX PRO
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    The ultimate productivity companion
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* User Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-slate-900 dark:text-white">{userProfile?.xp?.toLocaleString() || '0'}</span>
                  <span className="text-slate-600 dark:text-slate-300">XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-slate-900 dark:text-white">{userProfile?.currentStreak || 0}</span>
                  <span className="text-slate-600 dark:text-slate-300">day streak</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-900 dark:text-white">Level {userProfile?.level || 1}</span>
                </div>
              </div>

              {/* Enhanced Mode Toggle */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Enhanced Mode</span>
                <button
                  onClick={() => setEnhancedMode(!enhancedMode)}
                  className={`relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ${
                    enhancedMode ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-md ${
                      enhancedMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Background Music Toggle */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Music</span>
                <button
                  onClick={() => setBackgroundMusic(!backgroundMusic)}
                  className={`relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ${
                    backgroundMusic ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-md ${
                      backgroundMusic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        {enhancedMode && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-2 shadow-xl border border-white/20">
            <div className="flex space-x-2">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Music Selection */}
        {backgroundMusic && enhancedMode && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center space-x-2">
              <Volume2 size={24} />
              <span>Choose Background Sound</span>
              {isPlayingMusic && (
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Playing</span>
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {musicTypes.map((music) => (
                <button
                  key={music.id}
                  onClick={() => {
                    setSelectedMusicType(music.id);
                    if (isPlayingMusic) {
                      stopBackgroundMusic();
                      setTimeout(() => startBackgroundMusic(), 100);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:scale-105 hover:shadow-lg ${
                    selectedMusicType === music.id
                      ? 'border-blue-400 ring-4 ring-blue-200/50 shadow-lg bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 bg-white/80 dark:bg-slate-700/80'
                  }`}
                >
                  <div className="text-2xl mb-2">{music.icon}</div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm">{music.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {(!enhancedMode || activeTab === 'timer') && (
          <>
            {/* Focus Presets */}
            {enhancedMode && (
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Choose Your Focus Mode</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {focusPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => startWithPreset(preset)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-center bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm hover:scale-105 hover:shadow-lg ${
                        selectedPreset?.id === preset.id
                          ? 'border-indigo-400 ring-4 ring-indigo-200/50 shadow-lg'
                          : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <div className="text-3xl mb-3">{preset.icon}</div>
                      <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">{preset.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{preset.duration} minutes</div>
                    </button>
                  ))}
                  
                  {/* Custom Timer Button */}
                  <button
                    onClick={() => setShowCustomTimer(true)}
                    className="p-6 rounded-xl border-2 transition-all duration-200 text-center bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-800 dark:to-cyan-800 backdrop-blur-sm hover:scale-105 hover:shadow-lg border-teal-200 dark:border-teal-600 hover:border-teal-300"
                  >
                    <div className="text-3xl mb-3">⏱️</div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm mb-1">Custom</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Any time</div>
                  </button>
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-2xl border-4 border-indigo-200 dark:border-indigo-700">
              <div className="text-center">
                <div className="text-7xl font-black font-mono mb-6 tracking-wider text-slate-900 dark:text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xl mb-8 flex items-center justify-center space-x-3 text-slate-700 dark:text-slate-300">
                  {selectedPreset && <span className="text-3xl">{selectedPreset.icon}</span>}
                  <span className="font-medium">{selectedPreset ? `${selectedPreset.name} Session` : 'Focus Session'}</span>
                </div>
                
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:scale-105"
                  >
                    {isRunning ? <Pause size={24} /> : <Play size={24} />}
                    <span className="text-lg">{isRunning ? 'Pause' : 'Start'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setTimeLeft(selectedPreset ? selectedPreset.duration * 60 : 1500);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:scale-105"
                  >
                    <RotateCcw size={24} />
                    <span className="text-lg">Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {enhancedMode && activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{Math.floor((analyticsData?.totalFocusTime || 0) / 60)}h {(analyticsData?.totalFocusTime || 0) % 60}m</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Focus Time</div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-green-500" />
                  <span className="text-xs text-slate-500">Rate</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData?.completionRate || 0}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Completion</div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <span className="text-xs text-slate-500">Score</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData?.productivityScore || 0}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Productivity</div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <CheckSquare className="w-8 h-8 text-orange-500" />
                  <span className="text-xs text-slate-500">Count</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData?.totalSessions || 0}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Sessions</div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Weekly Progress</h3>
              <div className="space-y-4">
                {(analyticsData?.weeklyStats || []).map((day) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium text-slate-600 dark:text-slate-300">{day.day}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>{day.sessions} sessions</span>
                        <span>{day.productivity}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${day.productivity}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gamification Tab */}
        {enhancedMode && activeTab === 'gamification' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Crown className="w-10 h-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {userProfile?.level || 1}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{userProfile?.username || 'User'}</h2>
                    <p className="text-white/80 mb-2">Focus Master</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{userProfile?.currentStreak || 0} day streak</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-4 h-4" />
                        <span>{userProfile?.xp?.toLocaleString() || '0'} XP</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold mb-2">{userProfile?.xp?.toLocaleString() || '0'}</div>
                  <div className="text-white/80 text-sm mb-3">
                    {userProfile?.xpToNextLevel?.toLocaleString() || '0'} XP to level {(userProfile?.level || 1) + 1}
                  </div>
                  <div className="w-48 bg-white/20 rounded-full h-3">
                    <div
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${((userProfile?.xp || 0) / ((userProfile?.xp || 0) + (userProfile?.xpToNextLevel || 1))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(achievements || []).map((achievement) => (
                  <div key={achievement.id} className={`p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked 
                      ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
                      : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50'
                  }`}>
                    <div className={`text-3xl mb-2 ${achievement.unlocked ? '' : 'opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className={`font-semibold ${achievement.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {achievement.name}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${
                      achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                      achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {achievement.rarity}
                    </div>
                    {!achievement.unlocked && achievement.progress && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">{achievement.progress}% complete</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                          <div
                            className="bg-indigo-500 h-1 rounded-full transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {enhancedMode && activeTab === 'wellness' && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20">
            <Heart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Wellness Center</h3>
            <p className="text-slate-600 dark:text-slate-300">Track your health with eye strain reminders, posture checks, and mood logging.</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Today's Focus</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-lg">
                <Clock className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Sessions Today</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{todaysSessions.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-lg">
                <Target className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Current Mode</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {selectedPreset ? selectedPreset.name : 'None'}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl shadow-lg">
                <Brain className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Timer Modal */}
      {showCustomTimer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Set Custom Timer</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-400 bg-slate-800 text-white font-bold text-center text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-300/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Seconds
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-400 bg-slate-800 text-white font-bold text-center text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-300/50 transition-all"
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-black font-mono text-slate-800 dark:text-white mb-4">
                  {formatTime((customMinutes * 60) + customSeconds)}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCustomTimer(false)}
                  className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={setCustomTime}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  Set Timer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}