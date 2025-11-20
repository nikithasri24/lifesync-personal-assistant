/**
 * Focus & Mood Store Slice
 *
 * Manages focus sessions and mood entries state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import type { FocusSession, MoodEntry, JournalMood } from '../../types';

const createId = () => Math.random().toString(36).substring(2, 15);

// State interface
export interface FocusAndMoodSlice {
  // State
  focusSessions: FocusSession[];
  moodEntries: MoodEntry[];

  // Actions - Mood
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => void;
  deleteMoodEntry: (id: string) => void;

  // Internal setters
  _setFocusSessions: (focusSessions: FocusSession[]) => void;
}

// Create the slice
export const createFocusAndMoodSlice: StateCreator<FocusAndMoodSlice> = (set, get) => ({
  // Initial state
  focusSessions: [],
  moodEntries: [],

  // Internal setters (used by initializeData)
  _setFocusSessions: (focusSessions) => set({ focusSessions }),

  // ==================== Mood ====================

  addMoodEntry: (entry) => {
    const moodEntry: MoodEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date(),
    };
    set((state) => ({ moodEntries: [moodEntry, ...state.moodEntries] }));
  },

  deleteMoodEntry: (id) => {
    set((state) => ({
      moodEntries: state.moodEntries.filter((entry) => entry.id !== id),
    }));
  },
});
