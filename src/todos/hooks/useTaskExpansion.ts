import { useState } from 'react';

/**
 * Custom hook to manage task expansion and subtask draft states
 * Handles which tasks are expanded and temporary subtask input text
 */
export function useTaskExpansion(): {
  expandedTasks: Set<string>;
  toggleTaskExpansion: (taskId: string) => void;
  subtaskDrafts: Record<string, string>;
  setSubtaskDraft: (taskId: string, text: string) => void;
  clearSubtaskDraft: (taskId: string) => void;
  getSubtaskDraft: (taskId: string) => string;
} {
  // Track which tasks are expanded
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Track subtask draft text for each parent task
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});

  /**
   * Toggle expansion state for a task
   */
  const toggleTaskExpansion = (taskId: string): void => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  /**
   * Set the draft text for a subtask
   */
  const setSubtaskDraft = (taskId: string, text: string): void => {
    setSubtaskDrafts(prev => ({ ...prev, [taskId]: text }));
  };

  /**
   * Clear the draft text for a subtask
   */
  const clearSubtaskDraft = (taskId: string): void => {
    setSubtaskDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[taskId];
      return newDrafts;
    });
  };

  /**
   * Get the draft text for a specific task
   */
  const getSubtaskDraft = (taskId: string): string => {
    return subtaskDrafts[taskId] || '';
  };

  return {
    // Expansion state
    expandedTasks,
    toggleTaskExpansion,

    // Subtask drafts
    subtaskDrafts,
    setSubtaskDraft,
    clearSubtaskDraft,
    getSubtaskDraft,
  };
}
