/**
 * Advanced Focus Timer
 *
 * Enhanced timer with session templates, Pomodoro cycles, auto-breaks,
 * session queuing, and advanced controls for power users.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimerDisplay } from './components/TimerDisplay';
import { QuickActions } from './components/QuickActions';
import { TemplatesModal } from './components/TemplatesModal';
import { CreateTemplateModal } from './components/CreateTemplateModal';
import { defaultTemplates } from './data/defaultTemplates';
import { playNotificationSound, showNotification } from './utils/audioHelpers';
import type { SessionTemplate, TimerState, SessionCompleteData, BreakCompleteData } from './types';

interface Props {
  onSessionComplete: (session: SessionCompleteData) => void;
  onBreakComplete: (breakData: BreakCompleteData) => void;
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
  _backgroundMusic,
  _musicType,
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
  const [_showSettings, setShowSettings] = useState(false);
  const [isFullscreen, _setIsFullscreen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<SessionTemplate>>({
    name: '',
    sessions: [{ type: 'focus', duration: 25 }]
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTemplates(defaultTemplates);
  }, []);

  const handlePlaySound = useCallback(() => {
    playNotificationSound(soundEnabled);
  }, [soundEnabled]);

  const handleShowNotification = useCallback((title: string, body: string) => {
    showNotification(notificationsEnabled, title, body);
  }, [notificationsEnabled]);

  const handleSessionComplete = useCallback((): void => {
    const currentSession = timerState.currentSession;
    if (!currentSession) return;

    handlePlaySound();

    if (currentSession.type === 'focus') {
      handleShowNotification('Focus Session Complete! 🎉', `Great work on your ${currentSession.name ?? 'focus session'}!`);
      onSessionComplete({
        type: currentSession.type,
        duration: currentSession.duration,
        completedAt: new Date(),
        template: timerState.template?.name
      });
    } else {
      handleShowNotification('Break Time Over! ⏰', 'Ready to get back to focused work?');
      onBreakComplete({
        type: currentSession.type,
        duration: currentSession.duration,
        completedAt: new Date()
      });
    }

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
      onTemplateComplete(timerState.template);
      handleShowNotification('Template Complete! 🏆', `You've completed the ${timerState.template.name} template!`);

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
      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        timeRemaining: 0,
        isRunning: false,
        startTime: null
      }));
    }
  }, [timerState.currentSession, timerState.template, timerState.sessionIndex, handlePlaySound, handleShowNotification, onSessionComplete, onBreakComplete, onTemplateComplete]);

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
  }, [timerState.isRunning, timerState.timeRemaining, timerState.currentSession, handleSessionComplete]);

  const startTemplate = (template: SessionTemplate): void => {
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

  const startSingleSession = (type: 'focus' | 'break', duration: number): void => {
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

  const pauseSession = (): void => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true
    }));
  };

  const resumeSession = (): void => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false
    }));
  };

  const stopSession = (): void => {
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

  const skipToNext = (): void => {
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


  const addSessionToTemplate = (): void => {
    setNewTemplate(prev => ({
      ...prev,
      sessions: [...(prev.sessions ?? []), { type: 'focus', duration: 25 }]
    }));
  };

  const removeSessionFromTemplate = (index: number): void => {
    setNewTemplate(prev => ({
      ...prev,
      sessions: prev.sessions?.filter((_, i) => i !== index) ?? []
    }));
  };

  const saveTemplate = (): void => {
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

  const deleteTemplate = (templateId: string): void => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''}`}>
      <div className="space-y-8">
        <TimerDisplay
          timerState={timerState}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={stopSession}
          onSkipToNext={skipToNext}
          onStartFocus={() => startSingleSession('focus', 25)}
          onShowTemplates={() => setShowTemplates(true)}
        />

        <QuickActions
          onStart25Min={() => startSingleSession('focus', 25)}
          onStart45Min={() => startSingleSession('focus', 45)}
          onStart5MinBreak={() => startSingleSession('break', 5)}
          onShowSettings={() => setShowSettings(true)}
        />
      </div>

      {showTemplates && (
        <TemplatesModal
          templates={templates}
          onClose={() => setShowTemplates(false)}
          onStartTemplate={startTemplate}
          onDeleteTemplate={deleteTemplate}
          onShowCreate={() => setShowCreateTemplate(true)}
        />
      )}

      {showCreateTemplate && (
        <CreateTemplateModal
          newTemplate={newTemplate}
          onClose={() => setShowCreateTemplate(false)}
          onSave={saveTemplate}
          onUpdateName={(name) => setNewTemplate({ ...newTemplate, name })}
          onUpdateDescription={(description) => setNewTemplate({ ...newTemplate, description })}
          onAddSession={addSessionToTemplate}
          onRemoveSession={removeSessionFromTemplate}
          onUpdateSession={(index, session) => {
            const updatedSessions = [...(newTemplate.sessions ?? [])];
            updatedSessions[index] = session;
            setNewTemplate({ ...newTemplate, sessions: updatedSessions });
          }}
        />
      )}
    </div>
  );
};