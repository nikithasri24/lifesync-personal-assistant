/**
 * QuickAddModalV2 Component
 * Modal for quickly adding tasks with terracotta theme
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { gradients } from '../../../styles/colors';

export interface QuickAddModalV2Props {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

export const QuickAddModalV2: React.FC<QuickAddModalV2Props> = ({
  isOpen,
  value,
  onChange,
  onSubmit,
  onClose,
  isLoading = false,
  isError = false,
  className = '',
}) => {
  const colors = useThemeColors();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div
          className={`
            w-full max-w-md mx-4 mb-4 sm:mb-0
            rounded-2xl shadow-2xl
            ${className}
          `}
          style={{ backgroundColor: colors.bg.white }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border.light }}>
            <h2
              className="text-lg font-bold"
              style={{
                background: gradients.text,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Add Task
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Close"
            >
              <X className="w-4 h-4" style={{ color: colors.badge.text }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="What needs to be done?"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all"
              style={{
                borderColor: colors.border.medium,
                backgroundColor: colors.bg.secondary,
                color: colors.text.primary,
              }}
            />

            <p className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
              Try natural language like "Call mom today" or "Review PR #urgent"
            </p>

            {/* Error Message */}
            {isError && (
              <p className="text-xs text-red-600 mt-2">
                Failed to create task. Please try again.
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: gradients.primary,
                  boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)',
                }}
              >
                {isLoading ? 'Adding...' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl font-semibold transition-all"
                style={{
                  backgroundColor: colors.bg.secondary,
                  color: colors.text.secondary,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default QuickAddModalV2;
