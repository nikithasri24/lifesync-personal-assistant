/**
 * Constants for the Todos domain
 */
import React from 'react';
import type { Theme, ThemeName } from './types';

export const THEMES: Record<ThemeName, Theme> = {
  blue: { primary: 'bg-blue-500', secondary: 'bg-blue-100' },
  green: { primary: 'bg-green-500', secondary: 'bg-green-100' },
  purple: { primary: 'bg-purple-500', secondary: 'bg-purple-100' },
  pink: { primary: 'bg-pink-500', secondary: 'bg-pink-100' },
  indigo: { primary: 'bg-indigo-500', secondary: 'bg-indigo-100' }
};

export const PRIORITY_FLAGS: Record<string, React.ReactNode> = {
  urgent: (
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-red-500">
      <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
    </svg>
  ),
  high: (
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-orange-500">
      <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
    </svg>
  ),
  medium: (
    <svg width="12" height="12" viewBox="0 0 12 12" className="text-blue-500">
      <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
    </svg>
  )
};

export const DEFAULT_TASK_ESTIMATED_TIME = 25; // minutes
export const POMODORO_WORK_TIME = 25 * 60; // 25 minutes in seconds
export const POMODORO_BREAK_TIME = 5 * 60; // 5 minutes in seconds
