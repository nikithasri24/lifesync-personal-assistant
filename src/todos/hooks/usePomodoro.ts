import { useState, useEffect } from 'react';
import type { PomodoroTimer } from '../types';
import { POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from '../constants';

/**
 * Custom hook to manage Pomodoro timer state and logic
 * Handles work sessions, break sessions, and automatic countdown
 */
export function usePomodoro() {
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimer>({
    taskId: null,
    timeLeft: POMODORO_WORK_TIME,
    isActive: false,
    isBreak: false,
  });

  /**
   * Start a Pomodoro session for a specific task
   */
  const startPomodoro = (taskId: string) => {
    setPomodoroTimer({
      taskId,
      timeLeft: POMODORO_WORK_TIME,
      isActive: true,
      isBreak: false,
    });
  };

  /**
   * Pause the current Pomodoro timer
   */
  const pausePomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev,
      isActive: false,
    }));
  };

  /**
   * Resume the paused Pomodoro timer
   */
  const resumePomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev,
      isActive: true,
    }));
  };

  /**
   * Toggle between pause and resume
   */
  const togglePomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev,
      isActive: !prev.isActive,
    }));
  };

  /**
   * Reset the Pomodoro timer completely
   */
  const resetPomodoro = () => {
    setPomodoroTimer({
      taskId: null,
      timeLeft: POMODORO_WORK_TIME,
      isActive: false,
      isBreak: false,
    });
  };

  /**
   * Countdown timer effect
   * Decrements timer every second when active
   * Automatically transitions from work to break and vice versa
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pomodoroTimer.isActive && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (pomodoroTimer.isActive && pomodoroTimer.timeLeft === 0) {
      // Timer finished
      if (!pomodoroTimer.isBreak) {
        // Work session finished, start break
        setPomodoroTimer(prev => ({
          ...prev,
          timeLeft: POMODORO_BREAK_TIME,
          isBreak: true,
        }));
      } else {
        // Break finished, reset completely
        setPomodoroTimer({
          taskId: null,
          timeLeft: POMODORO_WORK_TIME,
          isActive: false,
          isBreak: false,
        });
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pomodoroTimer.isActive, pomodoroTimer.timeLeft, pomodoroTimer.isBreak]);

  return {
    pomodoroTimer,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    togglePomodoro,
    resetPomodoro,
  };
}
