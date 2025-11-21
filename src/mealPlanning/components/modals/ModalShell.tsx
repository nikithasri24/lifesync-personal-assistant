import React from 'react';
import { createPortal } from 'react-dom';

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
}: ModalShellProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        style={{ height: '350px' }}
        className={`w-full ${maxWidthClass} rounded-xl border-4 border-indigo-500/30 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-4 ring-white flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-slate-900">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
