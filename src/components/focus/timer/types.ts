export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  sessions: Array<{
    type: 'focus' | 'break' | 'long-break';
    duration: number;
    preset?: string;
    name?: string;
  }>;
  totalDuration: number;
  isDefault: boolean;
  usageCount: number;
}

export interface QueueItem {
  type: 'focus' | 'break' | 'long-break';
  duration: number;
  name?: string;
  preset?: string;
}

export interface TimerState {
  currentSession: {
    type: 'focus' | 'break' | 'long-break';
    duration: number;
    name?: string;
    preset?: string;
  } | null;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionIndex: number;
  cycleCount: number;
  template: SessionTemplate | null;
  queue: Array<QueueItem>;
  startTime: Date | null;
  totalElapsed: number;
  autoStart: boolean;
  strictMode: boolean;
}

export interface SessionCompleteData {
  type: 'focus' | 'break' | 'long-break';
  duration: number;
  completedAt: Date;
  template?: string;
}

export interface BreakCompleteData {
  type: 'focus' | 'break' | 'long-break';
  duration: number;
  completedAt: Date;
}
