/**
 * UndoRedoButtons Component
 *
 * Floating action buttons for undo/redo functionality.
 * Shows keyboard shortcuts and current action descriptions.
 */

import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useUndoRedo } from '../contexts/UndoRedoContext';

export const UndoRedoButtons: React.FC = () => {
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useUndoRedo();

  // Don't show if no actions available
  if (!canUndo && !canRedo) {
    return null;
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex gap-2">
      {/* Undo Button */}
      <button
        onClick={() => void undo()}
        disabled={!canUndo}
        className={`
          group relative flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all
          ${canUndo
            ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
          }
        `}
        title={canUndo ? `Undo: ${undoDescription} (${cmdKey}+Z)` : 'Nothing to undo'}
      >
        <Undo2 className="w-5 h-5" />
        <span className="text-sm font-medium">Undo</span>

        {/* Tooltip */}
        {canUndo && undoDescription && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="font-semibold mb-1">{undoDescription}</div>
            <div className="text-slate-300 dark:text-slate-400">{cmdKey}+Z</div>
          </div>
        )}
      </button>

      {/* Redo Button */}
      <button
        onClick={() => void redo()}
        disabled={!canRedo}
        className={`
          group relative flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all
          ${canRedo
            ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
          }
        `}
        title={canRedo ? `Redo: ${redoDescription} (${cmdKey}+Shift+Z)` : 'Nothing to redo'}
      >
        <Redo2 className="w-5 h-5" />
        <span className="text-sm font-medium">Redo</span>

        {/* Tooltip */}
        {canRedo && redoDescription && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <div className="font-semibold mb-1">{redoDescription}</div>
            <div className="text-slate-300 dark:text-slate-400">{cmdKey}+Shift+Z</div>
          </div>
        )}
      </button>
    </div>
  );
};
