import React from 'react';
import { X } from 'lucide-react';
import type { ToastState } from '../hooks/useToast';

interface ToastProps {
  toast: ToastState | null;
  onDismiss?: () => void;
}

const typeStyles: Record<string, string> = {
  info: 'bg-slate-800 text-white',
  success: 'bg-emerald-600 text-white',
  error: '!bg-rose-600 !text-white',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const style = typeStyles[toast.type ?? 'info'] ?? typeStyles.info;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:px-0">
      <div
        className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg px-4 py-3 shadow-lg sm:min-w-[320px] ${style}`}
      >
        <span className="text-sm font-medium leading-5 !text-white">{toast.message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto text-white/80 transition hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
