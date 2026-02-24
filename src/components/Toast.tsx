import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { ToastState } from '../hooks/useToast';

interface ToastProps {
  toast: ToastState | null;
  onDismiss?: () => void;
}

const typeStyles: Record<string, string> = {
  info: '!bg-slate-800 !text-white',
  success: '!bg-emerald-600 !text-white',
  error: '!bg-rose-600 !text-white',
  warning: '!bg-amber-600 !text-white',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const style = typeStyles[toast.type ?? 'info'] ?? typeStyles.info;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 sm:px-0"
      style={{
        top: 'max(env(safe-area-inset-top, 0px) + 1rem, 4.5rem)',
      }}
    >
      <div
        className={`pointer-events-auto flex max-w-md flex-col gap-2 rounded-lg px-4 py-3 shadow-lg sm:min-w-[320px] !text-white ${style}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {toast.title && (
              <div className="text-sm font-semibold leading-5 !text-white mb-1">
                {toast.title}
              </div>
            )}
            <span className="text-sm leading-5 !text-white">{toast.message}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-white/80 transition hover:text-white flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        {toast.action && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.action?.onAction?.();
                onDismiss?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 rounded transition-colors"
            >
              {toast.action.icon === 'retry' && <RefreshCw className="w-3 h-3" />}
              {toast.action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
