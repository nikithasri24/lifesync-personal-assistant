/**
 * Add to Pantry Prompt
 * Quick prompt shown after purchasing an item
 */

import React, { useEffect } from 'react';
import { Package, X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface AddToPantryPromptProps {
  isOpen: boolean;
  itemName: string;
  onAddToPantry: () => void;
  onDismiss: () => void;
}

export function AddToPantryPrompt({
  isOpen,
  itemName,
  onAddToPantry,
  onDismiss,
}: AddToPantryPromptProps) {
  const colors = useThemeColors();

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-28 left-4 right-4 z-50 animate-slide-up"
      style={{
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl"
        style={{
          backgroundColor: colors.bg.white,
          border: `2px solid ${colors.accent.start}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
            }}
          >
            <Package size={20} style={{ color: 'white' }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base" style={{ color: colors.text.primary }}>
              Add to pantry?
            </p>
            <p className="text-sm truncate" style={{ color: colors.text.secondary }}>
              {itemName}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-lg transition-colors duration-200 flex-shrink-0"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.text.tertiary,
            }}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.secondary,
            }}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onAddToPantry}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
              color: 'white',
            }}
          >
            Add to Pantry
          </button>
        </div>
      </div>
    </div>
  );
}
