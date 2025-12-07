/**
 * Mode Switch Component
 *
 * Toggles between Voice Mode (AI Assistant full-screen) and Visual Mode (traditional dashboard)
 * Persists user preference to localStorage
 */

import { useState, useEffect } from 'react';
import { MessageCircle, LayoutDashboard, Keyboard } from 'lucide-react';
import clsx from 'clsx';

export type AppMode = 'voice' | 'visual';

interface ModeSwitchProps {
  className?: string;
  onModeChange?: (mode: AppMode) => void;
}

const MODE_STORAGE_KEY = 'lifesync-app-mode';

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    return (saved as AppMode) ?? 'visual'; // Default to visual mode
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'voice' ? 'visual' : 'voice';
    setMode(newMode);
  };

  return { mode, setMode, toggleMode };
}

export default function ModeSwitch({ className, onModeChange }: ModeSwitchProps): JSX.Element {
  const { mode, toggleMode } = useAppMode();
  const [showHint, setShowHint] = useState(false);

  // Notify parent of mode changes
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // Show keyboard shortcut hint on first render
  useEffect(() => {
    const hintShown = localStorage.getItem('mode-switch-hint-shown');
    if (!hintShown) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('mode-switch-hint-shown', 'true');
      }, 5000); // Show for 5 seconds
    }
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  return (
    <div className={clsx('relative', className)}>
      {/* Keyboard hint tooltip */}
      {showHint && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in z-50">
          <Keyboard className="inline h-3 w-3 mr-1" />
          Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K to toggle
        </div>
      )}

      {/* Mode Switch Toggle */}
      <button
        onClick={toggleMode}
        className={clsx(
          'relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300',
          'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2',
          mode === 'voice'
            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white focus:ring-orange-500 shadow-lg shadow-orange-500/25'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white focus:ring-blue-500 shadow-lg shadow-blue-500/25'
        )}
        title={`Switch to ${mode === 'voice' ? 'Visual' : 'Voice'} Mode (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K)`}
        aria-label={`Switch to ${mode === 'voice' ? 'Visual' : 'Voice'} Mode`}
      >
        {/* Icon with animation */}
        <div className="relative">
          {mode === 'voice' ? (
            <MessageCircle className="h-5 w-5 animate-pulse" />
          ) : (
            <LayoutDashboard className="h-5 w-5" />
          )}
        </div>

        {/* Label */}
        <span className="hidden sm:inline text-sm">
          {mode === 'voice' ? 'Voice Mode' : 'Visual Mode'}
        </span>

        {/* Toggle indicator */}
        <div className="absolute -right-1 -top-1 w-2 h-2 bg-white rounded-full animate-ping" />
        <div className="absolute -right-1 -top-1 w-2 h-2 bg-white rounded-full" />
      </button>
    </div>
  );
}
