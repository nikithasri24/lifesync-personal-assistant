import React from 'react';
import { createPortal } from 'react-dom';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-2xl',
  headerRight,
  children,
}: ModalShellProps): React.ReactPortal {
  const colors = useThemeColors();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        style={{
          height: '350px',
          backgroundColor: colors.bg.white,
          borderColor: `${colors.accent.start}30`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        className={`w-full ${maxWidthClass} rounded-xl border-4 flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0"
          style={{ borderColor: colors.border.light }}
        >
          <div>
            <h3
              id="modal-title"
              className="text-base font-semibold"
              style={{ color: colors.text.primary }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs" style={{ color: colors.text.tertiary }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 transition-colors duration-200"
              style={{
                color: colors.text.tertiary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.secondary;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.tertiary;
              }}
              aria-label="Close"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
