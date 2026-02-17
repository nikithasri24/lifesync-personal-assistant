/**
 * ModalV2 Component
 * Bottom sheet (mobile) + centered dialog (desktop)
 * iOS-inspired design with smooth animations
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

export interface ModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export const ModalV2: React.FC<ModalV2Props> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  footer,
  className = '',
}) => {
  const colors = useThemeColors();

  // Handle Escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, handleEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleBackdropClick}
          >
            {/* Modal Content - Bottom sheet on mobile, centered on desktop */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`
                w-full ${sizeStyles[size]}
                bg-white dark:bg-gray-800
                rounded-t-3xl sm:rounded-3xl
                shadow-2xl
                max-h-[90vh] sm:max-h-[85vh]
                flex flex-col
                ${className}
              `}
              style={{
                backgroundColor: colors.bg.white,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  className="
                    flex items-center justify-between
                    px-6 py-4
                    border-b
                  "
                  style={{
                    borderColor: colors.border.light,
                  }}
                >
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="
                        p-2 rounded-full
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-150
                      "
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" style={{ color: colors.text.secondary }} />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className="
                    px-6 py-4
                    border-t
                  "
                  style={{
                    borderColor: colors.border.light,
                  }}
                >
                  {footer}
                </div>
              )}

              {/* Mobile Handle (appears only on mobile) */}
              <div className="sm:hidden flex justify-center pt-2 pb-1">
                <div
                  className="w-12 h-1 rounded-full"
                  style={{ backgroundColor: colors.border.medium }}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalV2;
