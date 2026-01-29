export interface WellnessEvent {
  id: string;
  type: 'eye_strain' | 'posture' | 'hydration' | 'breathing' | 'energy' | 'break';
  timestamp: Date;
  completed: boolean;
  value?: number;
  notes?: string;
  sessionId?: string;
}

export interface HealthMetrics {
  date: Date;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  exerciseMinutes: number;
  waterIntake: number;
  screenTime: number;
  focusSessionsCount: number;
  focusQuality: number;
  energy: number;
}

export interface WellnessSettings {
  eyeStrainReminders: boolean;
  eyeStrainInterval: number;
  postureReminders: boolean;
  postureInterval: number;
  hydrationReminders: boolean;
  hydrationInterval: number;
  breathingExercises: boolean;
  energyTracking: boolean;
  sleepCorrelation: boolean;
  maxDailyFocusTime: number;
  enforceBreaks: boolean;
  minBreakDuration: number;
}

export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  pattern: Array<{ phase: 'inhale' | 'hold' | 'exhale' | 'rest'; duration: number }>;
  totalDuration: number;
  benefits: string[];
  icon: string;
}

export interface FocusSessionType {
  id?: string;
  duration: number;
}
