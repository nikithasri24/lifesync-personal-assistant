/**
 * Composed Store
 *
 * Modern Zustand store composed of feature slices.
 * This is the future replacement for useRealAppStore.ts
 *
 * Benefits:
 * - Clear separation of concerns
 * - Each slice is ~100-200 lines (vs 3,142-line monolith)
 * - Easy to test in isolation
 * - Type-safe across slices
 * - Better tree-shaking
 * - Granular updates (only affected components re-render)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Import slices
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createNotesSlice, type NotesSlice } from './slices/notesSlice';
import { createJournalSlice, type JournalSlice } from './slices/journalSlice';
import { createGoalsSlice, type GoalsSlice } from './slices/goalsSlice';

// Compose all slices into one store type
export type ComposedStore = UISlice & NotesSlice & JournalSlice & GoalsSlice;

/**
 * Modern, composed Zustand store
 *
 * Usage:
 * ```typescript
 * import { useComposedStore } from '@/stores';
 *
 * // In components
 * const { activeView, setActiveView } = useComposedStore();
 * const { notes, loadNotes } = useComposedStore();
 * ```
 */
export const useComposedStore = create<ComposedStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createNotesSlice(...a),
        ...createJournalSlice(...a),
        ...createGoalsSlice(...a),
      }),
      {
        name: 'lifesync-storage',
        // Only persist UI preferences, not data (data comes from Supabase)
        partialize: (state) => ({
          activeView: state.activeView,
          sidebarCollapsed: state.sidebarCollapsed,
          weekStartsOn: state.weekStartsOn,
        }),
      }
    ),
    { name: 'ComposedStore' }
  )
);

// Export individual slice selectors for better performance
export const selectUI = (state: ComposedStore): Pick<
  ComposedStore,
  | 'activeView'
  | 'sidebarCollapsed'
  | 'weekStartsOn'
  | 'setActiveView'
  | 'toggleSidebar'
  | 'setSidebarCollapsed'
  | 'setWeekStartsOn'
> => ({
  activeView: state.activeView,
  sidebarCollapsed: state.sidebarCollapsed,
  weekStartsOn: state.weekStartsOn,
  setActiveView: state.setActiveView,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setWeekStartsOn: state.setWeekStartsOn,
});

export const selectNotes = (state: ComposedStore): Pick<
  ComposedStore,
  | 'notes'
  | 'notesLoaded'
  | 'notesLoading'
  | 'loadNotes'
  | 'addNote'
  | 'updateNote'
  | 'deleteNote'
  | 'getNoteById'
> => ({
  notes: state.notes,
  notesLoaded: state.notesLoaded,
  notesLoading: state.notesLoading,
  loadNotes: state.loadNotes,
  addNote: state.addNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
  getNoteById: state.getNoteById,
});

export const selectJournal = (state: ComposedStore): Pick<
  ComposedStore,
  | 'journalEntries'
  | 'journalLoaded'
  | 'journalLoading'
  | 'loadJournal'
  | 'addJournalEntry'
  | 'updateJournalEntry'
  | 'deleteJournalEntry'
  | 'searchJournalEntries'
  | 'getJournalEntryById'
> => ({
  journalEntries: state.journalEntries,
  journalLoaded: state.journalLoaded,
  journalLoading: state.journalLoading,
  loadJournal: state.loadJournal,
  addJournalEntry: state.addJournalEntry,
  updateJournalEntry: state.updateJournalEntry,
  deleteJournalEntry: state.deleteJournalEntry,
  searchJournalEntries: state.searchJournalEntries,
  getJournalEntryById: state.getJournalEntryById,
});

export const selectGoals = (state: ComposedStore): Pick<
  ComposedStore,
  | 'goals'
  | 'goalsLoaded'
  | 'goalsLoading'
  | 'loadGoals'
  | 'addGoal'
  | 'updateGoal'
  | 'deleteGoal'
  | 'getGoalById'
> => ({
  goals: state.goals,
  goalsLoaded: state.goalsLoaded,
  goalsLoading: state.goalsLoading,
  loadGoals: state.loadGoals,
  addGoal: state.addGoal,
  updateGoal: state.updateGoal,
  deleteGoal: state.deleteGoal,
  getGoalById: state.getGoalById,
});

export const selectDreams = (state: ComposedStore): Pick<
  ComposedStore,
  | 'dreams'
  | 'dreamsLoaded'
  | 'dreamsLoading'
  | 'loadDreams'
  | 'addDream'
  | 'updateDream'
  | 'deleteDream'
  | 'getDreamById'
> => ({
  dreams: state.dreams,
  dreamsLoaded: state.dreamsLoaded,
  dreamsLoading: state.dreamsLoading,
  loadDreams: state.loadDreams,
  addDream: state.addDream,
  updateDream: state.updateDream,
  deleteDream: state.deleteDream,
  getDreamById: state.getDreamById,
});
