/**
 * UndoRedoContext - Global undo/redo state management
 *
 * Implements the Command Pattern for reversible operations across the entire app.
 * Supports keyboard shortcuts (Ctrl+Z / Cmd+Z for undo, Ctrl+Shift+Z for redo).
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { logger } from '../services/logger';

// Command interface - all reversible actions implement this
export interface Command {
  // Unique identifier for the command
  id: string;
  // Human-readable description (e.g., "Create task: Buy groceries")
  description: string;
  // Execute the action (called on redo)
  execute: () => Promise<void>;
  // Reverse the action (called on undo)
  undo: () => Promise<void>;
  // Timestamp when command was executed
  timestamp: number;
}

export interface UndoRedoContextType {
  // Execute a command and add it to history
  executeCommand: (command: Command) => Promise<void>;
  // Undo the last command
  undo: () => Promise<void>;
  // Redo the last undone command
  redo: () => Promise<void>;
  // Check if undo is available
  canUndo: boolean;
  // Check if redo is available
  canRedo: boolean;
  // Get description of what will be undone
  undoDescription: string | null;
  // Get description of what will be redone
  redoDescription: string | null;
  // Clear all history (useful on logout)
  clearHistory: () => void;
  // Get current history size
  historySize: number;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

const MAX_HISTORY_SIZE = 50; // Keep last 50 actions

export const UndoRedoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stack of executed commands (for undo)
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  // Stack of undone commands (for redo)
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  // Lock to prevent concurrent undo/redo operations
  const isProcessing = useRef(false);

  const { showToast } = useToast();

  // Execute a command and add it to history
  const executeCommand = useCallback(async (command: Command) => {
    if (isProcessing.current) {
      logger.warn('[UndoRedo] Command execution blocked - operation in progress');
      return;
    }

    try {
      isProcessing.current = true;
      logger.debug('[UndoRedo] Executing command', { id: command.id, description: command.description });

      // Execute the command
      await command.execute();

      // Add to undo stack
      setUndoStack(prev => {
        const newStack = [...prev, command];
        // Limit history size
        if (newStack.length > MAX_HISTORY_SIZE) {
          return newStack.slice(-MAX_HISTORY_SIZE);
        }
        return newStack;
      });

      // Clear redo stack (new action invalidates redo history)
      setRedoStack([]);

      logger.info('[UndoRedo] Command executed successfully', { id: command.id });
    } catch (error) {
      logger.error('[UndoRedo] Command execution failed', { error, command });
      showToast(`Failed to ${command.description}`, 'error');
      throw error;
    } finally {
      isProcessing.current = false;
    }
  }, [showToast]);

  // Undo the last command
  const undo = useCallback(async () => {
    if (undoStack.length === 0 || isProcessing.current) {
      return;
    }

    const command = undoStack[undoStack.length - 1];

    try {
      isProcessing.current = true;
      logger.debug('[UndoRedo] Undoing command', { id: command.id, description: command.description });

      // Undo the command
      await command.undo();

      // Move from undo stack to redo stack
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, command]);

      showToast(`Undone: ${command.description}`, 'success');
      logger.info('[UndoRedo] Command undone successfully', { id: command.id });
    } catch (error) {
      logger.error('[UndoRedo] Undo failed', { error, command });
      showToast(`Failed to undo: ${command.description}`, 'error');
    } finally {
      isProcessing.current = false;
    }
  }, [undoStack, showToast]);

  // Redo the last undone command
  const redo = useCallback(async () => {
    if (redoStack.length === 0 || isProcessing.current) {
      return;
    }

    const command = redoStack[redoStack.length - 1];

    try {
      isProcessing.current = true;
      logger.debug('[UndoRedo] Redoing command', { id: command.id, description: command.description });

      // Re-execute the command
      await command.execute();

      // Move from redo stack to undo stack
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, command]);

      showToast(`Redone: ${command.description}`, 'success');
      logger.info('[UndoRedo] Command redone successfully', { id: command.id });
    } catch (error) {
      logger.error('[UndoRedo] Redo failed', { error, command });
      showToast(`Failed to redo: ${command.description}`, 'error');
    } finally {
      isProcessing.current = false;
    }
  }, [redoStack, showToast]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    logger.info('[UndoRedo] History cleared');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl+Z or Cmd+Z - Undo
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        void undo();
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z - Redo
      if (cmdOrCtrl && event.key === 'z' && event.shiftKey) {
        event.preventDefault();
        void redo();
      }

      // Ctrl+Y or Cmd+Y - Alternative redo shortcut
      if (cmdOrCtrl && event.key === 'y') {
        event.preventDefault();
        void redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = undoStack.length > 0 && !isProcessing.current;
  const canRedo = redoStack.length > 0 && !isProcessing.current;
  const undoDescription = undoStack.length > 0 ? undoStack[undoStack.length - 1].description : null;
  const redoDescription = redoStack.length > 0 ? redoStack[redoStack.length - 1].description : null;

  const value: UndoRedoContextType = {
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    clearHistory,
    historySize: undoStack.length,
  };

  return <UndoRedoContext.Provider value={value}>{children}</UndoRedoContext.Provider>;
};

// Hook to use undo/redo context
export const useUndoRedo = (): UndoRedoContextType => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }
  return context;
};
