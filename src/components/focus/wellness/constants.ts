import { type BreathingExercise } from './types';

export const breathingExercises: BreathingExercise[] = [
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
    totalDuration: 300,
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
    totalDuration: 240,
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
    totalDuration: 180,
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
    totalDuration: 420,
    benefits: ['Deep relaxation', 'Stress relief', 'Mental clarity'],
    icon: '🧘'
  }
];
